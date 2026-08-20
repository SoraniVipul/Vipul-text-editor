// const { promises } = require("dns");
const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem, nativeImage } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs").promises;
const packageInfo = require("./package.json");

let currentFilePath = null;
let isModified = false;

let mainWindow = null
let updateWindow = null
let aboutWindow = null;
let recentFiles = [];
const appIcon = nativeImage.createFromPath(path.join(__dirname, "icon.ico"));


const recentFilesPath = path.join(app.getPath("userData"), "recent-files.json");


async function loadRecentFiles() {
    try {
        const data = await fs.readFile(recentFilesPath, "utf8");
        recentFiles = JSON.parse(data);
        if (!Array.isArray(recentFiles)) {
            recentFiles = [];
        }
    } catch (error) {
        recentFiles = [];
    }
}


async function saveRecentFiles() {
    try {
        await fs.writeFile(recentFilesPath, JSON.stringify(recentFiles, null, 2), "utf8");
    } catch (error) {
        console.log("Unable to save recent files:", error.message);
    }
}


async function addRecentFile(filePath) {
    if (!filePath) {
        return;
    }
    // Same file remove
    recentFiles = recentFiles.filter(
        file => file !== filePath
    );

    // New file beginningમાં
    recentFiles.unshift(filePath);

    // Maximum 10 files
    recentFiles = recentFiles.slice(0, 10);

    await saveRecentFiles();

    buildRecentFilesMenu();

}




