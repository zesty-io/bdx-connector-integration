
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

// models to reference before extracting to settings
let zestyModels = {
    corporate: '6-f6fcc2fe84-j7qt2d',
    builder: '6-f4a0ad94fc-hm6v7x',
    communityImages: '6-8ef3aabab8-wzxp40'
}

// functions and utils
const dataFunctions             = require('./lib/dataFunctions.js')
const ftpFunctions              = require('./lib/ftpFunctions.js')
const xmlFunctions              = require('./lib/xmlFunctions.js')
const zestyHelperFunctions      = require('./lib/zestyHelperFunctions.js')

// This JSON object is modeled to match the shape of the Product Content Model in Zesty.io

const contentModelItemShape = {
    data: {
    },
    web: {
        canonicalTagMode: 1,
        metaLinkText: '',
        metaTitle: '',
        metaKeywords: ' ',
        metaDescription: '',
        pathPart:""
    },
    meta:{
        contentModelZUID: '',
        createdByUserZUID: ''
    }
    
}

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
            logResponses: false
        });
    } catch (err) {
        console.log(err);
    }


    
    // iterate through the parsed json to build the post bodies  
    try {
        preparedPostBodies.prepared = await parseBDX(preparedPostBodies.fullResponse)
        res.send(preparedPostBodies.prepared )
    } catch(err) {
        res.send(err)
    }

 
  
    // // write to zesty
    // try {
    //     const settings = await zestyAPI.getSettings();
    //     res.send(settings)
    // } catch (err) {
    //     console.log(err);
    // }
    
}




async function parseBDX(bdxObj){

    let prepared = {
        corporate: await extractCorporate(bdxObj.Builders.Corporation),
        builders: await extractBuilder(bdxObj.Builders.Corporation.Builder),
        
    }
    return prepared
}

async function extractCorporate(corporateObj){
    let corp
    try {
        corp =  await dataFunctions.returnHydratedModel(corporationModel,corporateObj)
    } catch(err) {
        res.send("Failed read corporation object: " + err)
    }  
       
    try {
        memoryZuids.corporation = await importContent(
            zestyAPI, 
            '/'+dataFunctions.makePathPart(corp.corporate_name)+'/', 
            corp.corporate_name, 
            corp.corporate_name, 
            zestyModels.corporate,
            corp
            )
    } catch (err) {
        console.log("Failed to insert into zesty: " + err)
    }

    return corp
}

async function extractPlans(plans){
     try {
        let preparedPlans = []

       await Promise.all(
            plans.map(async p => {
                
                p.zestyMemoryBuilderZUID =  memoryZuids.builder
                let plan = await dataFunctions.returnHydratedModel(planModel,p)
                plan.elevationImages = await extractPlanImages("elevation",p.PlanImages.ElevationImage)
                plan.interiorImages = await extractPlanImages("interior",p.PlanImages.InteriorImage)
                plan.floorPlanImages = await extractPlanImages("floorplan",p.PlanImages.FloorPlanImage)
                plan.specs = await extractSpecs(p.Spec)

                preparedPlans.push(plan )
                
            }) 
        )

        // Now that all the asynchronous operations are running, here we wait until they all complete.
        return await Promise.all(preparedPlans)
        
    } catch(err){
        console.log(err)
    }

}



async function extractBuilder(builders){
    
    builders = Array.isArray(builders) ? builders : [builders]

    return Promise.all(builders.map(async bldr => {
        bldr.related_builder = memoryZuids.builder
        
        let hb = await dataFunctions.returnHydratedModel(builderModel,bldr)     
        // grab each agent name       
        hb.sales_office_agent_1 = eval("bldr." + new String (builderModel.sales_office_agent_1)+".trim()")
        hb.sales_office_agent_2 = eval("bldr." + new String (builderModel.sales_office_agent_2)+".trim()")  
        hb.related_corporation = memoryZuids.corporation
        // insert into zesty, grab zuid on return, and set into memory object
        try {
            memoryZuids.builder = await importContent(
                zestyAPI,
                '/'+dataFunctions.makePathPart(hb.brand_name)+'/',
                hb.brand_name, 
                hb.subdivision_description, 
                zestyModels.builder,hb
                )
        } catch (err) {
            console.log(err)
        }


        hb.communityImages = await extractCommunityImages(bldr.Subdivision.SubImage)

        // get plans 
        hb.plans = await extractPlans(bldr.Subdivision.Plan)

        return hb
    })) 

}

async function extractCommunityImages(images){

    if(!Array.isArray(images)){
        images = [images]
    }

    return Promise.all(images.map(async img => {
        img.related_builder = memoryZuids.builder
        let hi = await dataFunctions.returnHydratedModel(communityImageModel,img)       
        // insert into zesty, grab zuid on return, and set into memory object
        try {
            importContent(
                zestyAPI,
                hi.title,
                hi.title,
                hi.title, 
                zestyModels.communityImages,
                hi,
                true
                )
        } catch (err) {
            console.log(err)
        }

    }))
    
}


async function extractPlanImages(imageType,images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(img => {
            img.related_model = memoryZuids.plan
            img.image_type = imageType
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
            // add to zesty here 
            if(spec.SpecImages !== undefined){
                sc.specElevationImages = await extractPlanSpecImages("elevation",spec.SpecImages.SpecElevationImage)
                sc.specInteriorImages = await extractPlanSpecImages("interior",spec.SpecImages.SpecInteriorImage)
                sc.specFloorPlanImages = await extractPlanSpecImages("floorplan",spec.SpecImages.SpecFloorPlanImage)
            }
            return sc
        }))
    } else {
        return []
    }   
}

async function extractPlanSpecImages(imageType,images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(async img => {  
            img.related_spec = memoryZuids.spec
            img.image_type = imageType
            return await dataFunctions.returnHydratedModel(specImageModel,img)       
        }))
    } else {
        return []
    }
        
}


// an ASYNC function for importing content
async function importContent(zestyObj, preexistingSearchString, title, description, contentModelZUID, data, dataset=false){

    // use newItem.web.pathPart to check check if it exists, if so, return the zuid, if not, create
    let exists = await searchZesty(zestyObj, preexistingSearchString)
    // ife
    if(exists !== false) return exists

    // prepare for zesty
    let zestyItem = contentModelItemShape
    zestyItem.data = data
    zestyItem.web = returnWebData(title, description)
    zestyItem.meta = returnMetaData(contentModelZUID)

    if(dataset == true){
        delete zestyItem.web.pathPart
    }
    
    try {
        //console.log(zestyItem)
        res = await zestyObj.createItem(contentModelZUID, zestyItem);
        return res.data.ZUID
        
    } catch(error){
        console.log(error);
    }
    
}

// an ASYNC function for importing content
async function searchZesty(zestyObj, searchString){
  try {
        res = await zestyObj.search(searchString);
        if(res.data.length > 0){
            console.log(searchString)
            console.log(res.data[0])
            return res.data[0].meta.ZUID
        } else {
            return false
        }
       
    } catch(error){
        console.log(error);
    }
}


function returnWebData(title, description){
    return {
        canonicalTagMode: 1,
        metaLinkText: dataFunctions.makeLinkText(title),
        metaTitle: dataFunctions.makeMetaTitle(title),
        metaKeywords: ' ',
        metaDescription: dataFunctions.makeMetaDescription(description),
        pathPart: dataFunctions.makePathPart(title)
    }
}

function returnMetaData(contentModelZuid){
    return {
        contentModelZUID: contentModelZuid,
        createdByUserZUID: '8-bdx-integration',
    }
}