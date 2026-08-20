const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("updateAPI", {

    onUpdateInfo: (callback) => {
        ipcRenderer.on("update-info", (event, data) => {
            callback(data);
        });
    },

    onDownloadProgress: (callback) => {
        ipcRenderer.on("download-progress", (event, data) => {
            callback(data);
        });
    },

    onUpdateReady: (callback) => {
        ipcRenderer.on("update-ready", (event, data) => {
            callback(data);
        });
    },

    restartAndInstall: () => {
        ipcRenderer.send("restart-and-install");
    },

    closeUpdateWindow: () => {
        ipcRenderer.send("close-update-window");
    }

});