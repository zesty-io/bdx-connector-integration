
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

// functions and utils
const dataFunctions             = require('./lib/dataFunctions.js')
const ftpFunctions              = require('./lib/ftpFunctions.js')
const xmlFunctions              = require('./lib/xmlFunctions.js')
const zestyHelperFunctions      = require('./lib/zestyHelperFunctions.js')

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
        await ftpFunctions.connectToFTPandDownloadXML(
            process.env.FTPHOST,
            process.env.FTPUSER, 
            process.env.FTPPASS
            )
    } catch(err) {
        res.send("Failed to connect to the FTP: " + err)
    }     
    // read the downloaded file, convert the xml to JSON
    try {
        preparedPostBodies.fullResponse = await xmlFunctions.xmlToObject('/tmp/bdx.xml')
    } catch(err) {
        res.send("Failed to read the XML file: " + err)
    }     
    
    // iterate through the parsed json to build the post bodies  
    try {
        preparedPostBodies.prepared = await parseBDX(preparedPostBodies.fullResponse)
    } catch(err) {
        res.send(err)
    }
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
        const models = await zestyAPI.getSettings();
        res.send(models)
    } catch (err) {
        console.log(err);
    }
    
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
            
            let o = plans[index]
            o.zestyMemoryBuilderZUID =  memoryZuids.builder
            
            preparedPlans.push( await dataFunctions.returnHydratedModel(corporationModel,corporateObj) )


            // 'builder' : bdxObj.Builders.Corporation.Builder.BrandName._text


            let apiPostBody = {
                'content': planObject,
                'meta': {
                    'path_part': zestyHelperFunctions.slugify(planObject.plan_name)
                }
            }

        } 

        return preparedPlans
        
    } catch(err){
        console.log(err)
    }

}

async function parseBDX(bdxObj){
    
    //return await extractBuilder(bdxObj.Builders.Corporation.Builder);
    let prepared = {
        corporate: await extractCorporate(bdxObj.Builders.Corporation),
        builders: await extractBuilder(bdxObj.Builders.Corporation.Builder),
        communityImages: [],
        homeModels: await extractPlans(bdxObj.Builders.Corporation.Builder.Subdivision.Plan),
        homeModelsImages: await extractPlanImages(bdxObj.Builders.Corporation.Builder.Subdivision.Plan.PlanImages),
        homeModelsListingSpecs: [],
    }
    return prepared
}

async function extractBuilder(builders){
    
    builders = Array.isArray(builders) ? builders : [builders]
        
     try {
        let preparedBuilders = []

        for (index = 0; index < builders.length; index++) { 
            
           let b = builders[index]
            
            preparedBuilders.push( 
                await dataFunctions.returnHydratedModel(builderModel,b) 
            )
        } 

        return preparedBuilders
        
    } catch(err){
        console.log(err)
    }

}