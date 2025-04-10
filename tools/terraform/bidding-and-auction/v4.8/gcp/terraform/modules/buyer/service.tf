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

################ Common Setup ################

module "networking" {
  source                 = "../../services/networking"
  frontend_service       = "bfe"
  operator               = var.operator
  environment            = var.environment
  regions                = keys(var.region_config)
  collector_service_name = "collector"
  fast_nat               = var.fast_nat
}

module "security" {
  source                 = "../../services/security"
  network_id             = module.networking.network_id
  subnets                = module.networking.subnets
  proxy_subnets          = module.networking.proxy_subnets
  operator               = var.operator
  environment            = var.environment
  collector_service_port = var.collector_service_port
}

module "autoscaling" {
  source                                = "../../services/autoscaling"
  vpc_id                                = module.networking.network_id
  subnets                               = module.networking.subnets
  mesh_name                             = module.networking.mesh.name
  service_account_email                 = var.service_account_email
  environment                           = var.environment
  operator                              = var.operator
  backend_tee_image                     = var.bidding_image
  backend_service_port                  = tonumber(var.runtime_flags["BIDDING_PORT"])
  backend_service_name                  = "bidding"
  frontend_tee_image                    = var.buyer_frontend_image
  frontend_service_port                 = tonumber(var.runtime_flags["BUYER_FRONTEND_PORT"])
  frontend_service_healthcheck_port     = tonumber(var.runtime_flags["BUYER_FRONTEND_HEALTHCHECK_PORT"])
  frontend_service_name                 = "bfe"
  collector_service_name                = "collector"
  collector_service_port                = var.collector_service_port
  region_config                         = var.region_config
  vm_startup_delay_seconds              = var.vm_startup_delay_seconds
  cpu_utilization_percent               = var.cpu_utilization_percent
  use_confidential_space_debug_image    = var.use_confidential_space_debug_image
  tee_impersonate_service_accounts      = tobool(var.runtime_flags["TEST_MODE"]) ? "" : var.tee_impersonate_service_accounts
  runtime_flags                         = var.runtime_flags
  instance_template_waits_for_instances = var.instance_template_waits_for_instances
  depends_on                            = [module.security, module.networking, resource.google_secret_manager_secret.runtime_flag_secrets, resource.google_secret_manager_secret_version.runtime_flag_secret_values]
  collector_startup_script              = var.collector_startup_script
  enable_tee_container_log_redirect     = var.enable_tee_container_log_redirect
}

module "load_balancing" {
  source                            = "../../services/load_balancing"
  environment                       = var.environment
  operator                          = var.operator
  gcp_project_id                    = var.gcp_project_id
  subnets                           = module.networking.subnets
  mesh                              = module.networking.mesh
  frontend_domain_name              = var.frontend_domain_name
  frontend_dns_zone                 = var.frontend_dns_zone
  frontend_instance_group_managers  = module.autoscaling.frontend_instance_group_managers
  frontend_service_name             = "bfe"
  frontend_service_healthcheck_port = tonumber(var.runtime_flags["BUYER_FRONTEND_HEALTHCHECK_PORT"])
  backend_instance_group_managers   = module.autoscaling.backend_instance_group_managers
  backend_service_name              = "bidding"
  backend_address                   = var.runtime_flags["BIDDING_SERVER_ADDR"]
  backend_service_port              = tonumber(var.runtime_flags["BIDDING_PORT"])
  collector_instance_group_managers = module.autoscaling.collector_instance_group_managers
  collector_service_name            = "collector"
  collector_service_port            = var.collector_service_port
  region_config                     = var.region_config
}

resource "google_secret_manager_secret" "runtime_flag_secrets" {
  for_each = var.runtime_flags

  secret_id = "${var.operator}-${var.environment}-${each.key}"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "runtime_flag_secret_values" {
  for_each = google_secret_manager_secret.runtime_flag_secrets

  secret      = each.value.id
  secret_data = var.runtime_flags[split("${var.operator}-${var.environment}-", each.value.id)[1]]
}
