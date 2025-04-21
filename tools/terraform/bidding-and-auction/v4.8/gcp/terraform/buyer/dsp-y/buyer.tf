# Copyright 2023 Google LLC
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

locals {
  gcp_project_id = "" # Example: "your-gcp-project-123"
  environment    = "" # Must be <= 3 characters. Example: "abc"
  image_repo     = "" # Example: "us-docker.pkg.dev/your-gcp-project-123/services"
  buyer_operator = "" # Example: "buyer-1"
  default_region_config = {
    # Example config provided for us-central1 and you may add your own regions.
    "us-central1" = {
      collector = {
        machine_type          = "e2-micro"
        min_replicas          = 1
        max_replicas          = 1
        zones                 = null # Null signifies no zone preference.
        max_rate_per_instance = null # Null signifies no max.
      }
      backend = {
        machine_type          = "n2d-standard-64"
        min_replicas          = 1
        max_replicas          = 5
        zones                 = null # Null signifies no zone preference.
        max_rate_per_instance = null # Null signifies no max.
      }
      frontend = {
        machine_type          = "n2d-standard-64"
        min_replicas          = 1
        max_replicas          = 2
        zones                 = null # Null signifies no zone preference.
        max_rate_per_instance = null # Null signifies no max.
      }
    }
  }

  # Please create a Google Cloud domain name, dns zone, and SSL certificate.
  # See demo/project_setup_utils/domain_setup/README.md for more details.
  # If you specify a certificate_map_id, you do not need to specify an ssl_certificate_id.
  frontend_domain_ssl_certificate_id = "" # Example: "projects/${local.gcp_project_id}/global/sslCertificates/bfe-${local.environment}"
  frontend_certificate_map_id        = "" # Example: "//certificatemanager.googleapis.com/projects/test/locations/global/certificateMaps/wildcard-cert-map"
  buyer_domain_name                  = "" # Example: bfe-gcp.com
  frontend_dns_zone                  = "" # Example: "bfe-gcp-com"

  buyer_traffic_splits = {
    # default
    "${local.environment}" = {
      image_tag             = ""   # Image built and uploaded by production/packaging/build_and_test_all_in_docker
      traffic_weight        = 1000 # traffic_weight for this arm, between 0~1000. default's weight must > 0.
      region_config         = local.default_region_config
      runtime_flag_override = {}
    }

    # optional: experiment arm 1
    "${local.environment}-1" = {
      image_tag      = ""                          # Image built and uploaded by production/packaging/build_and_test_all_in_docker
      traffic_weight = 0                           # traffic_weight for this arm, between 0~1000. Arm with 0 weight will be skipped.
      region_config  = local.default_region_config # region config can be different for each arm
      runtime_flag_override = {
        # Example: MAX_ALLOWED_SIZE_ALL_DEBUG_URLS_KB = "12345"
      }
    }

    # optional: more experiment arm
    # "${local.environment}-2" = ...
  }

  # Divert request to different bfe and bidding servers by http headers at frontend load balancer.
  # seller needs to set HEADER_PASSED_TO_BUYER for the headers.
  buyer_header_experiment = {
    # optional: header experiment arm 1
    "${local.environment}-h1" = {
      image_tag     = ""                          # Image built and uploaded by production/packaging/build_and_test_all_in_docker
      region_config = local.default_region_config # region config can be different for each arm
      runtime_flag_override = {
        # Example: MAX_ALLOWED_SIZE_ALL_DEBUG_URLS_KB = "12345"
      }
      match_rules = [
        # The request matches when any of match_rules are satisfied. Arm with empty match_rules will be skipped.
        # { # Only one of exactMatch, prefixMatch, or presentMatch must be specified.
        #   header_name   = "exp-id123"
        #   exact_match   = ""
        #   prefix_match  = ""
        #   present_match = true
        # },
      ]
    }

    # optional: more header experiment arm
    # "${local.environment}-h2" = ...
  }

}

provider "google" {
  project = local.gcp_project_id
}

provider "google-beta" {
  project = local.gcp_project_id
}

