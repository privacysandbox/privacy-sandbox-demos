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

resource "google_compute_network" "default" {
  name                    = "${var.operator}-${var.environment}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "backends" {
  for_each = { for index, region in tolist(var.regions) : index => region }

  name          = "${var.operator}-${var.environment}-${each.value}-backend-subnet"
  network       = google_compute_network.default.id
  purpose       = "PRIVATE"
  region        = each.value
  ip_cidr_range = "10.${each.key}.2.0/24"
}

resource "google_compute_subnetwork" "proxy_subnets" {
  for_each = { for index, region in tolist(var.regions) : index => region }

  ip_cidr_range = "10.${129 + each.key}.0.0/23"
  name          = "${var.operator}-${var.environment}-${each.value}-collector-proxy-subnet"
  network       = google_compute_network.default.id
  purpose       = "GLOBAL_MANAGED_PROXY"
  region        = each.value
  role          = "ACTIVE"
  lifecycle {
    ignore_changes = [ipv6_access_type]
  }
}

# Frontend address, used for frontend service LB only
resource "google_compute_global_address" "frontend" {
  name       = "${var.operator}-${var.environment}-${var.frontend_service}-lb"
  ip_version = "IPV4"
}

resource "google_network_services_mesh" "default" {
  provider = google-beta
  name     = "${var.operator}-${var.environment}-mesh"
}


resource "google_compute_router" "routers" {
  for_each = var.regions

  name    = "${var.operator}-${var.environment}-${each.value}-router"
  network = google_compute_network.default.name
  region  = each.value
}

resource "google_compute_router_nat" "nat" {
  for_each = google_compute_router.routers

  name                                = "${var.operator}-${var.environment}-${each.value.region}-nat"
  router                              = each.value.name
  region                              = each.value.region
  nat_ip_allocate_option              = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat  = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  enable_dynamic_port_allocation      = var.fast_nat ? true : null
  enable_endpoint_independent_mapping = var.fast_nat ? false : null
  min_ports_per_vm                    = var.fast_nat ? 4096 : null
  max_ports_per_vm                    = var.fast_nat ? 8192 : null
  tcp_established_idle_timeout_sec    = var.fast_nat ? 10 : null
  tcp_time_wait_timeout_sec           = var.fast_nat ? 5 : null
  tcp_transitory_idle_timeout_sec     = var.fast_nat ? 3 : null

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
