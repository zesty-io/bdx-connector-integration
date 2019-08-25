
const request = require('request')
const Zesty = require("zestyio-api-wrapper");
const fs  = require('fs')
require('env-yaml').config()
let token, zestyAPI

exports.bdxIntegration = (req, res) => {
  const cors = require('cors')()
    console.log('running')
  cors(req, res, () => {
    exportBDXIntegration(req, res)
  })
}


// Zesty.io Content Model to BDX Mapping


// Corporation
// Content Model Name: corporation
// Content Model ZUID: 6-f6fcc2fe84-j7qt2d
// https://3dlpqt3n.manage.zesty.io/#!/content/6-f6fcc2fe84-j7qt2d
// BDX XML Map: Builders.Corporation

var corporationModel = {
    'corporate_builder_number' : 'CorporateBuilderNumber._text',
    'corporation_id' : '_attributes.CorporationID',
    'corporate_builder_state' : 'CorporateState._text',
    'corporate_name' : 'CorporateName._text',
    'corporate_reporting_email' : 'CorporateReportingEmail._text',
    // in zesty but not in BDX: sort_order
}

// Builder
// Content Model Name: builder-model
// Content Model ZUID: 6-f4a0ad94fc-hm6v7x
// https://3dlpqt3n.manage.zesty.io/#!/content/6-f4a0ad94fc-hm6v7x
// BDX XML Map: Builders.Corporation.Builder

var builderModel = {
    'builder_id': "_attributes.BuilderID",
    'brand_name' : "BrandName._text",
    'builder_number' : "BuilderNumber._text"
    'plan_number' : "PlanNumber._text"
    'builder' : "", // builder ZUID set programatically by zesty
    'square_footage' : "BaseSqft._text",
    'related_corporation' : "", //
    'subdivision_price_low' : "Subdivision._attributes.PriceLow", //
    'subdivision_price_high' : "Subdivision._attributes.PriceHigh", //
    'subdivision_square_foot_low' : "Subdivision._attributes.SqftLow", //
    'subdivision_square_foot_high' : "Subdivision._attributes.SqftHigh", //
    'subdivision_id' : "Subdivision._attributes.SubdivisionID", //
    'community_style' : 'Subdivision.CommunityStyle._text',
    'sales_office_agent_1': 'Subdivision.SalesOffice.Agent[0]._text',
    'sales_office_agent_2': 'Subdivision.SalesOffice.Agent[1]._text',
    'sales_office_street_address': 'Subdivision.SalesOffice.Address.Street1._text',
    'sales_office_city': 'Subdivision.SalesOffice.Address.City._text',
    'sales_office_address_county' : 'Subdivision.SalesOffice.Address.City._text', 
    'sales_office_zip_code' : 'Subdivision.SalesOffice.Address.ZIP._text',
    'sales_office_country' : 'Subdivision.SalesOffice.Address.Country._text',
    'sales_office_latitude' :  'Subdivision.SalesOffice.Address.Geocode.Latitude._text',
    'sales_office_longitude' : 'Subdivision.SalesOffice.Address.Geocode.Longitude._text',
    'sales_office_tel_area_code': 'Subdivision.SalesOffice.Phone.AreaCode._text', 
    'sales_office_tel_prefix': 'Subdivision.SalesOffice.Phone.Prefix._text', 
    'sales_office_tel_suffix': 'Subdivision.SalesOffice.Phone.Suffix._text, 
    'sales_office_email': 'Subdivision.SalesOffice.Email._text', 
    'sales_office_hours': 'Subdivision.SalesOffice.Hours._text', 
    'subdivision_street_address': 'Subdivision.SubAddress.SubStreet1._text', 
    'subdivision_county': 'Subdivision.SubAddress.SubCounty._text', 
    'subdivision_city': 'Subdivision.SubAddress.SubCity._text', 
    'subdivision_state': 'Subdivision.SubAddress.SubState._text', 
    'subdivision_zip_code': 'Subdivision.SubAddress.SubZIP._text', 
    'subdivision_country': 'Subdivision.SubAddress.SubCountry._text', 
    'subdivision_latitude': 'Subdivision.SubAddress.SubGeocode.SubLatitude._text', 
    'subdivision_longitude': 'Subdivision.SubAddress.SubGeocode.SubLongitude._text', 
    'subdivision_amenity': 'Subdivision.SubAmenity._text', 
    'subdivision_amenity_type': 'Subdivision.SubAmenity._attributes.Type', 
    'subdivision_description': 'Subdivision.SubDescription._cdata', 
    'subdivision_website': 'Subdivision.SubWebsite._text', 
    // in the zesty content model but not in bdx
    // beds_low, beds_high, garages, bathroom_low, bathroom_high, half_bath, local_amenities_list, sort_order

}

