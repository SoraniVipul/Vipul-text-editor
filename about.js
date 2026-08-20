window.aboutAPI.onAboutInfo((data) => {

    document.getElementById("appVersion").textContent =
        data.version;

    document.getElementById("author").textContent =
        data.author;

    document.getElementById("electronVersion").textContent =
        data.electronVersion;

    document.getElementById("platform").textContent =
        data.platform;

});


const checkUpdateBtn =
    document.getElementById("checkUpdateBtn");

const updateStatus =
    document.getElementById("updateStatus");


checkUpdateBtn.addEventListener("click", () => {

    updateStatus.textContent =
        "Checking for updates...";

    checkUpdateBtn.disabled = true;

    window.aboutAPI.checkForUpdates();

});


window.aboutAPI.onUpdateStatus((data) => {

    updateStatus.textContent =
        data.message;

    checkUpdateBtn.disabled = false;

});


document.getElementById("closeBtn").addEventListener(
    "click",
    () => {

        window.aboutAPI.closeWindow();

    }
);