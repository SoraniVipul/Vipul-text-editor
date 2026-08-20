// const { promises } = require("dns");
const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs").promises;
const packageInfo = require("./package.json");

let currentFilePath = null;
let isModified = false;
let isWaitingForCloseSave = false;
let mainWindow = null

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,

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
                        dialog.showMessageBox(mainWindow,
                            {
                                type: "info",
                                title: "About The Text Editor",
                                message: "Vipul Text Editor",
                                detail:
                                    "Version: " + packageInfo.version + "\n" +
                                    "Author: Vipul Sorani\n" +
                                    "Built with Electron\n" +
                                    "Electron Version: " + process.versions.electron,
                                buttons: ["OK"]
                            }
                        )
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

app.whenReady().then(()=>{
    createWindow();

    setupAutoUpdater();
    if(app.isPackaged){
    autoUpdater.checkForUpdatesAndNotify();
    }
});

function setupAutoUpdater() {

    autoUpdater.on("checking-for-update", () => {
        console.log("Checking for update...");
    });

    autoUpdater.on("update-available", (info) => {
        console.log("Update available:", info.version);
    });

    autoUpdater.on("update-not-available", (info) => {
        console.log("No update available.");
    });

    autoUpdater.on("error", (error) => {
        console.log("Update error:", error.message);
    });

    autoUpdater.on("download-progress", (progress) => {
        console.log(
            "Download progress:",
            Math.round(progress.percent) + "%"
        );
    });

    autoUpdater.on("update-downloaded", (info) => {
        console.log("Update downloaded:", info.version);
    });
}






function updateWindowTitle(mainWindow) {
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
        return (writeFile(result.filePath, data));
    } else {
        return ({ success: false, message: "File save operation was canceled." });
    }

}
async function writeFile(path, content) {
    try {
        await fs.writeFile(path, content, "utf8");
        currentFilePath = path;
        isModified = false;
        updateWindowTitle(mainWindow);
        return ({ success: true, message: "Successfully saved file" });

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
    updateWindowTitle(mainWindow);
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
        const data = await fs.readFile(currentFilePath, "utf8");
        event.sender.send("file-open-result",
            {
                success: true,
                canceled: false,
                filePath: currentFilePath,
                data: data
            }
        );
        isModified = false;
        updateWindowTitle(mainWindow);
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



ipcMain.on("new-file-create", async (event) => {


    const result = await checkUnsavedChanges();

    console.log("Result:", result);

    if (result === "save") {
        const content = await getEditorContent()
        const saveResult = await saveFile(content);
        if (!saveResult.success) {
            return;
        }
    }
    else if (result === "cancel") {
        return;
    }
    console.log("new File is create");
    currentFilePath = null;
    isModified = false;

    updateWindowTitle(mainWindow);
    event.sender.send("new-file-result",
        { success: true, message: "New File Created :." }
    );

});








