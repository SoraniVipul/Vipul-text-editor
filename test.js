const fs = require("fs").promises;


console.log("A");
async function readFile() {
    try {
        const data = await fs.readFile(
            "my-folder/electron-study.txt",
            "utf8"
        );
        console.log("B in data");
        console.log(data);
    } catch (error) {
        console.log("Error:", error);
    }
    
}


readFile();
console.log("C");
       