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

variable "mesh" {
  description = "Traffic Director mesh"
  type        = any
}

variable "subnets" {
  description = "All service subnets."
  type        = any
}

variable "operator" {
  description = "Operator name used to identify the resource owner."
  type        = string
}

variable "environment" {
  description = "Assigned environment name to group related resources."
  type        = string
}

variable "gcp_project_id" {
  description = "GCP project id."
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

variable "frontend_instance_group_managers" {
  description = "Frontend instance group managers."
  type        = set(any)
}

variable "frontend_service_name" {
  type = string
}

variable "frontend_service_healthcheck_port" {
  description = "The Non-TLS grpc port that receives healthcheck traffic."
  type        = number
}

variable "backend_instance_group_managers" {
  description = "Backend instance group managers."
  type        = set(any)
}

variable "backend_address" {
  description = "gRPC-compatible address. Example: xds:///backend"
  type        = string
}

variable "backend_service_name" {
  type = string
}

variable "backend_service_port" {
  description = "The grpc port that receives traffic destined for the backend service."
  type        = number
}

variable "collector_instance_group_managers" {
  description = "OpenTelemetry collector instance group managers."
  type        = set(any)
}

variable "collector_service_name" {
  type = string
}



variable "collector_service_port" {
  description = "The grpc port that receives traffic destined for the OpenTelemetry collector."
  type        = number
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
