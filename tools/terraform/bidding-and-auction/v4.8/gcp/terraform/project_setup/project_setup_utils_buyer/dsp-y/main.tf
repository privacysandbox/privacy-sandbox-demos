# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

terraform {
  required_version = ">= 1.2.3"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.2.0"
    }
  }

  backend "gcs" {
    bucket = "gtech-privacy-baservices-dev-state"
    prefix = "project_setup_utils/buyer/dsp-y"
  }
}

module "domain" {
  source     = "./domain"
  project_id = var.project_id
  domain     = var.domain
}

module "service_account" {
  source               = "./service_account"
  project_id           = var.project_id
  service_account_name = var.service_account_name
}
