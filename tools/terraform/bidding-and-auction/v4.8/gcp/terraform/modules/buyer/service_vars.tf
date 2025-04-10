/**
 * Copyright 2022 Google LLC
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

# Variables related to environment configuration.
variable "environment" {
  description = "Assigned environment name to group related resources."
  type        = string
  validation {
    condition     = length(var.environment) <= 10
    error_message = "Due to current naming scheme limitations, environment must not be longer than 10."
  }
}

variable "operator" {
  description = "Operator name used to identify the resource owner."
  type        = string
}

variable "region_config" {
  description = "Map of region configs. Each key should be a region name. The value is the autoscaling configuration for the region."
  type = map(object({
    collector = object({
      machine_type          = string
      min_replicas          = number
      max_replicas          = number
      zones                 = list(string) # Use null to signify 'all zones'.
      max_rate_per_instance = number       # Use null to signify no max.
    })
    backend = object({
      machine_type          = string
      min_replicas          = number
      max_replicas          = number
      zones                 = list(string) # Use null to signify 'all zones'.
      max_rate_per_instance = number       # Use null to signify no max.
    })
    frontend = object({
      machine_type          = string
      min_replicas          = number
      max_replicas          = number
      zones                 = list(string) # Use null to signify 'all zones'.
      max_rate_per_instance = number       # Use null to signify no max.
    })
  }))
}

variable "gcp_project_id" {
  description = "GCP project id."
  type        = string
}

variable "service_account_email" {
  description = "Service account email address"
  type        = string
}

variable "bidding_image" {
  description = "URL to bidding service TEE Docker image"
  type        = string
}

variable "buyer_frontend_image" {
  description = "URL to bfe service TEE Docker image"
  type        = string
}

variable "frontend_domain_name" {
  description = "Google Cloud Domain name for global external LB"
  type        = string
}

variable "frontend_dns_zone" {
  description = "Google Cloud DNS zone name for the frontend domain"
  type        = string
}

variable "vm_startup_delay_seconds" {
  description = "The time it takes to get a service up and responding to heartbeats (in seconds)."
  type        = number
}

variable "cpu_utilization_percent" {
  description = "CPU utilization percentage across an instance group required for autoscaler to add instances."
  type        = number
}

variable "use_confidential_space_debug_image" {
  description = "If true, use the Confidential space debug image. Else use the prod image, which does not allow SSH. The images containing the service logic will run on top of this image and have their own prod and debug builds."
  type        = bool
  default     = false
}

variable "runtime_flags" {
  type        = map(string)
  description = "Buyer runtime flags. Must exactly match flags specified in <project root>/services/(bidding_service|buyer_frontend_service)/runtime_flags.h"
}

variable "tee_impersonate_service_accounts" {
  description = "Comma separated list of service accounts (by email) the TEE should impersonate."
  type        = string
  default     = ""
}

variable "collector_service_port" {
  description = "The grpc port that receives traffic destined for the OpenTelemetry collector."
  type        = number
}

variable "instance_template_waits_for_instances" {
  description = "True if terraform should wait for instances before returning from instance template application. False if faster apply is desired."
  type        = bool
  default     = true
}

variable "collector_startup_script" {
  description = "Script to configure and start the otel collector."
  type        = string
}

variable "fast_nat" {
  description = "If true, use extra nat options."
  type        = bool
  default     = false
}

variable "enable_tee_container_log_redirect" {
  description = "If true, redirect the TEE container logs to the VM's serial port."
  type        = bool
  default     = true
}
