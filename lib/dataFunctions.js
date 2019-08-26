
module.exports.returnHydratedModel = async function (z2bdxModel,dataSource) {
    let hydratedModel = z2bdxModel
    try {
        // loop through object
        for (var key in z2bdxModel) {
            let objectStringMap = z2bdxModel[key]

            hydratedModel[key] = await extractData(objectStringMap,dataSource)

        }

        return hydratedModel;

    } catch (err) {
        return err
    }
}

// takes the string path on the object, splits it, loops through checking if reference exists on the object
// iteration through the process until complete
// if all reference exist it return its data, otherwise a blank string
async function extractData(objectMapStr,dataSource) {
    let paths = objectMapStr.split(".");
    let len = paths.length
    let objToCheck = dataSource

    for (var i = 0; i < len; i++) {
        // check each part
        if( objToCheck.hasOwnProperty(paths[i])) {
            objToCheck = objToCheck[paths[i]]
        } else {
            return ""
        }

        // extract final value
        if(i == (len -1)){
            return objToCheck;
        }
    }
    return paths

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