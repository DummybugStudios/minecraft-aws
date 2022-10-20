const { CloudFormation } = require('@aws-sdk/client-cloudformation')
const {Lambda} = require("@aws-sdk/client-lambda")
const config = require('../cdkconfig.json')

const fs = require('fs')
const path = require('path')

async function getStackResources() {
    let client = new CloudFormation()
    let stacks = await client.listStacks({})
    let cdkStackFilter = stacks.StackSummaries.filter(x => x.StackName === "CdkStack" && x.DeletionTime === undefined)
    if (cdkStackFilter.length === 0) {
        throw new Error("Could not find CdkStack. Have you deployed it?")
    }
    let cdkStack = cdkStackFilter[0]

    if (!['UPDATE_COMPLETE', 'CREATE_COMPLETE'].includes(cdkStack.StackStatus)) {
        throw new Error(`Stack is not ready yet. STATUS: ${cdkStack.StackStatus}`)
    }

    // Find the correct resource
    return await client.describeStackResources({ StackName: cdkStack.StackName })
}

async function getAPIUrl()
{
    if (config.url) {
        return config.url
    }

    let stackResources = await getStackResources()
    let apiFunction  = stackResources.StackResources.find(x => x.LogicalResourceId === config.apiFunction)
    let lambda = new Lambda()
    let url = await lambda.getFunctionUrlConfig({FunctionName: apiFunction.PhysicalResourceId}).then(x=>x.FunctionUrl)
    config.url = url
    fs.writeFileSync(path.resolve(__dirname, "../cdkconfig.json"), JSON.stringify(config))

    return url
}

module.exports = {
    getAPIUrl: getAPIUrl
}