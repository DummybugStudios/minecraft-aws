import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_ecs as ecs,
  aws_ec2 as ec2,
} from 'aws-cdk-lib'
import { Construct } from 'constructs';

export class BackendStack extends cdk.Stack {

  public apiFunction : lambda.Function;
  public bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create ECS cluster
    const ecsCluster = new ecs.Cluster(this, "miencraft-server-cluster")

    // create ECS task
    const ecsTask = new ecs.TaskDefinition(this, "minecraft-server-task", {
      compatibility: ecs.Compatibility.EC2_AND_FARGATE,
      cpu: "1024",
      memoryMiB: "2048",
    })

    ecsTask.addContainer("minecraft-server-image", {
      image: ecs.ContainerImage.fromRegistry("registry.hub.docker.com/marctv/minecraft-papermc-server:latest"),
      environment: {
        "MEMORYSIZE":'1.5G'
      },
      memoryReservationMiB: 1536, // 1.5GiG
    })

    // Create ECS Service and security groups

    const ecsSecurityGroup = new ec2.SecurityGroup(this, "minecraft-security-group", {
      vpc: ecsCluster.vpc,
      description: "Security group used by the minecraft ecs service",
      allowAllOutbound: true
    })

    ecsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), ec2.Port.tcp(25565), "Minecraft - tcp"
    )
    ecsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), ec2.Port.udp(25565), "Minecraft - udp"
    )


    const ecsService = new ecs.FargateService(this, "minecraft-server-service", {
      taskDefinition: ecsTask,
      cluster: ecsCluster,
      assignPublicIp: true,
      desiredCount: 0,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      securityGroups: [ecsSecurityGroup],
      //TODO: enableExecuteCommand: true,
    })

    // Create lambda function
    const apiFunctions = new lambda.Function(this, 'minecraft-status-function', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset("../lambda/")
    })

    apiFunctions.addEnvironment("cluster", ecsCluster.clusterArn)
    apiFunctions.addEnvironment("service", ecsService.serviceName)
    apiFunctions.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ec2:*', "ecs:*"],
      resources: ['*']
    }))

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