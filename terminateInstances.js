const AWS = require('aws-sdk');
require('dotenv').config()
const secretAccessKey = process.env.secretAccessKey;
const accessKeyId = process.env.accessKeyId;
AWS.config.update({
    region: 'us-east-1',
    accessKeyId,
    secretAccessKey,
});
const ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

async function listAndTerminateInstances() {
  try {
    // Describe instances to get the list of active instances
    const data = await ec2.describeInstances({}).promise();
  
    // Collect the IDs of all active instances
    const instanceIds = [];
    for (const reservation of data.Reservations) {
      for (const instance of reservation.Instances) {
        if (instance.State.Name === 'running' || instance.State.Name === 'pending') {
          instanceIds.push(instance.InstanceId);
          console.log(`Found active instance with ID: ${instance.InstanceId}`);
        }
      }
    }
  
    // Terminate instances
    if (instanceIds.length > 0) {
      const terminationData = await ec2.terminateInstances({
        InstanceIds: instanceIds
      }).promise();
  
      for (const terminatingInstance of terminationData.TerminatingInstances) {
        console.log(`Terminating instance with ID: ${terminatingInstance.InstanceId}`);
      }
    } else {
      console.log('No active instances found to terminate.');
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}

listAndTerminateInstances();