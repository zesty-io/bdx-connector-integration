require("dotenv").config()

const server = require("express")();
const zesty = require("@zesty-io/sdk-express-middleware");

const parseLib = require("./lib/parse")

const bodyParser = require("body-parser");

const fs = require("fs")

server.use(
    zesty({
        instance: process.env.ZESTY_INSTANCE_ZUID,
        token: process.env.ZESTY_INSTANCE_TOKEN,
        email: process.env.ZESTY_USER_EMAIL,
        password: process.env.ZESTY_USER_PASSWORD,
        options: {
            authURL: process.env.ZESTY_AUTH_API,
            instancesAPIURL: process.env.ZESTY_INSTANCE_API,
            accountsAPIURL: process.env.ZESTY_ACCOUNTS_API
        }
    })
);

server.get("/:contentModelZUID/items",  async (req, res) => {
    try {
        // Get XML file via FTP
        // Parse XML file
        // Build Payload
        // Send Payload to instanceß

        const xml = `<title>Hello xml2js!</title>`;
        const xmlToJSON = await parseLib.parse(xml);
        console.log(xmlToJSON)

        const payload = {
            web: {
                name: "Test Dataset Content Model 9000+",
                label: "Test Dataset",
                type: "dataset",
                parentZUID: "0",
                listed: true,
                pathPart: "test-dataset-contentmodel-90001",
            },
            data: xmlToJSON
        }

        const result = await req.app.locals.zesty.instance.createItem(modelZUID, payload)
        res.send(result)
    } catch (error) {
        console.error(error);
        res.send(error)
    }
})

server.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
})
