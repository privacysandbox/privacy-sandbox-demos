# Start the Bidding Service
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.101 --network=sandcastle-network" \
BIDDING_JS_URL="http://privacy-sandbox-demos-dsp-x.dev:8080/uc-ba/js/bidding-logic.js" \
./tools/debug/start_bidding