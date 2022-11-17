const { CloudFormation } = require('@aws-sdk/client-cloudformation')
const {Lambda} = require("@aws-sdk/client-lambda")
const {S3} = require("@aws-sdk/client-s3")
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

function findByLogicalId(stackResources, id)
{
    return stackResources.StackResources.find(x => x.LogicalResourceId === id)

}

async function getAPIUrl()
{
    if (config.url) {
        return config.url
    }

    let stackResources = await getStackResources()
    let apiFunction  = findByLogicalId(stackResources, config.apiFunction)
    let lambda = new Lambda()
    let url = await lambda.getFunctionUrlConfig({FunctionName: apiFunction.PhysicalResourceId}).then(x=>x.FunctionUrl)
    config.url = url
    fs.writeFileSync(path.resolve(__dirname, "../cdkconfig.json"), JSON.stringify(config))

    return url
}

async function getWebsiteBucketName() {
    let stackResources = await getStackResources()
    // return stackResources
    let bucket = findByLogicalId(stackResources, config.bucket)
    return bucket.PhysicalResourceId
}

async function getWebsiteURL() {
    let bucketName = await getWebsiteBucketName()
    let s3 = new S3()
    let website = await s3.getBucketLocation({Bucket: bucketName})
    let region = website.LocationConstraint
    return `${bucketName}.s3-website.${region}.amazonaws.com`
}

module.exports = {
    getAPIUrl,
    getWebsiteBucketName,
    getWebsiteURL,
}