resource "google_compute_project_metadata" "default" {
  project = local.gcp_project_id
  metadata = {
    enable-oslogin = "FALSE"
  }
}

# See README.md for instructions on how to use the secrets module.
module "secrets" {
  source = "../../modules/secrets"
}

module "buyer" {
  for_each = merge(
    { for key, value in local.buyer_traffic_splits :
    key => value if value.traffic_weight > 0 },
    { for key, value in local.buyer_header_experiment :
    key => value if length(value.match_rules) > 0 }
  )

  source               = "../../modules/buyer"
  environment          = each.key
  gcp_project_id       = local.gcp_project_id
  bidding_image        = "${local.image_repo}/bidding_service:${each.value.image_tag}"
  buyer_frontend_image = "${local.image_repo}/buyer_frontend_service:${each.value.image_tag}"
  fakekv_service_port  = 1900 # Ignore this.

  runtime_flags = merge({
    BIDDING_PORT                      = "50051"          # Do not change unless you are modifying the default GCP architecture.
    BUYER_FRONTEND_PORT               = "50051"          # Do not change unless you are modifying the default GCP architecture.
    BUYER_FRONTEND_HEALTHCHECK_PORT   = "50050"          # Do not change unless you are modifying the default GCP architecture.
    BIDDING_SERVER_ADDR               = "xds:///bidding" # Do not change unless you are modifying the default GCP architecture.
    BFE_INGRESS_TLS                   = "true"           # Do not change unless you are modifying the default GCP architecture.
    BIDDING_EGRESS_TLS                = "false"          # Do not change unless you are modifying the default GCP architecture.
    AD_RETRIEVAL_KV_SERVER_EGRESS_TLS = "false"          # Do not change unless you are modifying the default GCP architecture.
    KV_SERVER_EGRESS_TLS              = "false"          # Do not change unless you are modifying the default GCP architecture.
    TEST_MODE                         = "false"          # Do not change unless you are testing without key fetching.

    ENABLE_BIDDING_SERVICE_BENCHMARK = "" # Example: "false"

    # Refers to BYOS Buyer Key-Value Server only.
    BUYER_KV_SERVER_ADDR = "" # Example: "https://kvserver.com/trusted-signals"

    # [BEGIN] Trusted KV real time signal fetching params (Protected Audience Only)
    ENABLE_TKV_V2_BROWSER    = ""            # Example: "false"
    TKV_EGRESS_TLS           = ""            # Example: "false"
    BUYER_TKV_V2_SERVER_ADDR = "PLACEHOLDER" # Example: "dns:///kvserver:443"
    # [END] Trusted KV real time signal fetching params (Protected Audience Only)

    # [BEGIN] Protected App Signals (PAS) related services.
    TEE_AD_RETRIEVAL_KV_SERVER_ADDR = "" # Example: "xds:///ad-retrieval-host", Address of the TEE ad retrieval service (Used in non-contextual PAS flow)
    TEE_KV_SERVER_ADDR              = "" # Example: "xds:///kv-service-host", Address of the TEE KV server address (Used in contextual PAS flow)
    AD_RETRIEVAL_TIMEOUT_MS         = "" # Example: "60000"
    # [END] Protected App Signals (PAS) related services.

    GENERATE_BID_TIMEOUT_MS            = "" # Example: "60000"
    BIDDING_SIGNALS_LOAD_TIMEOUT_MS    = "" # Example: "60000"
    ENABLE_BUYER_FRONTEND_BENCHMARKING = "" # Example: "false"
    CREATE_NEW_EVENT_ENGINE            = "" # Example: "false"
    ENABLE_BIDDING_COMPRESSION         = "" # Example: "true"
    ENABLE_PROTECTED_AUDIENCE          = "" # Example: "true"
    PS_VERBOSITY                       = "" # Example: "10"
    # [BEGIN] PAS related params
    ENABLE_PROTECTED_APP_SIGNALS                  = "" # Example: "false"
    PROTECTED_APP_SIGNALS_GENERATE_BID_TIMEOUT_MS = "" # Example: "60000"
    EGRESS_SCHEMA_FETCH_CONFIG                    = "" # Example:
    # "{
    #   "fetchMode": 0,
    #   "egressSchemaUrl": "https://example.com/egressSchema.json",
    #   "urlFetchPeriodMs": 130000,
    #   "urlFetchTimeoutMs": 30000
    # }"
    # [END] PAS related params
    BUYER_CODE_FETCH_CONFIG = "" # See README for flag descriptions
    # Example for V8:
    # "{
    #    "fetchMode": 0,
    #    "biddingJsPath": "",
    #    "biddingJsUrl": "https://example.com/generateBid.js",
    #    "protectedAppSignalsBiddingJsUrl": "https://example.com/generateBid.js",
    #    "biddingWasmHelperUrl": "",
    #    "protectedAppSignalsBiddingWasmHelperUrl": "",
    #    "urlFetchPeriodMs": 13000000,
    #    "urlFetchTimeoutMs": 30000,
    #    "enableBuyerDebugUrlGeneration": true,
    #    "prepareDataForAdsRetrievalJsUrl": "",
    #    "prepareDataForAdsRetrievalWasmHelperUrl": "",
    #    "enablePrivateAggregateReporting": false,
    #  }"
    # Example for BYOB:
    # "{
    #    "fetchMode": 0,
    #    "biddingExecutablePath": "",
    #    "biddingExecutableUrl": "https://example.com/generateBid",
    #    "urlFetchPeriodMs": 13000000,
    #    "urlFetchTimeoutMs": 30000,
    #    "enableBuyerDebugUrlGeneration": true,
    #    "enablePrivateAggregateReporting": false,
    #  }"
    UDF_NUM_WORKERS           = "" # Example: "64" Must be <=vCPUs in bidding_machine_type.
    JS_WORKER_QUEUE_LEN       = "" # Example: "200".
    ROMA_TIMEOUT_MS           = "" # Example: "10000"
    TELEMETRY_CONFIG          = "" # Example: "mode: EXPERIMENT"
    COLLECTOR_ENDPOINT        = "" # Example: "collector-buyer-1-${each.key}.bfe-gcp.com:4317"
    ENABLE_OTEL_BASED_LOGGING = "" # Example: "false"
    CONSENTED_DEBUG_TOKEN     = "" # Example: "<unique_id>". Consented debugging requests increase server load in production. A high QPS of these requests can lead to unhealthy servers.
    DEBUG_SAMPLE_RATE_MICRO   = "0"

    # Coordinator-based attestation flags.
    # These flags are production-ready and you do not need to change them.
    # Reach out to the Privacy Sandbox B&A team to enroll with Coordinators.
    # More information on enrollment can be found here: https://github.com/privacysandbox/fledge-docs/blob/main/bidding_auction_services_api.md#enroll-with-coordinators
    PUBLIC_KEY_ENDPOINT                           = "https://publickeyservice.pa.gcp.privacysandboxservices.com/.well-known/protected-auction/v1/public-keys"
    PRIMARY_COORDINATOR_PRIVATE_KEY_ENDPOINT      = "https://privatekeyservice-a.pa-3.gcp.privacysandboxservices.com/v1alpha/encryptionKeys"
    SECONDARY_COORDINATOR_PRIVATE_KEY_ENDPOINT    = "https://privatekeyservice-b.pa-4.gcp.privacysandboxservices.com/v1alpha/encryptionKeys"
    PRIMARY_COORDINATOR_ACCOUNT_IDENTITY          = "a-opverifiedusr@ps-pa-coord-prd-g3p-wif.iam.gserviceaccount.com"
    SECONDARY_COORDINATOR_ACCOUNT_IDENTITY        = "b-opverifiedusr@ps-prod-pa-type2-fe82.iam.gserviceaccount.com"
    PRIMARY_COORDINATOR_REGION                    = "us-central1"
    SECONDARY_COORDINATOR_REGION                  = "us-central1"
    GCP_PRIMARY_WORKLOAD_IDENTITY_POOL_PROVIDER   = "projects/732552956908/locations/global/workloadIdentityPools/a-opwip/providers/a-opwip-pvdr"
    GCP_SECONDARY_WORKLOAD_IDENTITY_POOL_PROVIDER = "projects/99438709206/locations/global/workloadIdentityPools/b-opwip/providers/b-opwip-pvdr"
    GCP_PRIMARY_KEY_SERVICE_CLOUD_FUNCTION_URL    = "https://a-us-central1-encryption-key-service-cloudfunctio-j27wiaaz5q-uc.a.run.app"
    GCP_SECONDARY_KEY_SERVICE_CLOUD_FUNCTION_URL  = "https://b-us-central1-encryption-key-service-cloudfunctio-wdqaqbifva-uc.a.run.app"
    PRIVATE_KEY_CACHE_TTL_SECONDS                 = "3974400"
    KEY_REFRESH_FLOW_RUN_FREQUENCY_SECONDS        = "20000"

    BFE_TLS_KEY                        = module.secrets.tls_key  # You may remove the secrets module and instead either inline or use an auto.tfvars for this variable.
    BFE_TLS_CERT                       = module.secrets.tls_cert # You may remove the secrets module and instead either inline or use an auto.tfvars for this variable.
    MAX_ALLOWED_SIZE_DEBUG_URL_BYTES   = ""                      # Example: "65536"
    MAX_ALLOWED_SIZE_ALL_DEBUG_URLS_KB = ""                      # Example: "3000"

    INFERENCE_SIDECAR_BINARY_PATH    = "" # Example: "/server/bin/inference_sidecar_<module_name>"
    INFERENCE_MODEL_BUCKET_NAME      = "" # Example: "<bucket_name>"
    INFERENCE_MODEL_CONFIG_PATH      = "" # Example: "model_config.json"
    INFERENCE_MODEL_FETCH_PERIOD_MS  = "" # Example: "300000"
    INFERENCE_SIDECAR_RUNTIME_CONFIG = "" # Example:
    # "{
    #    "num_interop_threads": 4,
    #    "num_intraop_threads": 4,
    #    "module_name": "tensorflow_v2_14_0",
    #    "cpuset": [0, 1, 2, 3],
    #    "tcmalloc_release_bytes_per_sec": 0,
    #    "tcmalloc_max_total_thread_cache_bytes": 0,
    #    "tcmalloc_max_per_cpu_cache_bytes": 0,
    # }"

    # TCMalloc related config parameters.
    # See: https://github.com/google/tcmalloc/blob/master/docs/tuning.md
    BIDDING_TCMALLOC_BACKGROUND_RELEASE_RATE_BYTES_PER_SECOND = "4096"        # Example: 4096
    BIDDING_TCMALLOC_MAX_TOTAL_THREAD_CACHE_BYTES             = "10737418240" # Example: 10737418240
    BFE_TCMALLOC_BACKGROUND_RELEASE_RATE_BYTES_PER_SECOND     = "4096"
    BFE_TCMALLOC_MAX_TOTAL_THREAD_CACHE_BYTES                 = "10737418240"
    # Possible values:
    # NOT_FETCHED: No call to KV server is made. All interest groups are sent to generateBid().
    # FETCHED_BUT_OPTIONAL: Call to KV server is made and must not fail. All interest groups are sent to generateBid() irrespective of whether they have bidding signals or not.
    # Any other value/REQUIRED (default): Call to KV server is made and must not fail. Only those interest groups are sent to generateBid() that have at least one bidding signals key for which non-empty bidding signals are fetched.
    BIDDING_SIGNALS_FETCH_MODE = "REQUIRED"
  }, each.value.runtime_flag_override)