// Community Images
// Content Model Name: communitu-images
// Content Model ZUID: 6-f4a0ad94fc-hm6v7x
// https://3dlpqt3n.manage.zesty.io/#!/content/6-8ef3aabab8-wzxp40
// BDX XML Path: Builders.Corporation.Builder.Subdivision.SubImage (array)
var communityImages = {
'related_builder' : '', // done by thos script after build is created
'image_type' : '_attributes.Type',
'title' : '_attributes.Title',
'image_url' : '_text',
'sort_order' : '_attributes.SequencePosition',

// on in zesty: image
}


// Home Plan Model
// Content Model Name: home-model
// Content Model ZUID: 6-faff74-pnqf1f 
// https://3dlpqt3n.manage.zesty.io/#!/content/6-6a2e70-k254c2
// BDX XML Map: Builders.Corporation.Builder.Subdivision.Plan

var homePlanModel = {
    'plan_id': "_attributes.PlanID",
    'plan_name' : "PlanName._text",
    'plan_type' : "_attributes.Type"
    'plan_number' : "PlanNumber._text"
    'builder' : "", // builder ZUID set programatically by zesty
    'square_footage' : "BaseSqft._text",
   
    'base_price': "BasePrice._text",
    'bedrooms': "Bedrooms._text",
    'master_bedroom_location': "Bedrooms._attributes.MasterBedLocation",
    'baths': "Baths._text",
    'marketing_headline' : "MarketingHeadline._text",
    'plan_type': "_attributes.Type",
    'description' : "Description._cdata"    
    'main_image' : "PlanImages.ElevationImage",
    'half_baths': "HalfBaths._text",
    'living_area': "LivingArea._text",
    'living_area_type': "LivingArea._attributes.Type",
    'garage': "Garage._text",
    'dining_areas': "DiningAreas._text",
    'plan_amenity': "PlanAmenity._text",
    'plan_amenity_type': "PlanAmenity._attributes.Type",
    'basement': "Basement._text",
    'spec_county' : "SpecCounty._text",
    'spec_latitude': "SpecLatitude._text", // not used
    'spec_longitude': "SpecLongitude._text", // not used
    'spec_movein_date' : "SpecMoveInDate.Day._text", 
    'spec_is_model' : "SpecIsModel._text", // not used
    'spec_price': "SpecPrice._attributes._text",
    'spec_square_footage' : "SpecSqft._text",
    'spec_number_of_stories' : "SpecStories._text",
    'spec_square_footage' : "SpecSqft._text",
    'spec_location' : "SpecLocation._text", // not used
    'spec_baths' : "SpecBaths._text",
    'spec_half_baths' : "SpecHalfBaths._text",
    'spec_bedrooms' : "SpecBedrooms._text",
    'spec_master_bedroom_location' : "SpecBedrooms._attributes.MasterBedLocation", // not used
    'spec_garage' : "SpecGarage._text",
    'spec_living_area' : "SpecLivingArea._text", // not used
    'spec_living_area_type' : "SpecLivingArea._attributes.Type", // not used, numbers 1-5 ignored
    'spec_marketing_headline' : "SpecMarketingHeadline._text",
    'spec_amenity' : "SpecAmenity._text", // not used
    'spec_amenity_type' : "SpecAmenity._attributes.Type", // not used
    'spec_description' : "SpecDescription._cdata",
    'spec_dining_areas' : "SpecDiningAreas._text", // not used
    'spec_basement' : "SpecBasement._text.Type", // not used
    'spec_floorplan_url_1':  "SpecImages.SpecFloorPlanImage[0]._text",
    'spec_floorplan_url_2': "SpecImages.SpecFloorPlanImage[1]._text",
    'stories': "Stories._text",
    'floor_plan_1_url' : "PlanImages.FloorPlanImage[0]._text",
    'floor_plan_2_url' : "PlanImages.FloorPlanImage[1]._text",
    'builder' : "", // should be pull from relationship Builders.Corporation.Builder.BrandName
    // in zesty but not in bdx
    // living_area_1-5, living_area_type_, amenities, brochure, included_features, sort_order

}

