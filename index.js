
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
    homeSearch: '7-e14edc-fnmrtv',
    builder: '',
    corporation: '',
    plan: '',
    spec: ''
}

// building the URL path

//  /:builder/:plan_name/:spec_id/

// models to reference before extracting to settings
let zestyModels = {
    corporate: '6-f6fcc2fe84-j7qt2d',
    builder: '6-f4a0ad94fc-hm6v7x',
    communityImages: '6-8ef3aabab8-wzxp40',
    plans: '6-faff74-pnqf1f',
    planImages: '6-a0b599c9d6-cnvwt8',
    specs: '6-6a2e70-k254c2',
    specImages: '6-92e4ebb897-l88c9s',
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

async function extractBuilder(builders){
    
    builders = Array.isArray(builders) ? builders : [builders]

    return Promise.all(builders.map(async bldr => {
        bldr.related_builder = memoryZuids.builder
        
        let hb = await dataFunctions.returnHydratedModel(builderModel,bldr)     
        // grab each agent name       
        hb.sales_office_agent_1 = eval("bldr." + new String (builderModel.sales_office_agent_1)+".trim()")
        hb.sales_office_agent_2 = eval("bldr." + new String (builderModel.sales_office_agent_2)+".trim()")  
        hb.related_corporation = memoryZuids.corporation

        // get parent path
        let pageParent = await searchZesty(zestyAPI, memoryZuids.homeSearch)
        let pathParent = pageParent[0].web.path

        // insert into zesty, grab zuid on return, and set into memory object
        try {
            memoryZuids.builder = await importContent(
                zestyAPI,
                pathParent+dataFunctions.makePathPart(hb.brand_name)+'/',
                hb.brand_name, 
                hb.subdivision_description, 
                zestyModels.builder,
                hb,
                zestyModels.homeSearch
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

async function extractPlans(plans){
     try {
        let preparedPlans = []
        
        // get parent path from the builder zuid
        let pageParent = await searchZesty(zestyAPI, memoryZuids.builder)
        console.log('plans parent: ' +memoryZuids.builder)
        let pathParent = pageParent[0].web.path
           

        await Promise.all(
            plans.map(async p => {
                
                p.zestyMemoryBuilderZUID =  memoryZuids.builder
                let plan = await dataFunctions.returnHydratedModel(planModel,p)
                
                // insert into zesty, grab zuid on return, and set into memory object
                try {
                    memoryZuids.plan = await importContent(
                        zestyAPI,
                        pathParent+dataFunctions.makePathPart(plan.plan_name)+'/',
                        plan.plan_name, 
                        plan.description, 
                        zestyModels.plans,
                        plan,
                        memoryZuids.builder
                        )
                } catch (err) {
                    console.log(err)
                }

                // get the images
                if(p.PlanImages !== undefined){
                    plan.elevationImages = await extractPlanImages("elevation",p.PlanImages.ElevationImage)
                    plan.interiorImages = await extractPlanImages("interior",p.PlanImages.InteriorImage)
                    plan.floorPlanImages = await extractPlanImages("floorplan",p.PlanImages.FloorPlanImage)
                }
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

async function extractCommunityImages(images){

    if(!Array.isArray(images)){
        images = [images]
    }

    return Promise.all(images.map(async img => {
        img.related_builder = memoryZuids.builder
        let hi = await dataFunctions.returnHydratedModel(communityImageModel,img)       
        // insert into zesty, grab zuid on return, and set into memory object
        try {
            await importContent(
                zestyAPI,
                hi.title,
                hi.title,
                hi.title, 
                zestyModels.communityImages,
                hi,
                '',
                true
                )
        } catch (err) {
            console.log(err)
        }

    }))
    
}


async function extractPlanImages(imageType,images){
    
    if(Array.isArray(images)){
        return Promise.all(images.map(async img => {
            img.related_model = memoryZuids.plan
            img.image_type = imageType
            let hi = await dataFunctions.returnHydratedModel(planImageModel,img)       
            let name = hi.image_type + " "+ memoryZuids.plan + " " + hi.sort_order

            // insert into zesty, grab zuid on return, and set into memory object
            try {
                await importContent(
                    zestyAPI,
                    name,
                    name,
                    "", 
                    zestyModels.planImages,
                    hi,
                    '',
                    true
                    )
            } catch (err) {
                console.log(err)
            }

            return hi
        }))
    } else {
        return []
    }   
}


async function extractSpecs(specs){
    
    if(typeof specs !== "undefined"){

        specs = Array.isArray(specs) ? specs : [specs]

        // get parent path from the plan zuid
        let pageParent = await searchZesty(zestyAPI, memoryZuids.plan)
        console.log('plans parent: ' +memoryZuids.plan)
        let pathParent = pageParent[0].web.path
       

        return Promise.all(specs.map(async spec => {
            spec.home_model = memoryZuids.plan
            let hs = await dataFunctions.returnHydratedModel(specModel,spec)

            // insert into zesty, grab zuid on return, and set into memory object
            try {
                memoryZuids.spec = await importContent(
                    zestyAPI,
                    pathParent+dataFunctions.makePathPart(hs.spec_id)+'/',
                    hs.spec_id, 
                    hs.spec_description, 
                    zestyModels.specs,
                    hs,
                    memoryZuids.plan
                    )
            } catch (err) {
                console.log(err)
            }

            // add to zesty here 
            if(spec.SpecImages !== undefined){
                hs.specElevationImages = await extractPlanSpecImages("elevation",spec.SpecImages.SpecElevationImage)
                hs.specInteriorImages = await extractPlanSpecImages("interior",spec.SpecImages.SpecInteriorImage)
                hs.specFloorPlanImages = await extractPlanSpecImages("floorplan",spec.SpecImages.SpecFloorPlanImage)
            }
            return hs
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
        createdByUserZUID: '',
        parentZUID: ''
    }
    
}

// an ASYNC function for importing content
async function importContent(zestyObj, preexistingSearchString, title, description, contentModelZUID, data, parentZuid='', dataset=false){

    if(dataset == true){
       preexistingSearchString = dataFunctions.makeLinkText(preexistingSearchString)
    }    

    // use newItem.web.pathPart to check check if it exists, if so, return the zuid, if not, create
    let exists = await searchZesty(zestyObj, preexistingSearchString)
    
    // if it exists, return the item zuid from the search
    if(exists !== false) return exists[0].meta.ZUID

    // prepare for zesty
    let zestyItem = contentModelItemShape
    zestyItem.data = data
    zestyItem.web = returnWebData(title, description)
    
    zestyItem.web.parentZUID = parentZuid
    zestyItem.meta = returnMetaData(contentModelZUID,parentZuid)
    delete zestyItem.meta.parentZUID

    if(dataset == true){
        delete zestyItem.web.pathPart
    }
    
    try {
        
        res = await zestyObj.createItem(contentModelZUID, zestyItem);
        let zuid = res.data.ZUID
        await publishItem(zestyObj,contentModelZUID,zuid,1)
        return zuid
        
    } catch(error){
        console.log(error);
    }
    
}

// an ASYNC function for importing content
async function searchZesty(zestyObj, searchString){
  try {
        
        let res = await zestyObj.search(searchString);
        if(res.data.length > 0){
            console.log(res.data.length+' Search results for: '+searchString)
            //console.log(res.data[0].web)
            return res.data
        } else {
            console.log('NO search results for: '+searchString)
            return false
        }
       
    } catch(error){
        console.log(error);
    }
}

async function publishItem(zestyObj, modelZuid,itemZuid,versionNumber=1){
    try {
        const res = await zestyObj.publishItemImmediately(
            modelZuid,
            itemZuid,
            versionNumber
        );
    } catch (err) {
        console.log(err);
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

function returnMetaData(contentModelZuid, parentZUID=''){
    return {
        contentModelZUID: contentModelZuid,
        createdByUserZUID: '5-909df5a9ff-9tbxjj',
        parentZUID: parentZUID
    }
}