
module.exports.returnHydratedModel = async function (z2bdxModel,dataSource) {
    let hydratedModel = z2bdxModel
    try {
        // loop through object
        for (var key in z2bdxModel) {
            let objectMap = z2bdxModel[key]

            hydratedModel[key] = await extractData(objectMap,dataSource)

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
        if( objToCheck.hasOwnProperty(paths[i])) {
            objToCheck = objToCheck[paths[i]]
            console.log(objToCheck)
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
