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

# evaluate .env file
source .env
source .env.deploy

# CloudRun doesn't support .env file, so grab values here and merge into single variable
ENV_VARS=$(cat .env | grep "=" | grep -v "^PORT=" | sed '/^$/d' | tr "\n" "@")
echo ${ENV_VARS}

# setup Google Cloud SDK project
gcloud config set project $GCP_PROJECT_NAME
gcloud config get-value project

# make the default region us-central1
gcloud config set run/region us-central1

# Cloud Build
for service in $SERVICES; do
  echo deploy $GCP_PROJECT_NAME/${service}

  ## push docker image
  # docker push gcr.io/$GCP_PROJECT_NAME/${service}

  # Containerize app  with Cloud Build and upload it to Container Registry
  gcloud builds submit services/${service} --tag gcr.io/$GCP_PROJECT_NAME/${service}

  # add "--min-instances 1" to have your service always on (cpu and memory billing will go up accordingly)
  gcloud run deploy ${service} \
    --image gcr.io/$GCP_PROJECT_NAME/${service}:latest \
    --platform managed \
    --region us-central1 \
    --memory 2Gi \
    --min-instances 1 \
    --set-env-vars "^@^${ENV_VARS}"

  # Allowing public (unauthenticated) access to Cloud Run services
  gcloud run services add-iam-policy-binding ${service} \
  --member="allUsers" \
  --role="roles/run.invoker"

  # Print Cloud Run URL
  gcloud run services describe ${service} --format 'value(status.url)'
done
