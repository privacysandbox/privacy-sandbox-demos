#!/usr/bin/env zsh

# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# References :
# - https://cloud.google.com/monitoring/synthetic-monitors/create#monitoring_synthetic_monitor_create-gcloud

# Run this script from the root of the project directory
# ./scripts/monitoring_deploy.sh

# NOTE :
# Everytime you run this script, it will redeploy the monitoring function for each and every use cases
# Cloud Run function will build and deploy each of the function individually and it will take time
# This is good when you are first setting up monitoring functions but not if you are only updating one function,
# We recommend you to use one of the example command line below to deploy the updated function only.


# load env vars
source .env.deploy
source .demos

# setup Google Cloud SDK project
gcloud config set project $GCP_PROJECT_NAME
gcloud config get-value project

# Read env vars to pass to Cloud Functions
ENV_VARS=$(cat ${ENV_FILE} | grep "=" | grep -v "^PORT=" | sed '/^$/d' | tr "\n" "@")
echo ${ENV_VARS}


# Iterate through the use cases to deploy Cloud Functions
for demo in ${DEMOS}; do

  function=monitor-${demo}
  entrypoint="${DEMO_MONITORING_ENTRYPOINT[$demo]}"

  # deploy monitoring function
  gcloud functions deploy ${function} --gen2 --runtime=nodejs18 --region=${GCP_REGION} --source="monitoring/puppeteer-nodejs/" --entry-point=${entrypoint} --memory=2G --timeout=60 --trigger-http --ingress-settings=internal-only --no-allow-unauthenticated --set-env-vars "^@^${ENV_VARS}"
  exit
done


# Deploy functions to be used by Cloud Monitoring synethic monitor (use these command individually when you want to update only one function)

# gcloud functions deploy monitor-uc-single-touch-conversion --gen2 --runtime=nodejs18 --region="us-central1" --source="monitoring/puppeteer-nodejs/" --entry-point=MonitorUcSingleTouchConversion --memory=2G --timeout=60 --trigger-http --ingress-settings=internal-only --no-allow-unauthenticated
# gcloud functions deploy monitor-uc-remarketing --gen2 --runtime=nodejs18 --region="us-central1" --source="monitoring/puppeteer-nodejs/" --entry-point=MonitorUcRemarketing --memory=2G --timeout=60 --trigger-http --ingress-settings=internal-only --no-allow-unauthenticated
# gcloud functions deploy monitor-uc-vast-video-paapi --gen2 --runtime=nodejs18 --region="us-central1" --source="monitoring/puppeteer-nodejs/" --entry-point=MonitorUcVastVideoPaapi --memory=2G --timeout=60 --trigger-http --ingress-settings=internal-only --no-allow-unauthenticated
# gcloud functions deploy monitor-uc-video-multi-seller-seq-auction-paapi --gen2 --runtime=nodejs18 --region="us-central1" --source="monitoring/puppeteer-nodejs/" --entry-point=MonitorUcVideoMultiSellerSeqAuctionPaapi --memory=2G --timeout=60 --trigger-http --ingress-settings=internal-only --no-allow-unauthenticated

# List all functions
# gcloud functions list

# find the fully-qualified name for a specific Cloud Run Function
# gcloud functions describe monitor-uc-single-touch-conversion --format='value(name)'

# Print Cloud Run Function URL
# gcloud run services describe monitor-uc-single-touch-conversion --format='value(status.url)'
