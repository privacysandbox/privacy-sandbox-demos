# Start the Buyer Front End Service
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.103 --network=sandcastle-network" \
BUYER_KV_SERVER_ADDR="http://privacy-sandbox-demos-dsp-x.dev:8080/uc-ba/service/kv" \
./tools/debug/start_bfe