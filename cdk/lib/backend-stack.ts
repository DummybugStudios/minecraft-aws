import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_ecs as ecs,
  aws_ec2 as ec2,
  aws_efs as efs,
  RemovalPolicy,
} from 'aws-cdk-lib'
import { Construct } from 'constructs';

import * as config from "../config"

export class BackendStack extends cdk.Stack {

  public apiFunction : lambda.Function;
  public bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Create VPC
    const vpc = new ec2.Vpc(this, "minecraft-vpc", {
      natGateways: 0,
    })

    // Create ECS cluster
    const ecsCluster = new ecs.Cluster(this, "minecraft-server-cluster", {
      vpc: vpc
    })

    // Create ECS Service and security groups

    const ecsSecurityGroup = new ec2.SecurityGroup(this, "minecraft-security-group", {
      vpc: vpc,
      description: "Security group used by the minecraft ecs service",
      allowAllOutbound: true
    })

    ecsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), ec2.Port.tcp(25565), "Minecraft - tcp"
    )
    ecsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), ec2.Port.udp(25565), "Minecraft - udp"
    )
    ecsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), ec2.Port.tcp(efs.FileSystem.DEFAULT_PORT), "EFS"
    )

    // Create cloud file system in the same VPC
    const gameData = new efs.FileSystem(this, "minecraft-file-system", {
      vpc: vpc,
      securityGroup: ecsSecurityGroup,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const gameDataVolume = {
      name: 'gameDataVolume',
      efsVolumeConfiguration: {
        fileSystemId: gameData.fileSystemId,
      }
    }

    // create ECS task
    const ecsTask = new ecs.TaskDefinition(this, "minecraft-server-task", {
      compatibility: ecs.Compatibility.EC2_AND_FARGATE,
      cpu: "1024",
      memoryMiB: "2048",
    })

    ecsTask.addToTaskRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel"],
      resources: ['*']
    }))

    ecsTask.addVolume(gameDataVolume)

    const container = ecsTask.addContainer("minecraft-server-image", {
      image: ecs.ContainerImage.fromRegistry(config.docker_image),
      environment: {
        "MEMORYSIZE":'1536M'
      },
      memoryReservationMiB: 1536, // 1.5GiG
      portMappings: [{containerPort: 25565, hostPort:25565}],
      logging:ecs.LogDriver.awsLogs({streamPrefix:"ecs"}),
    })

    container.addMountPoints({
      containerPath: "/data",
      readOnly: false,
      sourceVolume: "gameDataVolume"
    })

    const ecsService = new ecs.FargateService(this, "minecraft-server-service", {
      taskDefinition: ecsTask,
      cluster: ecsCluster,
      assignPublicIp: true,
      desiredCount: 0,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      securityGroups: [ecsSecurityGroup],
      enableExecuteCommand: true,
    })

    // Create lambda function
    const apiFunctions = new lambda.Function(this, 'minecraft-status-function', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset("../lambda/")
    })

    apiFunctions.addEnvironment("cluster", ecsCluster.clusterArn)
    apiFunctions.addEnvironment("service", ecsService.serviceName)
    //TODO: Don't allow everything please, only what you need.
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
      websiteIndexDocument: "index.html",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
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