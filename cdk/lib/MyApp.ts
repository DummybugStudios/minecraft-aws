import * as cdk from 'aws-cdk-lib';
import * as cxapi from 'aws-cdk-lib/cx-api'
import { Function} from 'aws-cdk-lib/aws-lambda';
import * as fs from 'fs'
import * as path from 'path'

export class MyApp extends cdk.App {
    public apiFunction: Function
    public bucket: cdk.aws_s3.Bucket

    synth(options?: cdk.StageSynthesisOptions | undefined): cxapi.CloudAssembly {
        let value = super.synth(options)

        let functionArtifact = value.tryGetArtifact('CdkStack')
        let logicalIds = functionArtifact?.manifest.metadata;

        // TODO: put this in a function just get it working for now
        let apiFunctionLogicalId = logicalIds?.[`/${this.apiFunction.node.path}/Resource`]
            .find(x => x.type === 'aws:cdk:logicalId')
            ?.data

        let bucketLogicalId = logicalIds?.[`/${this.bucket.node.path}/Resource`]
            .find(x => x.type === 'aws:cdk:logicalId')
            ?.data
        

        let data = {
            apiFunction: apiFunctionLogicalId,
            bucket: bucketLogicalId
        }

        fs.writeFileSync(path.resolve("../web/cdkconfig.json"), JSON.stringify(data))

        console.log("\n\n\n")

        return value
    }
}