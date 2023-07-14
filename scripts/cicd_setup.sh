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
source .env.deploy

# setup Google Cloud SDK project
gcloud config set project $GCP_PROJECT_NAME
gcloud config get-value project

# Enable Cloud Run API
gcloud services enable artifactregistry.googleapis.com

# create docker repository in Cloud Artifact Registry
gcloud artifacts repositories create docker-repo --repository-format=docker \
--location=us-central1 --description="Privacy Sandbox Demos Docker repository"

# set default repository
gcloud config set artifacts/repository docker-repo


# set default location
gcloud config set artifacts/location us-central1
