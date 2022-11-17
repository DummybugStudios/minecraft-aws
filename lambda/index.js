const AWS = require('aws-sdk');
const ecs = new AWS.ECS();
const ec2 = new AWS.EC2(); 
const https = require('https');

AWS.config.update({region: 'eu-west-2'})
AWS.config.logger = console;

const CLUSTER = process.env.cluster
const SERVICE = process.env.service

async function getTaskIP()
{
  let listParams = 
  {
    cluster: CLUSTER,
    serviceName: SERVICE,
  };
  
  let tasks = await ecs.listTasks(listParams).promise().then(x=>x.taskArns);
  if (tasks.length === 0)
    return ""
  
  let describeParams = {
    cluster: CLUSTER,
    tasks: tasks,
  }
  
  // TODO: fix the [0] to be running tasks 
  // It seems that stopped tasks do not show up
  let describeResponse = await ecs.describeTasks(describeParams).promise();
  let descriptions = describeResponse.tasks[0];
  let eni = descriptions.attachments[0].details
    .filter(x => x.name === 'networkInterfaceId')[0]
    .value;
  
  let ec2params = {
    NetworkInterfaceIds: [eni]
  }
  let ec2response = await ec2.describeNetworkInterfaces(ec2params).promise();
  
  let ip = ec2response.NetworkInterfaces[0].Association.PublicIp;
  
  return ip;
}

async function getServiceStatus(){
  
  let params = {
    cluster: CLUSTER,
    services: [SERVICE],
  };
  
  let response = await ecs.describeServices(params).promise();
  let {desiredCount, pendingCount, runningCount} = response.services[0];
  
  
  let status = "";
  let ip = "";
  if (desiredCount == 0)
  {
    if (pendingCount + runningCount === 0)
      status = "Stopped";
    else
      status = "Stopping";
  }
  else {
    if (runningCount === 1)
    {
      status = "Running";
      ip = await getTaskIP();
    }
    else 
    
      status = "Starting";
  }
  
  return {"desired": desiredCount, "pending": pendingCount, "running": runningCount, "status": status, "ip": ip}; 
}

async function notifyOnDiscord(hasStarted){
  let post_data = JSON.stringify({
      content: `Server has been ${hasStarted ? "Started" : "Stopped"}`
  })
  
  let post_options = {
      host: "discord.com",
      port: 443,
      path: "REDACTED",
      method: "POST",
      headers: {
          "Content-Type":"application/json",
          "Content-Length": Buffer.byteLength(post_data)
      }
  }
  
  let mypromise = new Promise( resolve => {
    let post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8')
      resolve(res)
    })
    
    post_req.write(post_data)
    post_req.end()
  })
  return await mypromise

}


async function updateService(desiredCount){
  let params = {
    cluster: CLUSTER,
    service: SERVICE,
    desiredCount: desiredCount
  }
  
  let response = await ecs.updateService(params).promise();
  
//   await notifyOnDiscord(desiredCount);
  
  return {
    statusCode: 200,
    body: JSON.stringify(response)
  } 
}

exports.handler = async (event) => {
  
  let {path} = event.requestContext.http;
  
  let success = {statusCode: 200, body: "Success"}
  
  if (path === '/status') {
    return {
      statusCode: 200,
      body: JSON.stringify(await getServiceStatus())
    };
  }
  
  else if (path === "/start")
  {
    await updateService(1);
    return success;
  }
  
  else if (path === "/stop")
  {
    await updateService(0);
    return success;
  }
  
  else {
    return {
      statusCode: 404,
      body: "Invalid path"
    };
  }
  
};
