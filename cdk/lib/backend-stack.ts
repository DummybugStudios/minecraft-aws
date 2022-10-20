import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_iam as iam,
  aws_s3_deployment as s3deploy,
  aws_lambda as lambda,
} from 'aws-cdk-lib'
import {Function } from 'aws-cdk-lib/aws-lambda';

import { Construct } from 'constructs';

export class BackendStack extends cdk.Stack {

  public apiFunction : Function;
  public bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Create lambda function

    const apiFunctions = new lambda.Function(this, 'minecraft-status-function', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset("../lambda/")
    })

    apiFunctions.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*']
      }
    })
    //TODO: add the permissions for api functions to be able to access ec2 and ecs
    
    // Create website bucket
    const websiteBucket = new s3.Bucket(this, "minecraft-website-bucket", {
      websiteIndexDocument: "index.html"
    });
    

    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject'],
        resources: [`${websiteBucket.bucketArn}/*`]
      })
    )

    // For use by the app
    this.apiFunction = apiFunctions;
    this.bucket = websiteBucket;
  }
}