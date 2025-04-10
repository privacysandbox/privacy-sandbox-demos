/**
 * Copyright 2023 Google LLC
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

variable "vpc_id" {
  description = "VPC ID that will host the instance group."
  type        = string
}

variable "subnets" {
  description = "All subnets to deploy to. Each subnet's region is used to configure a regional instance manager."
  type        = any
}

variable "service_account_email" {
  description = "Email of the service account that be used by all instances"
  type        = string
}

variable "backend_tee_image" {
  description = "A URL to a docker image containing a backend service that will run inside a GCE Confidential Space"
  type        = string
}

variable "backend_service_name" {
  description = "Name of the backend service. One of: auction, bidding"
  type        = string

  validation {
    condition     = contains(["bidding", "auction"], var.backend_service_name)
    error_message = "Use a valid backend service name."
  }
}
variable "backend_service_port" {
  description = "The grpc port that receives traffic destined for the backend service."
  type        = number
}

variable "frontend_tee_image" {
  description = "A URL to a docker image containing a frontend service that will run inside a GCE Confidential Space"
  type        = string
}

variable "frontend_service_name" {
  description = "Name of the frontend service. One of: sfe, bfe"
  type        = string

  validation {
    condition     = contains(["sfe", "bfe"], var.frontend_service_name)
    error_message = "Use a valid frontend service name."
  }
}

variable "frontend_service_port" {
  description = "The grpc port that receives traffic destined for the frontend service."
  type        = number
}

variable "frontend_service_healthcheck_port" {
  description = "The Non-TLS grpc port that receives healthcheck traffic."
  type        = number
}

variable "collector_service_name" {
  description = "Name of the collector service."
  type        = string
}

variable "collector_service_port" {
  description = "The grpc port that receives traffic destined for the OpenTelemetry collector."
  type        = number
}

variable "mesh_name" {
  description = "Traffic Director name"
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

variable "tee_impersonate_service_accounts" {
  description = "Comma separated list of service accounts (by email) the TEE should impersonate."
  type        = string
  default     = ""
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

variable "runtime_flags" {
  description = "List of config variables applied at runtime whose changes still require replacing VM instances"
  type        = map(string)
}

variable "instance_template_waits_for_instances" {
  description = "True if terraform should wait for instances before returning from instance template application. False if faster apply is desired."
  type        = bool
  default     = true
}

variable "otel_collector_image_uri" {
  description = "URI to the otel collector image. Defaults to docker hub."
  type        = string
  default     = "otel/opentelemetry-collector-contrib:0.81.0"
}

variable "collector_startup_script" {
  description = "Script to configure and start the otel collector."
  type        = string
}

variable "enable_tee_container_log_redirect" {
  description = "If true, redirect the TEE container logs to the VM's serial port."
  type        = bool
  default     = true
}