  frontend_domain_name               = local.buyer_domain_name
  frontend_dns_zone                  = local.frontend_dns_zone
  operator                           = local.buyer_operator
  service_account_email              = ""    # Example: "terraform-sa@{local.gcp_project_id}.iam.gserviceaccount.com"
  vm_startup_delay_seconds           = 200   # Example: 200
  cpu_utilization_percent            = 0.6   # Example: 0.6
  use_confidential_space_debug_image = false # Example: false
  tee_impersonate_service_accounts   = "a-opallowedusr@ps-pa-coord-prd-g3p-svcacc.iam.gserviceaccount.com,b-opallowedusr@ps-prod-pa-type2-fe82.iam.gserviceaccount.com"
  collector_service_port             = 4317
  collector_startup_script = templatefile("../../../services/autoscaling/collector_startup.tftpl", {
    collector_port           = 4317
    otel_collector_image_uri = "otel/opentelemetry-collector-contrib:0.105.0"
    gcs_hmac_key             = module.secrets.gcs_hmac_key
    gcs_hmac_secret          = module.secrets.gcs_hmac_secret
    gcs_bucket               = "" # Example: ${name of a gcs bucket}
    gcs_bucket_prefix        = "" # Example: "consented-eventmessage-${each.key}"
    file_prefix              = "" # Example: local.buyer_operator
  })
  region_config                     = each.value.region_config
  enable_tee_container_log_redirect = false
}

