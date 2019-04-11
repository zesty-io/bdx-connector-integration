const test = require("ava");
const parseLib = require("./parse")
const fs = require("fs")

test("parseXML", async t => {
    const xml = "<root>Hello xml2js!</root>";
    const json = await parseLib.parse(xml)
    t.deepEqual(json, {root: "Hello xml2js!"})

})

test("parse BDX", async t => {
    const xml = `
        <Builders
            DateGenerated="2001-04-01T12:42:37"
            Translate="InSpanish"
            FileID="BeepBoop"
        />
    `
    const expected = {
        Builders: {
            $: {
                DateGenerated: "2001-04-01T12:42:37",
                Translate: "InSpanish",
                FileID: "BeepBoop"
            }
        }
    }
    const json = await parseLib.parse(xml)
    t.deepEqual(json, expected)
})

test("parse BDX.xml", async t => {
    fs.readFile("./planspec.xml", (err, data) => {
        if (err) throw err;
        const json = parseLib.parse(data);
        t.deepEqual({}, json)
    })
})

