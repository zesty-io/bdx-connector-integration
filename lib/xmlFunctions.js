
module.exports.xmlToObject = async function (pathToFile){
    var convert = require('xml-js');
    const fs  = require('fs')
    
    var xml = fs.readFileSync(pathToFile, 'utf8');
    var options = {compact: true};
    return convert.xml2js(xml, options); 
}