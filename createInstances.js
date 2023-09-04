const AWS = require('aws-sdk');
require('dotenv').config()
const secretAccessKey = process.env.secretAccessKey;
const accessKeyId = process.env.accessKeyId;
const url = process.env.url
// Update our AWS Service Object to the desired region.
AWS.config.update({
    region: 'us-east-2',
    accessKeyId,
    secretAccessKey,
});
const baseParams = {
    ImageId: 'ami-0c55b159cbfafe1f0', // Amazon Linux 2 LTS
    InstanceType: 'c5.xlarge', // Upgraded from 't3.micro' to 'c5.xlarge'
    KeyName: 'Joony', // Replace with your key pair name
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: ['sg-0173783397dff5fb7'] // Default security group
};
// Create EC2 service object
const ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });

const instancesToLaunch = 100;
const instanceParamsList = [];
for (let i = 0; i < instancesToLaunch; i++) {
    const start_index = i * 10;
    const end_index = start_index + 15;

    // Here, we add UserData to run a script on startup. 
    // This is a base64 encoded string that specifies the environment variables.
    const userData = Buffer.from(`#!/bin/bash
    set -x
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
    
    # Add a sleep command to wait for 30 seconds
    sleep 30 

    # Add env vars with sudo permissions
    export start_index=${start_index}
    export end_index=${end_index}
    export url=${url}
    # Update the package database
    sudo apt-get update
    
    # Install required dependencies for Chrome
    sudo apt-get install -y wget unzip fontconfig fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
    
    # Install Chrome
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    sudo DEBIAN_FRONTEND=noninteractive dpkg -i google-chrome-stable_current_amd64.deb || sudo DEBIAN_FRONTEND=noninteractive apt-get -f install -y
    
    # Install NVM and Node.js
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 16
    
    # Install Git
    sudo apt-get install -y git
    
    # Clone your GitHub repository
    git clone https://github.com/AKCodez/viewbot.git /home/ubuntu/viewbot
    
    # Change directory to your project
    cd /home/ubuntu/viewbot

    # Install Node.js dependencies
    npm install
    
    # Run your Node.js script and redirect output to a log file
    node kraken.js > /home/ubuntu/kraken.log 2>&1
    
  `).toString('base64');

    const instanceParams = { ...baseParams, UserData: userData };
    instanceParamsList.push(instanceParams);
}

const instanceInfo = [];

// Function to launch a single EC2 instance
const launchInstance = async (params) => {
    return new Promise((resolve, reject) => {
        ec2.runInstances(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                const instanceId = data.Instances[0].InstanceId;
                resolve(instanceId);
            }
        });
    });
};

// Function to describe instances and get their public IPs
const describeInstances = async (instanceIds) => {
    return new Promise((resolve, reject) => {
        const params = {
            InstanceIds: instanceIds,
        };
        ec2.describeInstances(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Reservations.map(res => res.Instances[0].PublicIpAddress));
            }
        });
    });
};

// Launch all instances and store their IDs and IPs
const launchAllInstances = async () => {
    const instanceIds = [];
    for (const params of instanceParamsList) {
        try {
            const instanceId = await launchInstance(params);
            console.log(`Launched instance with ID: ${instanceId}`);
            instanceIds.push(instanceId);
        } catch (err) {
            console.error(`Failed to launch instance: ${err}`);
        }
    }

    console.log({instanceIds})

    try {
        const publicIps = await describeInstances(instanceIds);
        for (let i = 0; i < instanceIds.length; i++) {
            instanceInfo.push({
                InstanceId: instanceIds[i],
                PublicIp: publicIps[i]
            });
        }

        // Output the instance IDs and IPs as a JSON array
        console.log(JSON.stringify(instanceInfo));
    } catch (err) {
        console.error(`Failed to describe instances: ${err}`);
    }
};



// Execute the function to launch instances
launchAllInstances().catch(console.error);
// get logs
// cat /var/log/cloud-init-output.log
// tail -f /var/log/user-data.log
// tail -f kraken.log