module "buyer_frontend_load_balancing" {
  source               = "../../services/frontend_load_balancing"
  environment          = local.environment
  operator             = local.buyer_operator
  frontend_ip_address  = module.buyer[local.environment].frontend_address
  frontend_domain_name = local.buyer_domain_name
  frontend_dns_zone    = local.frontend_dns_zone

  frontend_domain_ssl_certificate_id = local.frontend_domain_ssl_certificate_id
  frontend_certificate_map_id        = local.frontend_certificate_map_id
  frontend_service_name              = "bfe"
  google_compute_backend_service_ids = {
    for buyer_key, buyer in module.buyer :
    buyer_key => buyer.google_compute_backend_service_id
  }
  traffic_weights        = { for key, value in local.buyer_traffic_splits : key => value.traffic_weight if value.traffic_weight > 0 }
  experiment_match_rules = { for key, value in local.buyer_header_experiment : key => value.match_rules if length(value.match_rules) > 0 }
}

module "buyer_dashboard" {
  source = "../../services/dashboards/buyer_dashboard"
  environment = join("|", concat(
    [for k, v in local.buyer_traffic_splits : k if v.traffic_weight > 0],
  [for k, v in local.buyer_header_experiment : k if length(v.match_rules) > 0]))
}

module "inference_dashboard" {
  source = "../../services/dashboards/inference_dashboard"
  environment = join("|", concat(
    [for k, v in local.buyer_traffic_splits : k if v.traffic_weight > 0],
  [for k, v in local.buyer_header_experiment : k if length(v.match_rules) > 0]))
}

