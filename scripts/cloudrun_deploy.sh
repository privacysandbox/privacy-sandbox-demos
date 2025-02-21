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

# load env vars
source .env.deploy
source ${ENV_FILE}

# setup Google Cloud SDK project
gcloud config set project $GCP_PROJECT_NAME
gcloud config get-value project

# Containerize all services with Cloud Build : build containers, upload to Container Registry, and deploy to Cloud Run
gcloud builds submit --config=cicd/cloudbuild.yaml --region="us-central1" --substitutions=_LOCATION="us-central1",_REPOSITORY="docker-repo",_PROJECT_ENV="dev",COMMIT_SHA="latest" .

# Cloud Build
for service in $SERVICES; do
  echo deploy $GCP_PROJECT_NAME/${service}

  # Print Cloud Run URL
  gcloud run services describe ${service} --format 'value(status.url)'
done
