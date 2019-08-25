

const bodyParser = require("body-parser")
const request = require('request')
const ftp = require("basic-ftp")
const fs = require("fs")

require('env-yaml').config()
example()
 
async function example() {
    const client = new ftp.Client()
    client.ftp.verbose = false
    try {
        await client.access({
            host: process.env.FTPHOST,
            user: process.env.FTPUSER,
            password: process.env.FTPPASS,
            secure: false
        })
        console.log(await client.list())
       // await client.upload(fs.createReadStream("README.md"), "README.md")
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}