module "k_anon_dashboard" {
  source = "../../services/dashboards/k_anon_dashboard"
  environment = join("|", concat(
    [for k, v in local.buyer_traffic_splits : k if v.traffic_weight > 0],
  [for k, v in local.buyer_header_experiment : k if length(v.match_rules) > 0]))
}

# use below to perform an in-place upgrade from pre 4.2 to 4.2 and after, replace $ENV with $local.environment value
# moved {
#   from = module.buyer
#   to   = module.buyer["$ENV"]
# }
# moved {
#   from = module.buyer["$ENV"].module.load_balancing.google_compute_url_map.default
#   to   = module.buyer_frontend_load_balancing.google_compute_url_map.default
# }
# moved {
#   from = module.buyer["$ENV"].module.load_balancing.google_compute_target_https_proxy.default
#   to   = module.buyer_frontend_load_balancing.google_compute_target_https_proxy.default
# }
# moved {
#   from = module.buyer["$ENV"].module.load_balancing.google_compute_global_forwarding_rule.xlb_https
#   to   = module.buyer_frontend_load_balancing.google_compute_global_forwarding_rule.xlb_https
# }
# moved {
#   from = module.buyer["$ENV"].module.load_balancing.google_dns_record_set.default
#   to   = module.buyer_frontend_load_balancing.google_dns_record_set.default
# }
# moved {
#   from = module.buyer["$ENV"].module.buyer_dashboard
#   to   = module.buyer_dashboard
# }
# moved {
#   from = module.buyer["$ENV"].module.inference_dashboard
#   to   = module.inference_dashboard
# }
