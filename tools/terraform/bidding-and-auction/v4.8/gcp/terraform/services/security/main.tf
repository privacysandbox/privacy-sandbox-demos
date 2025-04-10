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


# allow all access from IAP and health check ranges
resource "google_compute_firewall" "fw_allow_hc" {
  name          = "${var.operator}-${var.environment}-fw-allow-hc"
  provider      = google
  direction     = "INGRESS"
  network       = var.network_id
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16", "35.235.240.0/20"]
  allow {
    protocol = "tcp"
  }
  target_tags = ["allow-hc"]
}


resource "google_compute_firewall" "fw_allow_ssh" {
  name      = "${var.operator}-${var.environment}-fw-allow-ssh"
  direction = "INGRESS"
  network   = var.network_id
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  target_tags   = ["allow-ssh"]
  source_ranges = ["0.0.0.0/0"]
}


resource "google_compute_firewall" "fw_allow_all_egress" {
  name      = "${var.operator}-${var.environment}-fw-allow-all-egress"
  direction = "EGRESS"
  network   = var.network_id
  allow {
    protocol = "tcp"
  }
  target_tags = ["allow-all-egress"]
}

resource "google_compute_firewall" "fw_allow_backend_ingress" {
  name      = "${var.operator}-${var.environment}-fw-allow-backend-ingress"
  direction = "INGRESS"
  network   = var.network_id

  allow {
    protocol = "tcp"
  }
  target_tags   = ["allow-backend-ingress"]
  source_ranges = [for subnet in var.subnets : subnet.ip_cidr_range]
}

resource "google_compute_firewall" "fw_allow_otlp" {
  name      = "${var.operator}-${var.environment}-fw-allow-otlp"
  direction = "INGRESS"
  network   = var.network_id

  allow {
    protocol = "tcp"
    ports    = [var.collector_service_port]
  }
  target_tags   = ["allow-otlp"]
  source_ranges = [for subnet in var.proxy_subnets : subnet.ip_cidr_range]
}
