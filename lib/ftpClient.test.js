const test = require("ava");
const ftpClient = require("./ftpClient");

test("get file list via FTP", async t => {
    const opts = {
        host: "speedtest.tele2.net",
        port: 21,
        user: "anonymous",
        password: "anonymous"
    }

    const fileList = await ftpClient.listFiles(opts);
    console.log(fileList)
    t.not(fileList.length, 0, "file list is not empty")
    t.assert(fileList)
})

test("download all files in current ftp directory", t => {
    const opts = {
        host: "speedtest.tele2.net",
        port: 21,
        user: "anonymous",
        password: "anonymous"
    }

    const fileList = [
        '1KB.zip',
        '1MB.zip',
        '20MB.zip',
        '2MB.zip',
        '3MB.zip'
    ]
    
    for (let i = 0; i < fileList.length; i++) {
        console.log(fileList[i]);
        
        ftpClient.downloadFile(fileList[i], opts);
    }

    console.log("done!");
    

    t.pass()
})