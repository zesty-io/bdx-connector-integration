
module.exports.connectToFTPandDownloadXML = async function (host, user, pass){
    const fs  = require('fs')
    const ftp = require("basic-ftp")
    
    const client = new ftp.Client()
    client.ftp.verbose = false
    try {
        await client.access({
            host: host,
            user: user,
            password: pass,
            secure: false
        })
        let list = await client.list()
        let writableStream = ""
        let remoteFilename = list[0].name;
         
        await client.download(fs.createWriteStream("/tmp/bdx.xml"), remoteFilename).catch(err => {
            console.log(err.toString());
        })

        // write file with date to the ftp to tell them a zesty sync occured
        // let filename = 'zesty-sync.txt'
        // let filepath = '/tmp/' + filename
        // var dateSynced = new Date();
        // fs.writeFile(filepath,dateSynced.toUTCString())
        // await client.upload(fs.createReadStream(filepath), filename)

        client.close() // close ftp connection

    } catch(err) {
        console.log(err)
    }   
}