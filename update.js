window.updateAPI.onUpdateInfo((data) => {

    document.getElementById("versionText").textContent =
        "New version available: " + data.version;

});


window.updateAPI.onDownloadProgress((data) => {

    const percent = Math.round(data.percent);

    document.getElementById("progressBar").style.width =
        percent + "%";

    document.getElementById("percent").textContent =
        percent + "%";

    document.getElementById("downloadSize").textContent =
        data.transferred + " MB / " + data.total + " MB";

});


window.updateAPI.onUpdateReady((data) => {

    document.getElementById("downloadScreen").style.display =
        "none";

    document.getElementById("readyScreen").style.display =
        "block";

    document.getElementById("readyVersion").textContent =
        "Version " + data.version + " is ready.";
});


document.getElementById("restartBtn").addEventListener(
    "click",
    () => {

        window.updateAPI.restartAndInstall();

    }
);


document.getElementById("laterBtn").addEventListener(
    "click",
    () => {

        window.updateAPI.closeUpdateWindow();

    }
);