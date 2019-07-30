
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
    //console.log('running')
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
        let plansArray = parsedJSON.Builders.Corporation.Builder.Subdivision.Plan
        let preparedPlans = []
        


        for (index = 0; index < plansArray.length; index++) { 
            
            let o = plansArray[index]
            //console.log(o.PlanName._text); 
            let mainImage, floorPlanImage1, floorPlanImage2 = ""

            if (o.hasOwnProperty('PlanImages')){
                mainImage = o.PlanImages.hasOwnProperty('ElevationImage') ? o.PlanImages.ElevationImage._text : ""
                if(Array.isArray(o.PlanImages.ElevationImage)){
                    mainImage = o.PlanImages.ElevationImage[0]._text
                }
                if(Array.isArray(o.PlanImages.FloorPlanImage)){
                    floorPlanImage1 = o.PlanImages.FloorPlanImage[0]._text
                    floorPlanImage2 = o.PlanImages.FloorPlanImage[1]._text
                }
            }

            let halfBaths = o.hasOwnProperty('HalfBaths') ? o.HalfBaths._text : 0;
            let stories = o.hasOwnProperty('Stories') ? o.Stories._text : 1;
            if(o.hasOwnProperty('Spec')){
                halfBaths = o.Spec.hasOwnProperty('SpecHalfBaths') ? o.Spec.SpecHalfBaths._text : halfBaths;
                stories = o.Spec.hasOwnProperty('SpecStories') ?  o.Spec.SpecStories._text : stories;
            }
           

            let planObject = {
                'plan_id': o._attributes.PlanID,
                'plan_name' : o.PlanName._text,
                'marketing_headline' : o.MarketingHeadline._text,
                'main_image' :mainImage,
                'base_price': Math.round(o.BasePrice._text),
                'bedrooms': o.Bedrooms._text,
                'baths': o.Baths._text,
                'half_baths': halfBaths,
                'garage': o.Garage._text,
                'stories': stories,
                'square_footage' : o.BaseSqft._text,
                'builder' : parsedJSON.Builders.Corporation.Builder.BrandName._text,
                'plan_type': unCamelCase(o._attributes.Type),
                'floor_plan_1': floorPlanImage1,
                'floor_plan_2': floorPlanImage2,
                'description' : o.Description._cdata

            }
            let apiPostBody = {
                'content': planObject,
                'meta': {
                    'path_part': slugify(planObject.plan_name)
                }
            }

            preparedPlans.push(apiPostBody)
        } 


        res.send(preparedPlans) //parsedJSON.Builders.Corporation.Builder.Subdivision.Plan); //parsedJSON.Builders.Corporation.Builder.Subdivision.SubImage.Plan);

        //await client.upload(fs.createReadStream("README.md"), "README.md")
    }
    catch(err) {
        console.log(err)
    }
    
}


function unCamelCase(str){
  str = str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, '$1 $2');
  return str;
}

function slugify(string) {
  const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
  const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
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

