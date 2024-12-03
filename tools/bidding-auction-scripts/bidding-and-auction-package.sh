#!/bin/bash

# URL of the script on GitHub
repo_url="https://github.com/privacysandbox/bidding-auction-servers.git" 

# Checkout the latest release of B&A
git checkout -b release-4.4

build_script="production/packaging/build_and_test_all_in_docker"

# Clone a local copy of the repository and change directories into the copy
git clone "$repo_url" 
cd "bidding-auction-servers"

# Change access permissions to allow for executing the script
chmod +x "$build_script"

# Package and Build the Bidding Service, Buyer Front End, Seller Front End, and Auction Service
./$build_script --service-path bidding_service   --service-path auction_service   --service-path buyer_frontend_service   --service-path seller_frontend_service   --platform gcp   --instance local   --no-precommit   --no-tests   --build-flavor non_prod   --gcp-skip-image-upload

export SKIP_TLS_VERIFICATION=true



# Start the Buyer Front End Service
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.103 --network=sandcastle-network" \
BUYER_KV_SERVER_ADDR="http://privacy-sandbox-demos-dsp-x.dev:8080/uc-ba/service/kv" \
./tools/debug/start_bfe

# Start the Auction Service 
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.102 --network=sandcastle-network" \
AUCTION_JS_URL="http://privacy-sandbox-demos-ssp-x.dev:8080/uc-ba/js/decision-logic.js" \
./tools/debug/start_auction

# Start the Seller Front End Service 
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.104 --network=sandcastle-network" \
SELLER_ORIGIN_DOMAIN="https://privacy-sandbox-demos-ssp-x.dev" \
KEY_VALUE_SIGNALS_HOST="http://privacy-sandbox-demos-ssp-x.dev:8080/uc-ba/service/kv" \
BUYER_SERVER_ADDRS_JSON='{"https://privacy-sandbox-demos-dsp-x.dev":{"url":"172.18.0.103:50051","cloudPlatform":"LOCAL"}}' \
./tools/debug/start_sfe

# Exit the local copy of the repository
cd .. 

# Remove local copy of the repository
rm -rf "bidding-auction-servers"


