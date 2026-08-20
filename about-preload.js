const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aboutAPI", {

    onAboutInfo: (callback) => {

        ipcRenderer.on("about-info", (event, data) => {

            callback(data);

        });

    },


    checkForUpdates: () => {

        ipcRenderer.send("about-check-for-updates");

    },


    onUpdateStatus: (callback) => {

        ipcRenderer.on("about-update-status", (event, data) => {

            callback(data);

        });

    },


    closeWindow: () => {

        ipcRenderer.send("about-close");

    }

});