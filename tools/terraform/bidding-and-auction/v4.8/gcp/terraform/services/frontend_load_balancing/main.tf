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

###############################################################
#
#                         EXTERNAL LB
#
# The external lb uses HTTP/2 (gRPC) with TLS.
###############################################################

resource "google_compute_url_map" "default" {
  name = "${var.operator}-${var.environment}-xlb-grpc-map"
  default_route_action {
    dynamic "weighted_backend_services" {
      for_each = var.traffic_weights
      content {
        backend_service = var.google_compute_backend_service_ids[weighted_backend_services.key]
        weight          = weighted_backend_services.value
      }
    }
  }

  host_rule {
    hosts        = ["*"] # all hosts
    path_matcher = "allpaths"
  }
  path_matcher {
    name = "allpaths"
    default_route_action {
      dynamic "weighted_backend_services" {
        for_each = var.traffic_weights
        content {
          backend_service = var.google_compute_backend_service_ids[weighted_backend_services.key]
          weight          = weighted_backend_services.value
        }
      }
    }
    dynamic "route_rules" {
      for_each = var.experiment_match_rules
      content {
        priority = index(keys(var.experiment_match_rules), route_rules.key) + 1
        service  = var.google_compute_backend_service_ids[route_rules.key]
        dynamic "match_rules" {
          for_each = route_rules.value
          content {
            prefix_match = "/" # all paths
            header_matches {
              header_name   = match_rules.value.header_name
              exact_match   = match_rules.value.exact_match
              prefix_match  = match_rules.value.prefix_match
              present_match = match_rules.value.present_match
            }
          }
        }
      }
    }
  }
}

resource "google_compute_target_https_proxy" "default" {
  name             = "${var.operator}-${var.environment}-https-lb-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = var.frontend_certificate_map_id == "" ? [var.frontend_domain_ssl_certificate_id] : null
  certificate_map  = var.frontend_certificate_map_id == "" ? null : var.frontend_certificate_map_id
}

resource "google_compute_global_forwarding_rule" "xlb_https" {
  name     = "${var.operator}-${var.environment}-xlb-https-forwarding-rule"
  provider = google-beta

  ip_protocol           = "TCP"
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                = google_compute_target_https_proxy.default.id
  ip_address            = var.frontend_ip_address

  labels = {
    environment = var.environment
    operator    = var.operator
    service     = var.frontend_service_name
  }
}

resource "google_dns_record_set" "default" {
  name         = "${var.operator}-${var.environment}.${var.frontend_domain_name}."
  managed_zone = var.frontend_dns_zone
  type         = "A"
  ttl          = 10
  rrdatas = [
    var.frontend_ip_address
  ]
}
