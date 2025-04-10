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

# Required variables
variable "service_account_name" {
  type        = string
  description = "The name of the service account to create."
}

variable "project_id" {
  type        = string
  description = "The ID of the project where the service account will be created."
}

# Resource to create the service account
resource "google_service_account" "workload_operator" {
  account_id   = var.service_account_name
  display_name = var.service_account_name
  project      = var.project_id
}

resource "google_project_iam_member" "artifactregistry_download_artifacts" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "artifactregistry_upload_artifacts" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "cloudtrace_patch_traces" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "compute_get_instances" {
  project = var.project_id
  role    = "roles/compute.viewer"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "compute_use_network" {
  project = var.project_id
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "compute_set_labels" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "confidentialcomputing_workloads" {
  project = var.project_id
  role    = "roles/confidentialcomputing.workloadUser"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "logging_create_log_entries" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "monitoring_create_metrics" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "pubsub_consume_subscriptions" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "pubsub_create_subscriptions" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "secretmanager_access_versions" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_project_iam_member" "trafficdirector_get_networks_configs" {
  project = var.project_id
  role    = "roles/trafficdirector.client"
  member  = "serviceAccount:${google_service_account.workload_operator.email}"
}

resource "google_storage_hmac_key" "key" {
  project               = var.project_id
  service_account_email = google_service_account.workload_operator.email
}

resource "google_secret_manager_secret" "hmac_key" {
  project = var.project_id
  # If the following secret_id is changed, make sure to update any usage of
  # module.secrets.gcs_hmac_key.
  secret_id = "gcs-hmac-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "hmac_key_version" {
  secret      = google_secret_manager_secret.hmac_key.id
  secret_data = google_storage_hmac_key.key.access_id
}

resource "google_secret_manager_secret" "hmac_secret" {
  project = var.project_id
  # If the following secret_id is changed, make sure to update any usage of
  # module.secrets.gcs-hmac-secret.
  secret_id = "gcs-hmac-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "hmac_secret_version" {
  secret      = google_secret_manager_secret.hmac_secret.id
  secret_data = google_storage_hmac_key.key.secret
}

output "service_account_full_name" {
  value = "${google_service_account.workload_operator.display_name}@${google_service_account.workload_operator.project}.iam.gserviceaccount.com"
}
