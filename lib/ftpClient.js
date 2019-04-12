const Client = require("ftp");
const fs = require("fs")
const fsPromises = require("fs").promises;


function listFiles(opts, path="") {
    return new Promise((resolve,reject) => {
        const c = new Client();
        c.on("ready", () => {
            c.list(path, (err, list) => {
                if (err) {
                    reject(err);
                } else {
                    const fileList = list.map(l => l["name"])
                    c.end()
                    resolve(fileList)
                }
            })
        })
        c.connect(opts)
    })
}

function downloadFile(fileName, opts, path="") {
    return new Promise((resolve, reject) => {
        const c = new Client();
        c.on("ready", () => {
            c.get(`${path}/${fileName}`, (err, stream) => {
                if (err) {
                    reject(err);
                } else {
                    stream.pipe(fs.createWriteStream(fileName));
                    stream.once("close", () => {
                        c.end()
                        fs.open(fileName, "r", (err, fd) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(fd);
                            }
                        })
                    });
                }
            });
        });
        c.connect(opts)
    })
}

module.exports = { listFiles, downloadFile }