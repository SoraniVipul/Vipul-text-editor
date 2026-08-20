

let isModified = false;

const editor = document.getElementById("editor");

const cursorPosition = document.getElementById("cursorPosition");
const characterCount = document.getElementById("characterCount");
const wordCount = document.getElementById("wordCount");
const currentFilePath = document.getElementById("currentFile");

let toastTimer = null;

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toast || !toastMessage) return;

    // Previous timer clear
    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastMessage.textContent = message;

    // Remove old classes
    toast.classList.remove(
        "success",
        "error",
        "info"
    );

    // Add new type
    toast.classList.add(type);

    // Show
    toast.classList.add("show");

    // Hide after 3 seconds
    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}



function updateStatusBar() {

    const text = editor.value;

    // Character count
    characterCount.textContent =
        "Characters: " + text.length;


    // Word count
    const words = text.trim()
        ? text.trim().split(/\s+/).length
        : 0;

    wordCount.textContent =
        "Words: " + words;


    // Cursor position
    const cursorIndex = editor.selectionStart;

    const beforeCursor = text.substring(0, cursorIndex);

    const lines = beforeCursor.split("\n");

    const line = lines.length;

    const column = lines[lines.length - 1].length + 1;

    cursorPosition.textContent =
        `Ln ${line}, Col ${column}`;
}


editor.addEventListener("input", updateStatusBar);

editor.addEventListener("keyup", updateStatusBar);

editor.addEventListener("click", updateStatusBar);




// Initial status
updateStatusBar();

editor.addEventListener("input", () => {

    if (!isModified) {
        isModified = true;
        window.electronAPI.setIsModifiedUpdate(isModified);
    }
});


function openFile() {
    window.electronAPI.openFile();
}
function saveFile() {

    const data = editor.value;
    window.electronAPI.saveFile(data);
}
function saveAsFile() {
    const data = editor.value;
    window.electronAPI.saveAsFile(data);
}
function newFile() {

    window.electronAPI.onNewFileCreat();

}

window.electronAPI.onMenuNewFile(() => {
    newFile();
});

window.electronAPI.onMenuOpenFile(() => {
    openFile();
})
window.electronAPI.onMenuSaveFile(() => {
    saveFile();
})

window.electronAPI.onMenuSaveAsFile(() => {
    saveAsFile();
})

window.electronAPI.onNewfieResult((result) => {
    
    if (result.success) {
        editor.value = ""
        isModified = false;
        currentFilePath.textContent = result.newPath;
        showToast(result.message || "New File Create Successfully  .", "success");
        updateStatusBar();
    }
    else
    {
         showToast(result.message || "New File Create failed.", "error");
    }
});

window.electronAPI.onMenuRecentFile((filePath) => {

    window.electronAPI.openRecentFile(filePath);

});

window.electronAPI.onFileSaveResult((result) => {
    console.log("this is save  result : ", result.message);

    if (result.success) {
        currentFilePath.textContent = "Current File: " + result.newPath;
        showToast(result.message || "File Save Successfully  .", "success");
        isModified = false;
    } else {
        showToast(result.message || "File Save failed.", "error");
    }
});




window.electronAPI.onFileSaveAsResult((result) => {
    console.log("this is save as result : ", result.message);

    if (result.success) {
        currentFilePath.textContent = "Current File: " + result.newPath;
        showToast(result.message || "File Save As Successfully  .", "success");
        isModified = false;
    } else {
        showToast(result.message || "File Save As failed.", "error");
    }

});

window.electronAPI.onFileOpenResult((result) => {


    if (result.success) {
        editor.value = result.data;
        currentFilePath.textContent = "Current File: " + result.newPath;
        showToast(result.message || "File Open Successfuly  .", "success");
        isModified = false;
        updateStatusBar();

    } else {
        showToast(result.message || "File Open failed.", "error");
    }
});





window.electronAPI.onGetEditorContent(() => {

    const content = editor.value;

    window.electronAPI.sendEditorContent(content);

});



document.addEventListener("keydown", (event) => {

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveAsFile()
    } else if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        console.log("Ctrl + S pressed");
        saveFile();
    } else if (event.ctrlKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        openFile();
    } else if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        newFile();
    }


});
