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

###############################################################
#
#              SERVICE MESH (INTERNAL LOAD BALANCER)
#
# The service mesh uses HTTP/2 (gRPC) with no TLS.
###############################################################

resource "google_network_services_grpc_route" "default" {
  provider  = google-beta
  name      = "${var.operator}-${var.environment}-frontend-to-backend"
  hostnames = [split("///", var.backend_address)[1]]
  meshes    = [var.mesh.id]
  rules {
    action {
      destinations {
        service_name = "projects/${var.gcp_project_id}/locations/global/backendServices/${google_compute_backend_service.mesh_backend.name}"
      }
    }
  }
}

resource "google_compute_backend_service" "mesh_backend" {
  name                  = "${var.operator}-${var.environment}-mesh-backend-service"
  provider              = google-beta
  port_name             = "grpc"
  protocol              = "GRPC"
  load_balancing_scheme = "INTERNAL_SELF_MANAGED"
  locality_lb_policy    = "ROUND_ROBIN"
  timeout_sec           = 10
  health_checks         = [google_compute_health_check.backend.id]

  dynamic "backend" {
    for_each = var.backend_instance_group_managers
    content {
      group                 = backend.value.instance_group
      balancing_mode        = "UTILIZATION"
      max_rate_per_instance = var.region_config[backend.value.region].backend.max_rate_per_instance
      max_utilization       = 0.80
      capacity_scaler       = 1.0
    }
  }
}


resource "google_compute_health_check" "backend" {
  name = "${var.operator}-${var.environment}-${var.backend_service_name}-lb-hc"
  grpc_health_check {
    port = var.backend_service_port
  }

  timeout_sec         = 2
  check_interval_sec  = 2
  healthy_threshold   = 1
  unhealthy_threshold = 2

  log_config {
    enable = true
  }
}


###############################################################
#
#                         Collector LB
#
# The internal lb uses HTTP/2 (gRPC) with no TLS.
###############################################################

resource "google_compute_backend_service" "collector" {
  name     = "${var.operator}-${var.environment}-collector-service"
  provider = google-beta

  protocol              = "TCP"
  load_balancing_scheme = "INTERNAL_MANAGED"
  port_name             = "otlp"
  timeout_sec           = 10
  health_checks         = [google_compute_health_check.collector.id]

  dynamic "backend" {
    for_each = var.collector_instance_group_managers
    content {
      group                 = backend.value.instance_group
      balancing_mode        = "UTILIZATION"
      max_rate_per_instance = var.region_config[backend.value.region].collector.max_rate_per_instance
      capacity_scaler       = 1.0
    }
  }
}

resource "google_compute_target_tcp_proxy" "collector" {
  name            = "${var.operator}-${var.environment}-tcp-collector-lb-proxy"
  backend_service = google_compute_backend_service.collector.id
}

resource "google_compute_global_forwarding_rule" "collectors" {
  for_each = var.subnets

  name = "${var.operator}-${var.environment}-${var.collector_service_name}-${each.value.region}-ilb-rule"

  ip_protocol           = "TCP"
  port_range            = var.collector_service_port
  load_balancing_scheme = "INTERNAL_MANAGED"
  target                = google_compute_target_tcp_proxy.collector.id
  subnetwork            = each.value.id
  labels = {
    environment = var.environment
    operator    = var.operator
    service     = var.collector_service_name
    region      = each.value.region
  }
}

resource "google_dns_record_set" "collector" {
  name         = "${var.collector_service_name}-${var.operator}-${var.environment}.${var.frontend_domain_name}."
  managed_zone = var.frontend_dns_zone
  type         = "A"
  ttl          = 10
  routing_policy {
    dynamic "geo" {
      for_each = google_compute_global_forwarding_rule.collectors
      content {
        location = geo.value.labels.region
        rrdatas  = [geo.value.ip_address]
      }
    }
  }
}

resource "google_compute_health_check" "collector" {
  name = "${var.operator}-${var.environment}-${var.collector_service_name}-lb-hc"

  grpc_health_check {
    port = var.collector_service_port
  }

  timeout_sec         = 3
  check_interval_sec  = 3
  healthy_threshold   = 2
  unhealthy_threshold = 4

  log_config {
    enable = true
  }
}

###############################################################
#
#                         EXTERNAL LB
#
# The external lb uses HTTP/2 (gRPC) with TLS.
###############################################################

resource "google_compute_backend_service" "default" {
  name                  = "${var.operator}-${var.environment}-xlb-backend-service"
  provider              = google-beta
  port_name             = "grpc"
  protocol              = "HTTP2"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  locality_lb_policy    = "ROUND_ROBIN"
  timeout_sec           = 10
  health_checks         = [google_compute_health_check.frontend.id]
  dynamic "backend" {
    for_each = var.frontend_instance_group_managers
    content {
      group                 = backend.value.instance_group
      balancing_mode        = "UTILIZATION"
      max_rate_per_instance = var.region_config[backend.value.region].frontend.max_rate_per_instance
      max_utilization       = 0.80
      capacity_scaler       = 1.0
    }
  }
  log_config {
    enable      = true
    sample_rate = 0.1
  }

  depends_on = [var.mesh, google_network_services_grpc_route.default]
}


resource "google_compute_health_check" "frontend" {
  name = "${var.operator}-${var.environment}-${var.frontend_service_name}-lb-hc"
  grpc_health_check {
    port = var.frontend_service_healthcheck_port
  }

  timeout_sec         = 2
  check_interval_sec  = 2
  healthy_threshold   = 1
  unhealthy_threshold = 2

  log_config {
    enable = true
  }
}
