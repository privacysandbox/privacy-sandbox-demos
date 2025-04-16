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

# Variables (you can set these values when running Terraform)
variable "domain" {
  description = "The primary domain name"
}

variable "project_id" {
  description = "The Google Cloud project ID"
}

# Provider configuration (ensure you have the Google Cloud provider configured)
provider "google" {
  project = var.project_id # Assuming you'll pass the project ID as a variable
}

# Local variables for derived names (to keep the code clean)
locals {
  tld_zone_name = replace(var.domain, ".", "-")
}

# Create the primary DNS zone
resource "google_dns_managed_zone" "primary" {
  name        = local.tld_zone_name
  dns_name    = "${var.domain}."
  description = "Primary DNS zone for ${var.domain}"
}

# Create subdomain DNS zones
resource "google_dns_managed_zone" "bfe" {
  name        = "bfe-${local.tld_zone_name}"
  dns_name    = "bfe.${var.domain}."
  description = "Subdomain DNS zone for bfe.${var.domain}"
}

resource "google_dns_managed_zone" "sfe" {
  name        = "sfe-${local.tld_zone_name}"
  dns_name    = "sfe.${var.domain}."
  description = "Subdomain DNS zone for sfe.${var.domain}"
}

# Data sources to fetch NS records (Terraform equivalent of the 'grep' and 'awk' in the Bash script)
data "google_dns_record_set" "bfe_ns" {
  managed_zone = google_dns_managed_zone.bfe.name
  name         = "bfe.${var.domain}."
  type         = "NS"

  # Depends on the bfe zone creation to ensure it exists
  depends_on = [google_dns_managed_zone.bfe]
}

data "google_dns_record_set" "sfe_ns" {
  managed_zone = google_dns_managed_zone.sfe.name
  name         = "sfe.${var.domain}."
  type         = "NS"

  # Depends on the sfe zone creation to ensure it exists
  depends_on = [google_dns_managed_zone.sfe]
}

# Add NS records to the primary zone
resource "google_dns_record_set" "bfe_ns_primary" {
  managed_zone = google_dns_managed_zone.primary.name
  name         = "bfe.${var.domain}."
  type         = "NS"
  rrdatas      = data.google_dns_record_set.bfe_ns.rrdatas
}

resource "google_dns_record_set" "sfe_ns_primary" {
  managed_zone = google_dns_managed_zone.primary.name
  name         = "sfe.${var.domain}."
  type         = "NS"
  rrdatas      = data.google_dns_record_set.sfe_ns.rrdatas
}

# DNS Authorizations for TLS certificates
resource "google_certificate_manager_dns_authorization" "sfe" {
  name   = "sfe-dns-auth-${local.tld_zone_name}"
  domain = "sfe.${var.domain}"
}

resource "google_certificate_manager_dns_authorization" "bfe" {
  name   = "bfe-dns-auth-${local.tld_zone_name}"
  domain = "bfe.${var.domain}"
}

# Add DNS authorization records to subdomain zones
# (Note: Terraform doesn't have a direct equivalent for 'gcloud dns record-sets transaction',
#  so we're creating the records directly)
resource "google_dns_record_set" "sfe_acme_challenge" {
  managed_zone = google_dns_managed_zone.sfe.name
  name         = "_acme-challenge.sfe.${var.domain}."
  type         = "CNAME"
  rrdatas      = [google_certificate_manager_dns_authorization.sfe.dns_resource_record.0.data]

  # Depends on the DNS authorization to ensure it's created first
  depends_on = [google_certificate_manager_dns_authorization.sfe]
}

resource "google_dns_record_set" "bfe_acme_challenge" {
  managed_zone = google_dns_managed_zone.bfe.name
  name         = "_acme-challenge.bfe.${var.domain}."
  type         = "CNAME"
  rrdatas      = [google_certificate_manager_dns_authorization.bfe.dns_resource_record.0.data]

  # Depends on the DNS authorization to ensure it's created first
  depends_on = [google_certificate_manager_dns_authorization.bfe]
}

# Create the wildcard TLS certificate
resource "google_certificate_manager_certificate" "wildcard" {
  name = "wildcard-${local.tld_zone_name}-cert"
  managed {
    domains = [
      "*.sfe.${var.domain}",
      "sfe.${var.domain}",
      "*.bfe.${var.domain}",
      "bfe.${var.domain}"
    ]

    dns_authorizations = [
      google_certificate_manager_dns_authorization.sfe.id,
      google_certificate_manager_dns_authorization.bfe.id
    ]
  }
}

# Create the certificate map
resource "google_certificate_manager_certificate_map" "wildcard" {
  name = "${google_certificate_manager_certificate.wildcard.name}-map"
}

# Create certificate map entries
resource "google_certificate_manager_certificate_map_entry" "sfe" {
  name         = "${google_certificate_manager_certificate.wildcard.name}-map-entry-sfe"
  map          = google_certificate_manager_certificate_map.wildcard.name
  certificates = [google_certificate_manager_certificate.wildcard.id]
  hostname     = "*.sfe.${var.domain}"
}

resource "google_certificate_manager_certificate_map_entry" "bfe" {
  name         = "${google_certificate_manager_certificate.wildcard.name}-map-entry-bfe"
  map          = google_certificate_manager_certificate_map.wildcard.name
  certificates = [google_certificate_manager_certificate.wildcard.id]
  hostname     = "*.bfe.${var.domain}"
}

output "frontend_certificate_map_id" {
  value = google_certificate_manager_certificate_map.wildcard.id
}

output "domain" {
  value = var.domain
}

output "bfe_dns_zone" {
  value = google_dns_managed_zone.bfe.name
}

output "sfe_dns_zone" {
  value = google_dns_managed_zone.sfe.name
}


output "zone_url" {
  value = "https://console.cloud.google.com/net-services/dns/zones/${google_dns_managed_zone.primary.name}/details"
}