function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
         icon: appIcon,
        webPreferences: {
            preload: path.join(__dirname, "/preload.js"),
        }
    });

    mainWindow.loadFile("index.html");

    const templet = [
        {
            label: "File",
            submenu: [
                {
                    label: "New",
                    accelrator: "Ctrl+N",
                    click: () => {
                        console.log("Menu -> new cliced");
                        mainWindow.webContents.send("menu-new-file");

                    }
                },
                {
                    label: "Open",
                    accelrator: "Ctrl+O",
                    click: () => {
                        console.log("Menu -> Opne Clicked");
                        mainWindow.webContents.send("menu-open-file");
                    }
                },
                {
                    label: "Save",
                    accelrator: "Ctrl+S",
                    click: () => {
                        console.log("Menu -> Opne Clicked");
                        mainWindow.webContents.send("menu-save-file");
                    }
                },
                {
                    label: "Save As",
                    accelrator: "Ctrl+Shift+s",
                    click: () => {
                        console.log("Menu -> Opne Clicked");
                        mainWindow.webContents.send("menu-saveas-file");
                    }
                },
                {
                    label: "Recent Files",
                    submenu: []
                },
                {
                    label: "Exit",
                    accelrator: "Alt+F4",
                    click: () => {
                        console.log("Menu -> Opne Clicked");
                        mainWindow.close();
                    }
                }

            ]

        },
        {
            label: "Edit",
            submenu: [
                {
                    label: "Undo",
                    role: "undo"
                },
                {
                    label: "Redo",
                    role: "uedo",
                    accelrator: "Ctrl + Y",
                },
                {
                    label: "Cut",
                    role: "cut"
                },
                {
                    label: "Copy",
                    role: "copy"
                },
                {
                    label: "Paste",
                    role: "paste"
                },
                {
                    label: "Select All",
                    role: "selectAll"
                },
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Reload",
                    click: async () => {
                        console.log("Menu → Reload clicked");
                        const result = await checkUnsavedChanges();
                        if (result === "save") {
                            const content = await getEditorContent();
                            const saveResult = await saveFile(content);
                            if (!saveResult.success) {
                                return;
                            }
                            mainWindow.reload();
                        }
                        else if (result === "discard") {
                            mainWindow.reload();
                        }
                        else if (result === "cancel") {
                            return;
                        }
                    }
                },
                {
                    label: "Force Reload",
                    role: "forceReload"
                },
                {
                    label: "Taggle Developer Tools",
                    role: "toggleDevTools"
                }
            ]
        },
        {
            label: "Window",
            submenu: [
                {
                    label: "Minimize",
                    role: "minimize"
                },
                {
                    label: "Close",
                    role: "close"
                }
            ]
        },
        {
            label: "Help",
            submenu: [
                {
                    label: "About",
                    click: () => {
                        createAboutWindow();
                    }

                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(templet);

    Menu.setApplicationMenu(menu);


    // Ask the user to save if there are unsaved changes when they try to close
    mainWindow.on("close", async (event) => {
        console.log("Window is trying to close");


        if (isModified) {
            event.preventDefault();
            const result = await checkUnsavedChanges();

            console.log("Result:", result);
            if (result === "save") {

                const content = await getEditorContent()
                const saveResult = await saveFile(content);
                if (saveResult.success) {
                    console.log("Closing After Saving saving...");
                    isModified = false;
                    mainWindow.close();

                }
            }
            else if (result === "discard") {
                console.log("Closing without saving...");
                isModified = false;
                mainWindow.close();
            }
            else {
                // response === 2 -> Cancel: do nothing (keep the window open)

                console.log("Close canceled by user");
            }
        }
    });

}

function buildRecentFilesMenu() {

    const menu = Menu.getApplicationMenu();

    if (!menu) {
        return;
    }

    const fileMenu = menu.items.find(
        item => item.label === "File"
    );

    if (!fileMenu) {
        return;
    }

    const recentMenu = fileMenu.submenu.items.find(
        item => item.label === "Recent Files"
    );

    if (!recentMenu) {
        return;
    }

    recentMenu.submenu.clear();

    if (recentFiles.length === 0) {
        recentMenu.submenu.append(
            new MenuItem({
                label: "No Recent Files",
                enabled: false
            })
        );

    } else {
        recentFiles.forEach(filePath => {
            recentMenu.submenu.append(
                new MenuItem({
                    label: path.basename(filePath),
                    toolTip: filePath,
                    click: () => {
                        mainWindow.webContents.send("menu-recent-file", filePath);
                    }
                })
            );
        });
    }
    recentMenu.submenu.append(
        new MenuItem({
            type: "separator"
        })
    );

    recentMenu.submenu.append(
        new MenuItem({
            label: "Clear Recent Files",
            click: async () => {
                recentFiles = [];
                await saveRecentFiles();
                buildRecentFilesMenu();
                mainWindow.webContents.send("recent-files", recentFiles);
            }
        })
    );
    Menu.setApplicationMenu(menu);
}

function createUpdateWindow() {

    if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.focus();
        return;
    }

    updateWindow = new BrowserWindow({
        width: 420,
        height: 300,
         icon: appIcon,
        resizable: false,
        minimizable: false,
        maximizable: false,
        parent: mainWindow,
        modal: false,
        
        webPreferences: {
            preload: path.join(__dirname, "update-preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    updateWindow.loadFile("update.html");

    updateWindow.on("closed", () => {
        updateWindow = null;
    });

}

function createAboutWindow() {

    if (aboutWindow && !aboutWindow.isDestroyed()) {
        aboutWindow.focus();
        return;
    }

    aboutWindow = new BrowserWindow({
        width: 430,
        height: 430,
         icon: appIcon,

        resizable: false,
        minimizable: false,
        maximizable: false,

        parent: mainWindow,

        modal: false,

        webPreferences: {
            preload: path.join(__dirname, "about-preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    aboutWindow.loadFile("about.html");

    aboutWindow.webContents.once("did-finish-load", () => {

        aboutWindow.webContents.send("about-info", {

            version: packageInfo.version,

            author: "Vipul Sorani",

            electronVersion:
                process.versions.electron,

            platform:
                process.platform

        });

    });

    aboutWindow.on("closed", () => {

        aboutWindow = null;

    });

}

app.whenReady().then(async () => {
    await loadRecentFiles();
    createWindow();
    buildRecentFilesMenu();
    setupAutoUpdater();
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }
});

function setupAutoUpdater() {

    autoUpdater.on("checking-for-update", () => {

        console.log("Checking for update...");

    });


    autoUpdater.on("update-available", (info) => {


        console.log("Update available:", info.version);

        if (aboutWindow && !aboutWindow.isDestroyed()) {

            aboutWindow.webContents.send(
                "about-update-status",
                {
                    type: "available",
                    message: `New version available: ${info.version}`
                }
            );

        }

        createUpdateWindow();

        // Window load થયા પછી data મોકલવું
        updateWindow.webContents.once("did-finish-load", () => {

            updateWindow.webContents.send("update-info", {
                version: info.version
            });

        });

    });


    autoUpdater.on("download-progress", (progress) => {

        console.log(
            "Download:",
            Math.round(progress.percent) + "%"
        );

        if (updateWindow && !updateWindow.isDestroyed()) {

            updateWindow.webContents.send("download-progress", {

                percent: progress.percent,

                transferred:
                    (progress.transferred / 1024 / 1024).toFixed(1),

                total:
                    (progress.total / 1024 / 1024).toFixed(1)

            });

        }

    });


    autoUpdater.on("update-downloaded", (info) => {

        console.log(
            "Update downloaded:",
            info.version
        );

        if (updateWindow && !updateWindow.isDestroyed()) {

            updateWindow.webContents.send("update-ready", {

                version: info.version

            });

        }

    });


    autoUpdater.on("update-not-available", (info) => {

        if (aboutWindow && !aboutWindow.isDestroyed()) {

            aboutWindow.webContents.send(
                "about-update-status",
                {
                    type: "success",
                    message: "You are using the latest version."
                }
            );

        }

        console.log(
            "No update available. Current:",
            autoUpdater.currentVersion.version
        );

    });


    autoUpdater.on("error", (error) => {

        console.log(
            "Update error:",
            error.message
        );
        if (aboutWindow && !aboutWindow.isDestroyed()) {

            aboutWindow.webContents.send(
                "about-update-status",
                {
                    type: "error",
                    message: "Unable to check for updates."
                }
            );

        }

        // Update window હોય તો બંધ કરો
        if (updateWindow && !updateWindow.isDestroyed()) {

            updateWindow.close();

        }

        dialog.showMessageBox(mainWindow, {

            type: "error",

            title: "Update Error",

            message: "Unable to update application.",

            detail: error.message

        });

    });

}

function windowTitleUpdate(mainWindow) {
    if (!currentFilePath) {
        mainWindow.setTitle("Untitle -Vipul Text Editor");
        return;
    }
    const filename = path.basename(currentFilePath)
    if (isModified) {
        mainWindow.setTitle("*" + filename + " - Vipul Text Editor");
    } else {
        mainWindow.setTitle(filename + " - Vipul Text Editor");
    }

}

async function checkUnsavedChanges() {

    // isModified = await getModifiedStatus();

    if (!isModified) {
        return "discard";
    }
    const { response } = await dialog.showMessageBox(
        mainWindow,
        {
            type: "question",
            title: "Unsaved Changes",
            message: "Do you want to save changes?",
            buttons: [
                "Save",
                "Don't Save",
                "Cancel"
            ],
            defaultId: 0,
            cancelId: 2
        }
    );
    if (response === 0) {
        return "save";
    }
    else if (response === 1) {
        return "discard";
    } else {
        return "cancel";
    }
}


function getModifiedStatus() {
    return new Promise((resolve) => {
        ipcMain.once("modified-status-response", async (event, modified) => {
            resolve(modified);
        });
        mainWindow.webContents.send("get-modified-status",);
    })
}

async function saveFile(data) {
    if (currentFilePath) {
        return (writeFile(currentFilePath, data));
    } else {
        return (saveAsFile(data));
    }

}
async function saveAsFile(data) {
    const result = await dialog.showSaveDialog({
        title: "Save My File",
        defaultPath: "mydata.txt"
    });
    if (!result.canceled) {
        let savefilepath = result.filePath;
        const extension = path.extname(savefilepath);
        if (!extension) {
            savefilepath += ".txt";
        }
        else if (extension.toLowerCase() !== ".txt") {
            savefilepath = savefilepath.substring(0, (savefilepath.length - extension.length)) + ".txt";
        }
        return (writeFile(savefilepath, data));
    } else {
        return ({ success: false, message: "File save operation was canceled." });
    }

}
async function writeFile(path, content) {
    try {
        await fs.writeFile(path, content, "utf8");
        currentFilePath = path;
        await addRecentFile(path);
        isModified = false;
        windowTitleUpdate(mainWindow);
        return ({ success: true, message: "Successfully saved file", newPath: path });

    }
    catch (err) {
        return ({ success: false, message: "Not saved successfully: error is ->" + err.message })
    }

}
async function getEditorContent() {
    return new Promise((resolve) => {
        ipcMain.once("editor-content-response", async (event, content) => {
            resolve(content);
        });
        mainWindow.webContents.send("get-editor-content",);
    })
}
ipcMain.on("save-file", async (event, data) => {

    if (isModified) {

        const result = saveFile(data);
        console.log(await result)
        event.sender.send("file-save-result", await result);

    }

});

ipcMain.on("is-modified-update", async (event, modified) => {
    isModified = modified;
    windowTitleUpdate(mainWindow);
    console.log('Modified stutus is :', isModified)
});

ipcMain.on("open-file", async (event) => {

    const unsavResult = await checkUnsavedChanges();

    if (unsavResult === "save") {
        const content = await getEditorContent();
        const saveResut = await saveFile(content);
        if (!saveResut.success) {
            return;
        }
    } else if (unsavResult === "cancel") {
        return;
    }

    try {
        const result = await dialog.showOpenDialog({
            title: "Open Text File",
            properties: ["openFile"],
            filters: [
                {
                    name: "Text Files",
                    extensions: ["txt"]
                }
            ]
        });
        if (result.canceled) {
            event.sender.send(
                "file-open-result",
                {
                    success: false,
                    canceled: true,
                    message: "File open operation was canceled."
                }
            );
            return;
        }
        currentFilePath = result.filePaths[0];
        await addRecentFile(currentFilePath);
        const data = await fs.readFile(currentFilePath, "utf8");
        event.sender.send("file-open-result",
            {
                success: true,
                canceled: false,
                newPath: currentFilePath,
                data: data
            }
        );
        isModified = false;
        windowTitleUpdate(mainWindow);
    }
    catch (error) {
        console.log("Error:", error);
        event.sender.send(
            "file-open-result",
            {
                success: false,
                canceled: false,
                message: "File read failed."
            }
        );

    }
    console.log("Current File:", currentFilePath);
});

ipcMain.on("save-as-file", async (event, data) => {
    const result = await saveAsFile(data);
    console.log(await result)
    event.sender.send("file-saveas-result", await result);
});

ipcMain.on("close-update-window", () => {

    if (updateWindow && !updateWindow.isDestroyed()) {

        updateWindow.close();

    }

});

ipcMain.on("about-close", () => {
    if (aboutWindow && !aboutWindow.isDestroyed()) {
        aboutWindow.close();
    }
});

ipcMain.on("new-file-create", async (event) => {


    const result = await checkUnsavedChanges();

    console.log("Result:", result);

    if (result === "save") {
        const content = await getEditorContent()
        const saveResult = await saveFile(content);
        if (!saveResult.success) {
            event.sender.send("new-file-result",
                { success: false, message: "New File not Create:." }
            );
            return;
        }
    }
    else if (result === "cancel") {
        event.sender.send("new-file-result",
            { success: false, message: "New File Create Cancaled:." }
        );
        return;
    }
    console.log("new File is create");
    currentFilePath = null;
    isModified = false;

    windowTitleUpdate(mainWindow);
    event.sender.send("new-file-result",
        { success: true, message: "New File Created :.", newPath: "New File Not Path selected...." }
    );

});

ipcMain.on("open-recent-file", async (event, filePath) => {
    const unsavResult = await checkUnsavedChanges();
    if (unsavResult === "save") {
        const content = await getEditorContent();
        const saveResult = await saveFile(content);
        if (!saveResult.success) {
            return;
        }
    } else if (unsavResult === "cancel") {
        return;
    }
    try {
        const data = await fs.readFile(filePath, "utf8");
        currentFilePath = filePath;
        isModified = false;
        await addRecentFile(filePath);
        windowTitleUpdate(mainWindow);
        event.sender.send("file-open-result",
            {
                success: true,
                canceled: false,
                newPath: filePath,
                data: data
            }
        );

    } catch (error) {
        // File delete/move થઈ ગઈ હોય
        recentFiles = recentFiles.filter(file => file !== filePath);
        await saveRecentFiles();
        buildRecentFilesMenu();
        event.sender.send("file-open-result",
            {
                success: false,
                canceled: false,
                message: "File could not be opened: " + error.message
            }
        );
    }
});


ipcMain.on("about-check-for-updates", async () => {

    if (!aboutWindow || aboutWindow.isDestroyed()) {
        return;
    }

    aboutWindow.webContents.send(
        "about-update-status",
        {
            type: "checking",
            message: "Checking for updates..."
        }
    );

    try {

        await autoUpdater.checkForUpdates();

    } catch (error) {

        aboutWindow.webContents.send(
            "about-update-status",
            {
                type: "error",
                message: "Unable to check for updates."
            }
        );

    }

});