// Home Plan Model Images
// Content Model Name: home-model-images
// Content Model ZUID: 6-a0b599c9d6-cnvwt8 
// https://3dlpqt3n.manage.zesty.io/#!/content/6-a0b599c9d6-cnvwt8
// BDX XML Map: Builders.Corporation.Builder.Subdivision.Plan.PlanImages (ElevationImage|InteriorImage)

var homePlanModelImages = {
    'related_model': "", // sourced by zesty
    'image_type' : "", // ElevationImage|InteriorImage -- populated based upon the image type being looped through
    'image_url' : "_text",
    'sort_order': "_attributes.SequencePosition"
    // 'plan_image' : "_text", // stored in zesty
}

// Label: Home Plan Model Spec Listing
// Content Model Name: home-model-listing
// Content Model ZUID: 6-6a2e70-k254c2
// https://3dlpqt3n.manage.zesty.io/#!/content/6-6a2e70-k254c2
// BDX XML Map: Builders.Corporation.Builder.Subdivision.Plan.Spec

var homePlanSpecModel = {
    'spec_id': "_attributes.SpecID",
    'spec_type' : "_attributes.Type",
    'spec_number' : "SpecNumber._text",
    'home_model' : "", // sorced by zesty in the script
    'spec_street_address': "SpecStreet1._text",
    'spec_city': "SpecCity._text",
    'spec_state': "SpecState._text",
    'spec_zip_code': "SpecZIP._text",
    'spec_country': "SpecCountry._text", // not used
    'spec_latitude': "SpecLatitude._text", // not used
    'spec_longitude': "SpecLongitude._text", // not used
    'spec_movein_date' : "SpecMoveInDate.Day._text", 
    'spec_is_model' : "SpecIsModel._text", // not used
    'spec_price': "SpecPrice._attributes._text",
    'spec_square_footage' : "SpecSqft._text",
    'spec_number_of_stories' : "SpecStories._text",
    'spec_square_footage' : "SpecSqft._text",
    'spec_location' : "SpecLocation._text", // not used
    'spec_baths' : "SpecSqft._text",
    'spec_half_baths' : "SpecHalfBaths._text",
    'spec_square_footage' : "SpecBaths._text",
    'spec_bedrooms' : "SpecBedrooms._text",
    'spec_master_bedroom_location' : "SpecBedrooms._attributes.MasterBedLocation", // not used
    'spec_garage' : "SpecGarage._text",
    'spec_living_area' : "SpecLivingArea._text", // not used
    'spec_living_area_type' : "SpecLivingArea._attributes.Type", // not used, numbers 1-5 ignored
    'spec_marketing_headline' : "SpecMarketingHeadline._text",
    'spec_amenity' : "SpecAmenity._text", // not used
    'spec_amenity_type' : "SpecAmenity._cdata", // not used
    'spec_description' : "SpecDescription._cdata",
    'spec_dining_areas' : "SpecDiningAreas._text", // not used
    'spec_basement' : "SpecBasement._text.Type", // not used
    'spec_floorplan_url_1':  "SpecImages.SpecFloorPlanImage[0]._text",
    'spec_floorplan_url_2': "SpecImages.SpecFloorPlanImage[1]._text",
    // in zesty but not in bdx
    // spec_floorplan_image_1, spec_floorplan_image_2, spec_previous_price, google_maps_link, amenities, brochure, included_features, sort_order
}


// Label: Home Plan Model Spec Listing Images
// Content Model Name: spec-images-for-listing
// Content Model ZUID: 6-92e4ebb897-l88c9s
// https://3dlpqt3n.manage.zesty.io/#!/content/6-92e4ebb897-l88c9s
// BDX XML map: Builders.Corporation.Builder.Subdivision.Plan.Spec.SpecImages (SpecElevationImage|SpecInteriorImage)

var homePlanModelSpecImages = {
    'related_spec': "", // sourced by zesty
    'image_type' : "", // SpecElevationImage|SpecInteriorImage -- populated based upon the image type being looped through
    'image_url' : "_text",
    'sort_order': "_attributes.SequencePosition"
    // 'spec_image' : "_text", // stored in zesty
}

// Functionality

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