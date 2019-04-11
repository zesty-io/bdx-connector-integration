const parseString = require('xml2js').parseString;

function parse(xml) {
    return new Promise((resolve, reject) => {
        parseString(xml, {trim: true}, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res)
            }
        })
    })
}

module.exports = {
    parse
}