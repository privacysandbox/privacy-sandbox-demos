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

variable "project_id" {
  description = "The Google Cloud project ID"
}

resource "google_project_service" "artifactregistry" {
  project                    = var.project_id
  service                    = "artifactregistry.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "certificatemanager" {
  project                    = var.project_id
  service                    = "certificatemanager.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "cloudapis" {
  project                    = var.project_id
  service                    = "cloudapis.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "cloudbuild" {
  project                    = var.project_id
  service                    = "cloudbuild.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "cloudtrace" {
  project                    = var.project_id
  service                    = "cloudtrace.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "compute" {
  project                    = var.project_id
  service                    = "compute.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "confidentialcomputing" {
  project                    = var.project_id
  service                    = "confidentialcomputing.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "containerregistry" {
  project                    = var.project_id
  service                    = "containerregistry.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "datastore" {
  project                    = var.project_id
  service                    = "datastore.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "dns" {
  project                    = var.project_id
  service                    = "dns.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "edgecache" {
  project                    = var.project_id
  service                    = "edgecache.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "iamcredentials" {
  project                    = var.project_id
  service                    = "iamcredentials.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "logging" {
  project                    = var.project_id
  service                    = "logging.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "monitoring" {
  project                    = var.project_id
  service                    = "monitoring.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "networkmanagement" {
  project                    = var.project_id
  service                    = "networkmanagement.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "networkservices" {
  project                    = var.project_id
  service                    = "networkservices.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "oslogin" {
  project                    = var.project_id
  service                    = "oslogin.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "pubsub" {
  project                    = var.project_id
  service                    = "pubsub.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "secretmanager" {
  project                    = var.project_id
  service                    = "secretmanager.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "servicemanagement" {
  project                    = var.project_id
  service                    = "servicemanagement.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "serviceusage" {
  project                    = var.project_id
  service                    = "serviceusage.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "sqlcomponent" {
  project                    = var.project_id
  service                    = "sql-component.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "storage_api" {
  project                    = var.project_id
  service                    = "storage-api.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "storage_component" {
  project                    = var.project_id
  service                    = "storage-component.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "storage" {
  project                    = var.project_id
  service                    = "storage.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "trafficdirector" {
  project                    = var.project_id
  service                    = "trafficdirector.googleapis.com"
  disable_dependent_services = true
}
