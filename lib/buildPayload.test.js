const test = require("ava");
const fs = require("fs");
const {buildPayload } = require("./buildPayload")

const fd = fs.openSync("./test/fixtures/planspec.xml", "r")
   
test("build item creation payload from XML", async t => {
    // read file based on file descriptor
    const fd = fs.openSync("./test/fixtures/planspec.xml", "r")
    // parse content and build payload
    const actualPayload = await buildPayload(fd)

    const expectedPayload = {
        web: {
            name: "Almond-Bisque Homes Corp.",
            label: "0123"
        }
    }

    t.deepEqual(actualPayload, expectedPayload)
})
