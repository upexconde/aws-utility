
require('dotenv').config();
const AWS = require('aws-sdk');
const os = require('os');
const path = require('path');
const awsSSOHelper = require('./src/helper');
const { execSync } = require('child_process');

const {
  AWS_PROFILE,
  AWS_REGION,
  EKS_NONPROD_AWS_ACCESS_KEY_ID,
  EKS_NONPROD_AWS_SECRET_ACCESS_KEY,
  NODE_ENV
} = process.env;

process.env.AWS_PROFILE = AWS_PROFILE;
process.env.NODE_ENV = NODE_ENV;

execSync(`export AWS_PROFILE=${AWS_PROFILE} NODE_ENV=${NODE_ENV}`, {
  stdio: 'inherit',
});

AWS.config.update({
  accessKeyId: EKS_NONPROD_AWS_ACCESS_KEY_ID,
  secretAccessKey: EKS_NONPROD_AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION
});
let ssoCredentials;

const sts = new AWS.STS();

async function getSSOCredentials() {
  try {
    const { Credentials: { SessionToken, AccessKeyId, SecretAccessKey, Expiration } } = await sts.getSessionToken().promise();

    return {
      accessKeyId: AccessKeyId,
      secretAccessKey: SecretAccessKey,
      sessionToken: SessionToken,
      expiration: Expiration
    };
  } catch (error) {
    console.error('Error getting SSO credentials:', error);
    throw error;
  }
}

function setupCredentials(ssoCredentials) {
  const { accessKeyId, secretAccessKey, sessionToken } = ssoCredentials;
  // setup profile credentials only once
  const credentialsFile = path.join(os.homedir(), '.aws', 'credentials');
  const credentials = `aws_access_key_id=${accessKeyId}\naws_secret_access_key=${secretAccessKey}\naws_session_token=${sessionToken}\n`;

  awsSSOHelper(credentialsFile, credentials, `[${AWS_PROFILE}]`);
}

async function refreshSSOCredentials() {
  try {
    ssoCredentials = await getSSOCredentials();
    setupCredentials(ssoCredentials)
    console.log('SSO credentials refreshed');
  } catch (error) {
    console.error('Error refreshing SSO credentials:', error);
  }
}

function startTimer() {
  const refreshInterval = ssoCredentials.expiration.getTime() - Date.now() - 10000;
  setTimeout(() => {
    refreshSSOCredentials();
    startTimer();
  }, refreshInterval);
}

async function main() {
  try {
    // setup profile only once
    const configFile = path.join(os.homedir(), '.aws', 'config');
    const configNewContent = `region=${AWS_REGION}\noutput=json\n`;
    awsSSOHelper(configFile, configNewContent, `[profile ${AWS_PROFILE}]`);

    ssoCredentials = await getSSOCredentials();
    setupCredentials(ssoCredentials);
    //startTimer();
  } catch (error) {
    console.error('Error accessing AWS resources:', error);
  }
}

main();
