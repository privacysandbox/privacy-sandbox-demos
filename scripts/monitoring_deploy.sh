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
# - https://cloud.google.com/monitoring/synthetic-monitors/create#monitoring_synthetic_monitor_create-console

# Run this script from the root of the project directory
# ./scripts/monitoring_deploy.sh

# load env vars
source .env.deploy

# setup Google Cloud SDK project
gcloud config set project $GCP_PROJECT_NAME
gcloud config get-value project

# Read env vars to pass to Cloud Functions
ENV_VARS=$(cat ${ENV_FILE} | grep "=" | grep -v "^PORT=" | sed '/^$/d' | tr "\n" "@")
echo ${ENV_VARS}

# list of use case demos
USECASES=("uc-single-touch-conversion" "uc-remarketing" "uc-vast-video-paapi" "uc-video-multi-seller-seq-auction-paapi")

# For each use case we need their Cloud Function Entry Point
typeset -A USECASES_ENTRYPOINT
USECASES_ENTRYPOINT[uc-single-touch-conversion]=MonitorUcSingleTouchConversion
USECASES_ENTRYPOINT[uc-remarketing]=MonitorUcRemarketing
USECASES_ENTRYPOINT[uc-vast-video-paapi]=MonitorUcVastVideoPaapi
USECASES_ENTRYPOINT[uc-video-multi-seller-seq-auction-paapi]=MonitorUcVideoMultiSellerSeqAuctionPaapi

# For each use case we need to define the Synethtic Monitor Title
typeset -A USECASES_TITLE
USECASES_TITLE[uc-single-touch-conversion]="Monitor Use Case : Single-touch conversion Attribution"
USECASES_TITLE[uc-remarketing]="Monitor Use Case : Remarketing"
USECASES_TITLE[uc-vast-video-paapi]="Monitor Use Case : Instream VAST video ad in a Protected Audience single-seller auction"
USECASES_TITLE[uc-video-multi-seller-seq-auction-paapi]="Monitor Use Case : Instream video ad in a Protected Audience multi-seller sequential auction setup"

# Iterate through the use cases to deploy Cloud Functions
for usecase in ${USECASES}; do

  FUNCTION=monitor-${usecase}
  ENNTRYPOINT="${USECASES_ENTRYPOINT[$usecase]}"

  # deploy monitoring function
  gcloud functions deploy ${FUNCTION} --gen2 --runtime=nodejs18 --region="us-central1" --source="monitoring/puppeteer-nodejs/" --entry-point=${ENNTRYPOINT} --memory=2G --timeout=60 --trigger-http --ingress-settings=internal-only --no-allow-unauthenticated --set-env-vars "^@^$${ENV_VARS}"

done

# Iterate through the use cases to setup Synthetic Monitors
# NOTE : you don't need to re-create the monitors every time you re-deploy / update a function
# for usecase in ${USECASES}; do

#   FUNCTION=monitor-${usecase}
#   TITLE="${USECASES_TITLE[$usecase]}"

#   # get function full name
#   FUNCTION_NAME=$(gcloud functions describe ${FUNCTION} --format='value(name)')

#   # Setup synthetic monitor with a check frequency of 10 min and a timeout of 60 sec
#   gcloud monitoring uptime create "${TITLE}" --synthetic-target="${FUNCTION_NAME}" --period=10 --timeout=60

# done

# List uptime check configs
# gcloud monitoring uptime list-configs

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

# Create synthetic monitors with a check frequency of 10 min and a timeout of 60 sec
# Template : gcloud monitoring uptime create DISPLAY_NAME --synthetic-target=TARGET --period=10 --timeout=60

# List uptime check configs
# gcloud monitoring uptime list-configs

# List uptime check names
# gcloud monitoring uptime list-configs  --format='value(name)'
