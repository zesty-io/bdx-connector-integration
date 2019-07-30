
const ftp = require("basic-ftp")
const parseLib = require("./lib/parse")
const bodyParser = require("body-parser")
const request = require('request')
const zestyAPI = require('zestyio-api-wrapper')

const fs = require("fs")
require('env-yaml').config()

exports.bdxIntegration = (req, res) => {
  const cors = require('cors')()
    console.log('running')
  cors(req, res, () => {
    exportBDXIntegration(req, res)
  })
}

const exportBDXIntegration = async (req, res) => {
    console.log('running')
    const client = new ftp.Client()
    client.ftp.verbose = false
    try {
        await client.access({
            host: process.env.FTPHOST,
            user: process.env.FTPUSER,
            password: process.env.FTPPASS,
            secure: false
        })
        let list = await client.list()
        
       // res.json(list)
        let writableStream = ""
        let remoteFilename = list[0].name;
         
        await client.download(fs.createWriteStream("/tmp/file.xml"), remoteFilename).catch(err => {
            console.log(err.toString());
        })
        client.close() // close ftp connection
       
        var convert = require('xml-js');
        var xml = require('fs').readFileSync('/tmp/file.xml', 'utf8');
        var options = {compact: true};
        var parsedJSON = convert.xml2js(xml, options);
        //parsedJSON.Builders.Corporation.Builder.Subdivision.SubImage // array
        //parsedJSON.Builders.Corporation.Builder.Subdivision.Plan // array
        res.send(parsedJSON.Builders.Corporation.Builder.Subdivision.Plan); //parsedJSON.Builders.Corporation.Builder.Subdivision.SubImage.Plan);

        //await client.upload(fs.createReadStream("README.md"), "README.md")
    }
    catch(err) {
        console.log(err)
    }
    
}


// const zestyLogin = async (email, password) => {
//     return new Promise((resolve, reject) => {
//         request.post({
//             url: 'https://svc.zesty.io/auth/login',
//             formData: {
//                 email,
//                 password
//             },
//             json: true
//         }, (error, response, body) => {
//             if (error) {
//                 return reject({
//                     errorCode: -1,
//                     errorMessage: 'Unexpected error.'
//                 })
//             }

//             if (response.statusCode !== 200) {
//                 return reject({
//                     errorCode: response.statusCode,
//                     errorMessage: body.message || ''
//                 })
//             }

//             return resolve(body.meta.token)
//         })
//     })
// }

// const zestyVerifyToken = async(token) => {
//     return new Promise((resolve, reject) => {
//         request.get({
//             url: 'https://svc.zesty.io/auth/verify',
//             headers: {
//                 Authorization: `Bearer ${token}`
//             },
//             json: true
//         }, (error, response, body) => {
//             if (error) {
//                 return reject({
//                     errorCode: -1,
//                     errorMessage: 'Unexpected error.'
//                 })
//             }

//             if (response.statusCode !== 200) {
//                 return resolve(false)
//             }

//             return resolve(true)
//         })
//     })
// }

// const goZesty = async () => {
//     // Get user email address and password...
//     const email = process.env.ZESTY_USER_EMAIL_ADDRESS
//     const password = process.env.ZESTY_USER_PASSWORD

//     // Get the instance ZUID to work with
//     const instanceZUID = process.env.ZESTY_INSTANCE_ZUID

//     try {
//         // Attempt to login and retrieve access token
//         let zestyToken = await zestyLogin(email, password)

//         // Try verifying token, expect true
//         let isValidToken = await zestyVerifyToken(zestyToken)
//         console.log(`Token is ${isValidToken ? '' : 'not '}valid.`)

//         // Instantiate API and test it
//         // const zesty = new zestyAPI(instanceZUID, zestyToken)
//         // const views = await zesty.getViews()

//         //console.log(views)
//     } catch (ex) {
//         console.error('Error accessing zesty.io:')
//         console.error(ex)
//     }
// }

//goZesty()

// zesty({
//         instance: process.env.ZESTY_INSTANCE_ZUID,
//         token: process.env.,
//         email: process.env.ZESTY_USER_EMAIL,
//         password: process.env.ZESTY_USER_PASSWORD,
//         options: {
//             authURL: process.env.ZESTY_AUTH_API,
//             instancesAPIURL: process.env.ZESTY_INSTANCE_API,
//             accountsAPIURL: process.env.ZESTY_ACCOUNTS_API
//         }
//     })

