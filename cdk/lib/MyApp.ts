import * as cdk from 'aws-cdk-lib';
import * as cxapi from 'aws-cdk-lib/cx-api'
import { Function} from 'aws-cdk-lib/aws-lambda';
import * as fs from 'fs'
import * as path from 'path'
import * as config from '../config';

export class MyApp extends cdk.App {
    public apiFunction: Function
    public bucket: cdk.aws_s3.Bucket

    synth(options?: cdk.StageSynthesisOptions | undefined): cxapi.CloudAssembly {
        const value = super.synth(options)

        const functionArtifact = value.tryGetArtifact(config.stack_name)
        const logicalIds = functionArtifact?.manifest.metadata;

        // TODO: put this in a function just get it working for now
        const apiFunctionLogicalId = logicalIds?.[`/${this.apiFunction.node.path}/Resource`]
            .find(x => x.type === 'aws:cdk:logicalId')
            ?.data

        const bucketLogicalId = logicalIds?.[`/${this.bucket.node.path}/Resource`]
            .find(x => x.type === 'aws:cdk:logicalId')
            ?.data
        

        const data = {
            stackName: config.stack_name,
            apiFunction: apiFunctionLogicalId,
            bucket: bucketLogicalId
        }

        fs.writeFileSync(path.resolve("../web/cdkconfig.json"), JSON.stringify(data))

        console.log("\n\n\n")

        return value
    }
}