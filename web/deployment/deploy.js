const {getAPIUrl, getWebsiteBucketName} = require ('./cdk-utils')
const {S3Client} = require('@aws-sdk/client-s3')
const S3SyncClient = require('s3-sync-client')

async function main() {
    let bucketName = await getWebsiteBucketName()
    let s3Client = new S3Client();
    let {sync} = new S3SyncClient({client: s3Client})
    await sync ('dist', `s3://${bucketName}`)

}

main();