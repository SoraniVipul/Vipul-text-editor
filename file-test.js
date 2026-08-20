const fs =require("fs");

const folderName = "My-folder";

if(!fs.existsSync(folderName)){

    fs.mkdirSync(folderName);

    console.log("Folder created successfully!");
}






fs.writeFile(
    folderName + "/data.txt",
    "Hello from my folder!",
    (err) => {
        if (err) {
            console.log("Error creating file:", err);
            return;
        }   
        console.log("File created successfully!");
    }
);
