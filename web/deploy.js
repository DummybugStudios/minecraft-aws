const { CloudFormation } = require('@aws-sdk/client-cloudformation')
const {Lambda} = require("@aws-sdk/client-lambda")
const config = require('./cdkconfig.json')


async function main() {

    let client = new CloudFormation()

    // Check if Stack exists and is ready
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
    let describeStacks = await client.describeStackResources({ StackName: cdkStack.StackName })
    let apiFunction  = describeStacks.StackResources.find(x => x.LogicalResourceId === config.apiFunction)
    console.log(`${apiFunction.PhysicalResourceId}\n`)

    let lambda = new Lambda()
    console.log(await lambda.getFunctionUrlConfig({FunctionName: apiFunction.PhysicalResourceId}).then(x=>x.FunctionUrl))

}

main();