
module.exports.returnHydratedModel = async function (z2bdxModel,dataSource) {
    let hydratedModel = {}
    // loop through object
    try {
        for (var key in z2bdxModel) {
            let objectStringMap = z2bdxModel[key]
            hydratedModel[key] = await extractData(objectStringMap,dataSource)
            if(hydratedModel[key] == "") delete hydratedModel[key] // this is needed to prevent zesty from throughing an error for empty string on number fields
        }
        return hydratedModel
    } catch (err) {
        return err
    }
   
}

// helper function to clean up data
module.exports.stripMarkdup = function (html)
{
   return stripMarkdup(/<(?:.|\n)*?>/gm, '');
}

module.exports.subWords = function(str, num){
   return subWords(str, num)
}

module.exports.makePathPart = function(str){
     return subWords(str.replace(/\./g,''),150).toLowerCase().replace(/ |'|\/|"|!|,/g,'-').replace('--','-');
}

module.exports.makeTitle = function(str){
    return subWords(stripMarkdup(str),100);
}

module.exports.makeMetaTitle = function(str){
    return subWords(stripMarkdup(str),60);
}

module.exports.makeLinkText = function(str){
    return subWords(stripMarkdup(str),30);
}

module.exports.makeMetaDescription = function(str){
    return subWords(
        stripMarkdup(str).substring(0,160)
        ,60
        );
}

function stripMarkdup(html)
{
   return html.replace(/<(?:.|\n)*?>/gm, '');
}
function subWords(str, num){
    var trimmedString = str.substr(0, num).trim() + " ";
    return trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
}


// takes the string path on the object, splits it, loops through checking if reference exists on the object
// iteration through the process until complete
// if all reference exist it return its data, otherwise a blank string
async function extractData(objectMapStr,dataSource) {
    let properties = objectMapStr.split(".")
    let len = properties.length
    let objToCheck = dataSource

    for (var i = 0; i < len; i++) {
        // check each part
        if( objToCheck.hasOwnProperty(properties[i]) ) {
            objToCheck = objToCheck[properties[i]]
        } else {
            return ""
        }

    }
    
    return (typeof objToCheck == "string") ? objToCheck.replace(/"/g, '"') : objToCheck
}



async function testExtract(){
    // test data
    let to =  {
        '_attributes' : {
            'SequencePosition' : 1
        },
        '_text' : 'helloworld'
    }

    try {
        return await module.exports.returnHydratedModel(planImageModel,to)
    } catch(err) {
        res.send("Failed to connect to the FTP: " + err)
    }  

}