

let isModified = false;






function openFile() {
    window.electronAPI.openFile();
}
function saveFile() {

    const data = document.getElementById("editor").value;
    window.electronAPI.saveFile(data);
}
function saveAsFile() {
    const data = document.getElementById("editor").value;
    window.electronAPI.saveAsFile(data);
}
function newFile() {

    window.electronAPI.onNewFileCreat();

}

window.electronAPI.onMenuNewFile(() => {
    newFile();
});

window.electronAPI.onMenuOpenFile(()=>{
    openFile();
})
window.electronAPI.onMenuSaveFile(()=>{
    saveFile();
})

window.electronAPI.onMenuSaveAsFile(()=>{
    saveAsFile();
})

window.electronAPI.onNewfieResult((result) => {
    if (result.success) {
        document.getElementById("editor").value = ""
        isModified = false;
        document.getElementById("currentFile").textContent = result.message;
    }
});

document.getElementById("editor").addEventListener("input", () => {
   
    if (!isModified){
        isModified = true;
        window.electronAPI.setIsModifiedUpdate(isModified);
    }
});



window.electronAPI.onFileSaveResult((result) => {
     console.log("this is save  result : " , result.message);
    const response = document.getElementById("currentFile");
    response.textContent = result.message;
     if (result.success) {
        isModified = false;
     } 
});




window.electronAPI.onFileSaveAsResult((result) => {
    console.log("this is save as result : " , result.message);
    const response = document.getElementById("currentFile");
    response.textContent = result.message;
     if (result.success) {
        isModified = false;
     } 
   
});

window.electronAPI.onFileOpenResult((result) => {

    const response = document.getElementById("response");
    if (result.success) {
        document.getElementById("editor").value = result.data;
        document.getElementById("currentFile").textContent = "Current File: " + result.filePath;
        isModified = false;

    } else {
        document.getElementById("currentFile").textContent = result.message;
    }
});





window.electronAPI.onGetEditorContent(() => {

    const content = document.getElementById("editor").value;

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
