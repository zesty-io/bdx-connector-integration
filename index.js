
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

// memory store
let memoryZuids = {
    builder: '',
    corporation: '',
    plan: '',
    spec: ''
}

// functions and utils
const dataFunctions             = require('./lib/dataFunctions.js')
const ftpFunctions              = require('./lib/ftpFunctions.js')
const xmlFunctions              = require('./lib/xmlFunctions.js')
const zestyHelperFunctions      = require('./lib/zestyHelperFunctions.js')

// Cloud Function

exports.bdxIntegration = (req, res) => {
  const cors = require('cors')()
  cors(req, res, () => {
    exportBDXIntegration(req, res)
  })
}

// Main Function

const exportBDXIntegration = async (req, res) => {
    
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
        await ftpFunctions.connectToFTPandDownloadXML(process.env.FTPHOST,process.env.FTPUSER, process.env.FTPPASS)
    } catch(err) {
        res.send("Failed to connect to the FTP: " + err)
    } 

    // read the downloaded file, convert the xml to JSON
    try {
        preparedPostBodies.fullResponse = await xmlFunctions.xmlToObject( process.env.BDXTEMPPATH)
    } catch(err) {
        res.send("Failed to read the XML file: " + err)
    }     
     //res.send(preparedPostBodies.fullResponse )
    
    // iterate through the parsed json to build the post bodies  
    try {
        preparedPostBodies.prepared = await parseBDX(preparedPostBodies.fullResponse)
    } catch(err) {
        res.send(err)
    }
    res.send(preparedPostBodies.prepared )
    return 

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
        const settings = await zestyAPI.getSettings();
        res.send(settings)
    } catch (err) {
        console.log(err);
    }
    
}


async function parseBDX(bdxObj){
    
    //return await extractBuilder(bdxObj.Builders.Corporation.Builder);
    let prepared = {
        corporate: await extractCorporate(bdxObj.Builders.Corporation),
        builders: await extractBuilder(bdxObj.Builders.Corporation.Builder),
        communityImages: await extractCommunityImages(bdxObj.Builders.Corporation.Builder.Subdivision.SubImage),
        plans: await extractPlans(bdxObj.Builders.Corporation.Builder.Subdivision.Plan),
        planImages: await extractPlanImages(bdxObj.Builders.Corporation.Builder.Subdivision.Plan.PlanImages),
        specs: [],
        specImages: [],
    }
    return prepared
}

async function extractCorporate(corporateObj){
    
    try {
        return await dataFunctions.returnHydratedModel(corporationModel,corporateObj)
    } catch(err) {
        res.send("Failed read corporation object: " + err)
    }  
}

async function extractPlans(plans){
     try {
        let preparedPlans = []

        for (index = 0; index < plans.length; index++) { 
            let p = plans[index]
            p.zestyMemoryBuilderZUID =  memoryZuids.builder
            let plan = dataFunctions.returnHydratedModel(planModel,p)

            preparedPlans.push(plan)
            
            // let apiPostBody = {
            //     'content': planObject,
            //     'meta': {
            //         'path_part': zestyHelperFunctions.slugify(planObject.plan_name)
            //     }
            // }

        } 
        
        // Now that all the asynchronous operations are running, here we wait until they all complete.
        return await Promise.all(preparedPlans)
        
    } catch(err){
        console.log(err)
    }

}



async function extractBuilder(builders){
    
    builders = Array.isArray(builders) ? builders : [builders]
        
     try {
        let preparedBuilders = []

        for (index = 0; index < builders.length; index++) { 
            
            let b = builders[index]
            preparedBuilders.push(dataFunctions.returnHydratedModel(builderModel,b) )
        } 

        return await Promise.all(preparedBuilders) 
        
    } catch(err){
        console.log(err)
    }

}

async function extractCommunityImages(images){
    
    images = Array.isArray(images) ? images : [images]
        
     try {
        let preparedImages = []

        for (index = 0; index < images.length; index++) { 
            
           let img = images[index]
           img.related_builder = memoryZuids.builder
            
            preparedImages.push( dataFunctions.returnHydratedModel(communityImageModel,img) )
        } 
    
        return await Promise.all(preparedImages)
        
    } catch(err){
        console.log(err)
    }

}


async function extractPlanImages(images){
    
    images = Array.isArray(images) ? images : [images]
        
     try {
        let preparedImages = []

        for (index = 0; index < images.length; index++) { 
            
           let img = images[index]
            
            preparedImages.push( dataFunctions.returnHydratedModel(planImageModel,img) )
        } 

        return await Promise.all(preparedImages)
        
    } catch(err){
        console.log(err)
    }

}