const { contextBridge, ipcRenderer } = require("electron");



contextBridge.exposeInMainWorld("electronAPI", {

    saveAsFile: (data) => {
        ipcRenderer.send("save-as-file", data);
    },
    onFileSaveAsResult: (callback) => {
        ipcRenderer.on("file-saveas-result", (event, result) => {
            callback(result);
        });
    },

    // setModified: (modified) => {
    //     ipcRenderer.send("set-modified", modified);
    // },

    saveFile: (data) => {
        ipcRenderer.send("save-file", data);
    },
    onFileSaveResult: (callback) => {
        ipcRenderer.on("file-save-result", (event, result) => {
            callback(result);
        });
    },

    onNewFileCreat: (callback) => {
        ipcRenderer.send("new-file-create");
    },
    openSaveDialog: (data) => {
        ipcRenderer.send("open-save-dialog", data);
    },
    setIsModifiedUpdate: (modified) => {
        ipcRenderer.send("is-modified-update", modified)
    },

    openFile: () => {
        ipcRenderer.send("open-file");
    },
    onFileOpenResult: (callback) => {
        ipcRenderer.on("file-open-result", (event, result) => {
            callback(result);
        });
    },

    onNewfieResult: (callback) => {
        ipcRenderer.on("new-file-result", (event, result) => {
            callback(result);
        })
    },


    onGetEditorContent: (callback) => {
        ipcRenderer.on("get-editor-content", () => {
            callback();
        });
    },

    sendEditorContent: (content) => {
        ipcRenderer.send("editor-content-response", content);
    },
    onGetModifiedStatus: (callback) => {
        ipcRenderer.on("get-modified-status", () => {
            callback();
        });
    },

    sendModifiedStatus: (modified) => {
        ipcRenderer.send("modified-status-response", modified);
    },
    onMenuNewFile: (callback) => {
        ipcRenderer.on("menu-new-file", () => {
            callback();
        });
    },
    onMenuOpenFile: (callback) => {

        ipcRenderer.on("menu-open-file", () => {
            callback();
        });

    },
     onMenuSaveFile: (callback) => {

        ipcRenderer.on("menu-save-file", () => {
            callback();
        });

    }, onMenuSaveAsFile: (callback) => {

        ipcRenderer.on("menu-saveas-file", () => {
            callback();
        });

    },

});