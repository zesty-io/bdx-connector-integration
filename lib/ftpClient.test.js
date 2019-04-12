const test = require("ava");
const ftpClient = require("./ftpClient");
const fs = require("fs");

test("get file list via FTP", async t => {
    const opts = {
        host: "speedtest.tele2.net",
        port: 21,
        user: "anonymous",
        password: "anonymous"
    }

    const fileList = await ftpClient.listFiles(opts);
    t.not(fileList.length, 0, "file list is not empty")
    t.assert(fileList)
})

test("download a single file", async t => {
    const opts = {
        host: "speedtest.tele2.net",
        port: 21,
        user: "anonymous",
        password: "anonymous"
    }

    const fd = await ftpClient.downloadFile('1MB.zip', opts);
    t.truthy(fs.fstatSync(fd));
})
