
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
        res.send(preparedPostBodies.prepared )
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
        const settings = await zestyAPI.getSettings();
        res.send(settings)
    } catch (err) {
        console.log(err);
    }
    
}


async function parseBDX(bdxObj){
    
    //return bdxObj.Builders.Corporation.Builder.Subdivision.Plan
   

    let prepared = {
        corporate: await extractCorporate(bdxObj.Builders.Corporation),
        builders: await extractBuilder(bdxObj.Builders.Corporation.Builder),
        communityImages: await extractCommunityImages(bdxObj.Builders.Corporation.Builder.Subdivision.SubImage),
        plans: await extractPlans(bdxObj.Builders.Corporation.Builder.Subdivision.Plan),
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

       await Promise.all(
            plans.map(async p => {
                
                p.zestyMemoryBuilderZUID =  memoryZuids.builder
                let plan = await dataFunctions.returnHydratedModel(planModel,p)
                plan.elevationImages = await extractPlanElevationImages(p.PlanImages.ElevationImage)
                plan.interiorImages = await extractPlanInteriorImages(p.PlanImages.InteriorImage)
                plan.floorPlanImages = await extractPlanFloorPlanImages(p.PlanImages.FloorPlanImage)
                plan.specs = await extractSpecs(p.Spec)

                preparedPlans.push(plan )
                
            })
               
          
        )
         // let apiPostBody = {
            //     'content': planObject,
            //     'meta': {
            //         'path_part': zestyHelperFunctions.slugify(planObject.plan_name)
            //     }
            // }

        
        // Now that all the asynchronous operations are running, here we wait until they all complete.
        return await Promise.all(preparedPlans)
        
    } catch(err){
        console.log(err)
    }

}



async function extractBuilder(builders){
    
    builders = Array.isArray(builders) ? builders : [builders]

    return Promise.all(builders.map(blr => {
        blr.related_builder = memoryZuids.builder
        return dataFunctions.returnHydratedModel(builderModel,blr)       
    })) 

}

async function extractCommunityImages(images){

    if(!Array.isArray(images)){
        images = [images]
    }

    return Promise.all(images.map(img => {
        img.related_builder = memoryZuids.builder
        return dataFunctions.returnHydratedModel(communityImageModel,img)       
    }))
    
}


async function extractPlanFloorPlanImages(images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(img => {
            img.related_model = memoryZuids.plan
            img.image_type = "FloorPlan"
            return dataFunctions.returnHydratedModel(planImageModel,img)       
        }))
    } else {
        return []
    }   
}

async function extractPlanElevationImages(images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(img => {
            img.related_model = memoryZuids.plan
            img.image_type = "Elevation"
            return dataFunctions.returnHydratedModel(planImageModel,img)       
        }))
    } else {
        return []
    }   
}

async function extractPlanInteriorImages(images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(img => {
            img.related_model = memoryZuids.plan
            img.image_type = "Interior"
            return dataFunctions.returnHydratedModel(planImageModel,img)       
        }))
    } else {
        return []
    }
        
}


async function extractSpecs(specs){
    
    if(typeof specs !== "undefined"){
        specs = Array.isArray(specs) ? specs : [specs]

        return Promise.all(specs.map(async spec => {
            spec.related_model = memoryZuids.plan
            let sc = await dataFunctions.returnHydratedModel(specModel,spec) 
            //console.log(spec.SpecImages.SpecElevationImage)      
            sc.specElevationImages = await extractPlanSpecElevationImages(spec.SpecImages.SpecElevationImage)
            sc.specInteriorImages = await extractPlanSpecInteriorImages(spec.SpecImages.SpecInteriorImage)
            sc.specFloorPlanImages = await extractPlanSpecFloorPlanImages(spec.SpecImages.SpecFloorPlanImage)
            return sc
        }))
    } else {
        return []
    }   
}

async function extractPlanSpecFloorPlanImages(images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(async img => {  
            img.related_spec = memoryZuids.spec
            img.image_type = "FloorPlan"
            return await dataFunctions.returnHydratedModel(specImageModel,img)       
        }))
    } else {
        return []
    }
        
}


async function extractPlanSpecElevationImages(images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(async img => {  
            img.related_spec = memoryZuids.spec
            img.image_type = "Elevation"
            return await dataFunctions.returnHydratedModel(specImageModel,img)       
        }))
    } else {
        return []
    }
        
}

async function extractPlanSpecInteriorImages(images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(async img => {
            img.related_spec = memoryZuids.spec
            img.image_type = "Interior"
            return await dataFunctions.returnHydratedModel(specImageModel,img)       
        }))
    } else {
        return []
    }
        
}