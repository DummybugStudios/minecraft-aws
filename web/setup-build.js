const {getAPIUrl} = require("./deployment/cdk-utils.js")

async function main() {
    await getAPIUrl()
}
main()