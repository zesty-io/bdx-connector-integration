
const request = require('request')
const Zesty = require("zestyio-api-wrapper");
const fs  = require('fs')
require('env-yaml').config()
let token, zestyAPI

// Zesty.io Content Model to BDX Mapping
// models
const corporationModel = require('./lib/models/corporation.js')
const builderModel = require('./lib/models/builder.js')
const communityImageModel = require('./lib/models/community-image.js')
const planModel = require('./lib/models/plan.js')
const planImageModel = require('./lib/models/plan-image.js')
const specModel = require('./lib/models/spec.js')
const specImageModel = require('./lib/models/spec-image.js')

// utils
const dataFunctions = require('./lib/dataFunctions.js')

// Cloud Function

exports.bdxIntegration = (req, res) => {
  const cors = require('cors')()
    console.log('running')
  cors(req, res, () => {
    exportBDXIntegration(req, res)
  })
}

// Main Function

const exportBDXIntegration = async (req, res) => {

    let to =  {
        '_attributes' : {
            'SequencePosition' : 1
        },
        '_text' : 'helloworld'
    }
    
    try {
        res.json(await dataFunctions.returnHydratedModel(planImageModel,to))
    } catch(err) {
        res.send("Failed to connect to the FTP: " + err)
    }  
    var preparedPostBodies = {
            message: 'hello',
            fullResponse: {},
            prepared: {
                corporate: [],
                builders: [],
                communityImages: [],
                homeModels: [],
                homeModelsImages: [],
                homeModelsListingSpecs: [],
                homeModelsListingSpecs: []

            }
        }
    
    // connect to bdx and download the xml file, ideally the user/host/pass woudl be taken from zesty setting
    try {
        await connectToFTPandDownloadXML(process.env.FTPHOST,process.env.FTPUSER, process.env.FTPPASS)
    } catch(err) {
        res.send("Failed to connect to the FTP: " + err)
    }     
    // read the downloaded file, convert the xml to JSON
    try {
        //parsedJSON.Builders.Corporation.Builder.Subdivision.SubImage // array
        //parsedJSON.Builders.Corporation.Builder.Subdivision.Plan // array
        preparedPostBodies.fullResponse = await xmlToObject('/tmp/bdx.xml')
        
    } catch(err) {
        res.send("Failed to read the XML file: " + err)
    }     

    res.send(preparedPostBodies.fullResponse)
    return
    
    // iterate through the parsed json to build the post bodies  
    try {
        preparedPostBodies.prepared = await parseBDX(preparedPostBodies.fullResponse)
        //res.send(preparedPostBodies)
    } catch(err) {
        res.send(err)
    }


    // authenticate with to zesty through the wrapper
    try {
        const ZestyAuth = require("zestyio-api-wrapper/auth");
        const zestyAuth = new ZestyAuth();
        token = await zestyAuth.login(process.env.ZESTY_USER_EMAIL, process.env.ZESTY_USER_PASSWORD);
    } catch (e) {
        res.send("Failed to authenticate: " + e);
    }

    // open zesty wrapper instance connection
    try {
         zestyAPI = new Zesty(process.env.ZESTY_INSTANCE_ZUID, token, {
            logErrors: true,
            logResponses: true
        });
    } catch (err) {
        console.log(err);
    }
    

  
    // write to zesty
    try {
        const models = await zestyAPI.getSettings();
        res.send(models)
    } catch (err) {
        console.log(err);
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

async function extractPlans(bdxObj){
     try {
        let preparedPlans = []

        for (index = 0; index < bdxObj.Builders.Corporation.Builder.Subdivision.Plan.length; index++) { 
            
            let o = bdxObj.Builders.Corporation.Builder.Subdivision.Plan[index]
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
                'builder' : bdxObj.Builders.Corporation.Builder.BrandName._text,
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

        return preparedPlans
        
    } catch(err){
        console.log(err)
    }

}

async function parseBDX(bdxObj){
    let prepared = {
        corporate: [],
        builders: await extractBuilders(bdxObj),
        communityImages: [],
        homeModels: await extractPlans(bdxObj),
        homeModelsImages: [],
        homeModelsListingSpecs: [],
        homeModelsListingSpecs: []
    }
    return prepared
}

async function xmlToObject(pathToFile){
    var convert = require('xml-js');
    var xml = fs.readFileSync(pathToFile, 'utf8');
    var options = {compact: true};
    return convert.xml2js(xml, options); 
}

async function connectToFTPandDownloadXML(host, user, pass){
    
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
        let filename = 'zesty-sync.txt'
        let filepath = '/tmp/' + filename
        var dateSynced = new Date();
        fs.writeFile(filepath,dateSynced.toUTCString())
        await client.upload(fs.createReadStream(filepath), filename)

        client.close() // close ftp connection

    } catch(err) {
        console.log(err)
    }   
}



async function extractBuilders(bdxObj){
     try {
        let preparedBuilders = []

        for (index = 0; index < bdxObj.Builders.Corporation.Builder.length; index++) { 
            
            let o = bdxObj.Builders.Corporation.Builder[index]  

            let planObject = {
                'builder_id': o._attributes.BuilderID,
                'brand_name' : o.BrandName._text,
                'builder_number' : o.BuilderNumber._text,
                'main_image' :mainImage,
                'base_price': Math.round(o.BasePrice._text),
                'bedrooms': o.Bedrooms._text,
                'baths': o.Baths._text,
                'half_baths': halfBaths,
                'garage': o.Garage._text,
                'stories': stories,
                'square_footage' : o.BaseSqft._text,
                'builder' : bdxObj.Builders.Corporation.Builder.BrandName._text,
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

        return preparedPlans
        
    } catch(err){
        console.log(err)
    }

}