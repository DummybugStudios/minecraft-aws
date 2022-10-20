const {getAPIUrl} = require ('./cdk-utils')

async function main() {
    console.log(await getAPIUrl())
}

main();