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
# - https://cloud.google.com/monitoring/uptime-checks

# Run this script from the root of the project directory
# ./scripts/monitoring_uptime.sh

# NOTE :
# This script is not idempotent. running it twice will create additional monitoring uptime checks without overriding or deleting the existing ones.
# You can use the script at the bottom to remove all existing checks at your own responsibility.

# load env vars
source .env.deploy
source ${ENV_FILE}
source .demos

# setup Google Cloud SDK project
gcloud config set project $GCP_PROJECT_NAME
gcloud config get-value project


# Iterate through the use cases to setup Synthetic Monitors
for demo in ${DEMOS}; do

  function=monitor-${demo}
  title="Monitor Use Case : ${DEMO_TITLE[$demo]}"

  # get function full name
  function_name=$(gcloud functions describe ${function} --format='value(name)')

  # Setup synthetic monitor with a check frequency of 10 min and a timeout of 60 sec
  gcloud monitoring uptime create "${title}" --synthetic-target="${function_name}" --period=10 --timeout=60

done

# Iterate through the services to setup Uptime checks
# for service in $SERVICES; do
#   echo "Setup Monitoring Uptime Check for Cloud Run Service \"${service}\""
#   # Setup a monitoring uptime check frequency of 10 min and a timeout of 10 sec
#   gcloud monitoring uptime create "Uptime Check for Cloud Run ${service} service" --protocol=https --request-method=get --status-classes=2xx --period=10 --timeout=10 --resource-type=cloud-run-revision --resource-labels=service_name=${service} --resource-labels=project_id=${GCP_PROJECT_NAME} --resource-labels=location=${GCP_REGION}
# done


# List uptime check ids
# gcloud monitoring uptime list-configs --format='value(name)'

# delete uptime check
# gcloud monitoring uptime delete CHECK_ID

# delete all uptime check
# for check_id in $(gcloud monitoring uptime list-configs --format='value(name)'); do
#   gcloud monitoring uptime delete $check_id
# done
