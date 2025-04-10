/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

variable "operator" {
  description = "Operator name used to identify the resource owner."
  type        = string
}

variable "environment" {
  description = "Assigned environment name to group related resources."
  type        = string
}

variable "frontend_domain_name" {
  description = "Domain name for global external LB"
  type        = string
}

variable "frontend_dns_zone" {
  description = "DNS zone for the frontend domain"
  type        = string
}

variable "frontend_ip_address" {
  description = "Frontend ip address"
  type        = string
}
variable "frontend_domain_ssl_certificate_id" {
  description = "A GCP ssl certificate id. Example: projects/test-project/global/sslCertificates/dev. Used to terminate client-to-external-LB connections. Unused if frontend_certificate_map_id is specified."
  type        = string
  default     = ""
}

variable "frontend_certificate_map_id" {
  description = "A certificate manager certificate map resource id. Example: projects/test-project/locations/global/certificateMaps/wildcard-cert-map. Takes precedence over frontend_domain_ssl_certificate_id."
  type        = string
  default     = ""
}

variable "frontend_service_name" {
  type = string
}


variable "google_compute_backend_service_ids" {
  description = "a map with environment as key, the value is google_compute_backend_service_id"
  type        = map(string)
}

variable "traffic_weights" {
  description = "a map with environment as key, the value is traffic_weight between 0~1000"
  type        = map(number)
}

variable "experiment_match_rules" {
  description = "a map with environment as key, the value is a list header match_rules, which has OR semantics: the request matches when any of the header match_rules are satisfied. Only one of exactMatch, prefixMatch, or presentMatch must be specified. see more: https://cloud.google.com/compute/docs/reference/rest/v1/urlMaps"
  type = map(list(object({
    header_name   = string
    exact_match   = string
    prefix_match  = string
    present_match = bool
  })))
  default = {}
}
