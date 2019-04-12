const fs = require("fs");
const { parse } = require("./parse")

async function buildPayload(fd) {
    const stat = fs.fstatSync(fd)
    let buf = Buffer.alloc(stat.size);
    const bytesRead = fs.readSync(fd, buf, 0, stat.size, 0);
    const xml = buf.toString('utf8');
    const content = await parse(xml);

    // payload schema goes here
    const payload = {
        web: {
            name: content["Builders"]["Corporation"][0]["CorporateName"][0],
            label: content["Builders"]["Corporation"][0]["CorporateBuilderNumber"][0]
        }
    }
    return payload;
}

module.exports = {buildPayload}