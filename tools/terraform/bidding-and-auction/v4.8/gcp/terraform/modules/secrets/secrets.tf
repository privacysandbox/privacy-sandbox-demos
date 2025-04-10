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

data "google_secret_manager_secret_version" "tls_key" {
  provider = google-beta
  secret   = "envoy-tls-termination-key"
}

data "google_secret_manager_secret_version" "tls_cert" {
  provider = google-beta
  secret   = "envoy-tls-termination-cert"
}

data "google_secret_manager_secret_version" "gcs_hmac_key" {
  provider = google-beta
  secret   = "gcs-hmac-key"
}

data "google_secret_manager_secret_version" "gcs_hmac_secret" {
  provider = google-beta
  secret   = "gcs-hmac-secret"
}

output "tls_key" {
  value       = data.google_secret_manager_secret_version.tls_key.secret_data
  description = "The TLS Private Key used by BFE/SFE to terminate connections from the load balancer."
  sensitive   = true
}

output "tls_cert" {
  value       = data.google_secret_manager_secret_version.tls_cert.secret_data
  description = "The TLS Private Certificate used by BFE/SFE. May be self-signed, the parent chain is not validated."
  sensitive   = true
}

output "gcs_hmac_key" {
  value       = data.google_secret_manager_secret_version.gcs_hmac_key.secret_data
  description = "hmac_key used by otel collector to write to GCS. see cloud.google.com/storage/docs/authentication/managing-hmackeys#create"
  sensitive   = true
}

output "gcs_hmac_secret" {
  value       = data.google_secret_manager_secret_version.gcs_hmac_secret.secret_data
  description = "the secret of hmac_key used by otel collector to write to GCS. see cloud.google.com/storage/docs/authentication/managing-hmackeys#create"
  sensitive   = true
}
