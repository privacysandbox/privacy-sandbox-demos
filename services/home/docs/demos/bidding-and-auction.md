import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# **Bidding & Auction Services for Protected Audience**

\<Tabs\>  
\<TabItem value="overview" label="Overview" default\>

# **Overview**

## **Description**

Bidding & Auction Services aim to provide open source infrastructure for executing Protected Audience auctions server-side. This demo will walk you
through how to set up a deployment of this infrastructure on your machine.

## **Privacy Sandbox APIs**

- [Protected Audience](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience)
- [Bidding & Auction Services](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience/android/bidding-and-auction-services)

## **Related parties**

- SSP
- DSP
- Publisher

\</TabItem\>

\<TabItem value="scope" label="Scope"\>

# **Scope**

## **Goals**

In this demo, we assume SSPs and DSPs would like to improve performance of their Protected Audience auctions. Bidding & Auction services allows
Protected Audience bidding and scoring computation to take place on servers. This demo will provide a local environment where developers can explore
how Bidding & Auction components work before committing to a full production cloud deployment.

## **Assumptions**

This demo assumes that the reader has knowledge of how the Protected Audience API works. This demo will not provide details on the cloud deployment of
B&A at this time but plans to in the future.

## **Key Exclusions**

- Cloud deployment
- Maximum of 2 buyers
- Bidding inference service

## **System Design**

Below outlines the general system design for B&A. Please see the bullets below or the image for a chronological set of steps detailing how the
components of the system work together to complete an auction.

### API Flow

- The user visits a shopping site and gets added to an interest group from the Protected Audience API. This interest group will have an
  [optimized payload](https://github.com/privacysandbox/protected-auction-services-docs/blob/main/bidding-auction-services-payload-optimization.md).
- Later, the user visits a news site. The publisher or seller will have the `navigator.getInterestGroupAdAuctionData()` call on the page to generate
  an encrypted auction blob. This blob will be sent to the seller's real time bidding service.
- The seller will initiate a `SelectAd` request from their real time bidding service to their B&A seller frontend service. This will initiate the B&A
  server-side auction flow.
- Once the seller frontend service receives a `SelectAd` request, it will initiate a `GetBids` request to all configured buyer frontend services.
- Each buyer frontend will then retrieve `trustedBiddingSignals` from their key/value service, then a `GenerateBids` request will be made from the
  buyer frontend to the bidding service.
- The bidding service will then handle the `generateBid` function with provided bidding logic. The bidding service will send a response containing the
  bids per interest group and the buyer frontend will forward this response to the seller frontend.
- The seller frontend will then initiate a `ScoreAdsRequest` to the auction service. The auction service will handle the `scoreAd` function with
  provided auction logic.
- The auction is then complete and the encrypted ad auction result is returned to the seller's real time bidding service.
- The seller's real time bidding service then forwards the encrypted ad auction result back to the publisher page. Then the
  `navigator.runAdAuction()`function runs on the page and displays the winning ad.

![Bidding Auction API Flow](./img/bidding-auction-api-flow.png)

### User Journey

![Bidding Auction Flow](./img/bidding-auction-flow.png)

```bash
sequenceDiagram
    Browser->>+Advertiser: User visits a shop site and reviews products
    Browser-->>Browser: DSP calls navigator.joinAdInterestGroup(...)
    Browser-->>+Publisher: User visits a site
    Browser-->>Browser: SSP calls navigator.getInterestGroupAdAuctionData()
    Browser-->>SSP: browser sends ad auction data to SSP's real time bidding service
    SSP-->>DSP: SSP requests contextual bid from DSPs
    SSP-->>SSP: SSP sends a SelectAd request to the Seller Frontend Service
    SSP-->>DSP: SSP sends GetBids requests to Buyer Frontend Service
    DSP-->>DSP: DSP retrieves trustedBiddingSignals from Key-Value server
    DSP-->>DSP: Buyer Frontend sends GenerateBidsRequest to Bidding Service
    DSP-->>DSP: Bidding Service calls generateBid function
    DSP-->>SSP: Buyer Frontend returns AdWithBid for each interest group
    SSP-->>SSP: Seller Frontend sends ScoreAdsRequest to Auction Service
    SSP-->>SSP: Auction Service calls scoreAd function
    SSP-->>SSP: Ad auction result is forwarded back to SSP's real time bidding service
    SSP-->>Browser: Ad auction result is returned to the browser
    Browser-->>Publisher: Ad auction result is returned to the publisher page
    Browser-->>Browser: navigator.runAdAuction(auctionConfig)
```

\</TabItem\>

\<TabItem value="demo" label="Demo"\>

# **Demo**

## **Prerequisites**

- Chrome > v107 (Open chrome://version to look up your current version)
- Enable Privacy Sandbox APIs (Open chrome://settings/privacySandbox to enable this setting)
- Clear your browsing history before you run one of the demo scenario below (Open chrome://settings/clearBrowserData to delete your browsing history)
- Install [Docker](https://docs.docker.com/engine/install/) according to your system's specifications

1. Open Chrome from the command line using the following command. This will enable Chrome to use test keys for attestation.

```bash
google-chrome --enable-privacy-sandbox-ads-apis --disable-features=EnforcePrivacySandboxAttestations,FledgeEnforceKAnonymity --enable-features=FledgeBiddingAndAuctionServerAPI,FledgeBiddingAndAuctionServer:FledgeBiddingAndAuctionKeyURL/https%3A%2F%2Fstorage.googleapis.com%2Fba-test-buyer%2Fcoordinator-test-key.json
```

2. Follow instructions listed in
   [Instructions for deploying and running the demos in your local environment with Docker](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/docs/deploy-to-linux-docker.md)
   to deploy Privacy Sandbox Demos locally.

3. Clone the `bidding-auction-servers` [GitHub repository](https://github.com/privacysandbox/bidding-auction-servers).

```bash
git clone https://github.com/privacysandbox/bidding-auction-servers.git
```

4. From the root folder of the bidding and auction services repository, build the bidding and auction services with the following command.

```bash
production/packaging/build_and_test_all_in_docker \
  --service-path bidding_service \
  --service-path auction_service \
  --service-path buyer_frontend_service \
  --service-path seller_frontend_service \
  --platform gcp \
  --instance local \
  --no-precommit \
  --no-tests \
  --build-flavor non_prod \
  --gcp-skip-image-upload
```

5. Once the packaging step has completed, start the services with the following commands. **Run each command in a separate terminal window or tab**.
   - _NOTE: Ensure step #2 is complete as this will create the docker network._

**DSP-X Services**

```bash
## DSP-X Bidding Service ##
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.101 --network=privacy-sandbox-demos_adnetwork" \
BIDDING_JS_URL="http://privacy-sandbox-demos-dsp-x.dev:8080/js/dsp/usecase/bidding-and-auction/bidding-logic-dsp-x.js" \
SKIP_TLS_VERIFICATION=true \
./tools/debug/start_bidding
```

```bash
## DSP-X Buyer Frontend Service ##
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.102 --network=privacy-sandbox-demos_adnetwork" \
BUYER_KV_SERVER_ADDR="http://privacy-sandbox-demos-dsp-x.dev:8080/dsp/service/kv" \
BIDDING_SERVER_ADDR=172.18.0.101:50057 \
SKIP_TLS_VERIFICATION=true \
./tools/debug/start_bfe
```

**DSP-Y Services**

```bash
## DSP-Y Bidding Service ##
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.201 --network=privacy-sandbox-demos_adnetwork" \
BIDDING_JS_URL="http://privacy-sandbox-demos-dsp-y.dev:8080/js/dsp/usecase/bidding-and-auction/bidding-logic-dsp-y.js" \
SKIP_TLS_VERIFICATION=true \
./tools/debug/start_bidding
```

```bash
## DSP-Y Buyer Frontend Service ##
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.202 --network=privacy-sandbox-demos_adnetwork" \
BUYER_KV_SERVER_ADDR="http://privacy-sandbox-demos-dsp-y.dev:8080/dsp/service/kv" \
BIDDING_SERVER_ADDR=172.18.0.201:50057 \
SKIP_TLS_VERIFICATION=true \
./tools/debug/start_bfe
```

**SSP-X Services**

```bash
## SSP-X Auction Service ##
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.103 --network=privacy-sandbox-demos_adnetwork" \
AUCTION_JS_URL="http://privacy-sandbox-demos-ssp-x.dev:8080/js/ssp/usecase/bidding-and-auction/ssp-x/decision-logic.js" \
SKIP_TLS_VERIFICATION=true \
./tools/debug/start_auction
```

```bash
## SSP-X Seller Frontend Service
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.104  --network=privacy-sandbox-demos_adnetwork" \
SELLER_ORIGIN_DOMAIN="https://privacy-sandbox-demos-ssp-x.dev" \
AUCTION_SERVER_ADDR=172.18.0.103:50061 \
KEY_VALUE_SIGNALS_ADDR="http://privacy-sandbox-demos-ssp-x.dev:8080/ssp/usecase/bidding-and-auction/ssp-x/service/kv" \
BUYER_SERVER_ADDRS_JSON='{"https://privacy-sandbox-demos-dsp-y.dev":{"url":"172.18.0.102:50051","cloudPlatform":"LOCAL"},"https://privacy-sandbox-demos-dsp-x.dev":{"url":"172.18.0.202:50051","cloudPlatform":"LOCAL"}}' \
SKIP_TLS_VERIFICATION=true \
./tools/debug/start_sfe
```

**SSP-Y Services**

```bash
## SSP-Y Auction Service ##
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.203 --network=privacy-sandbox-demos_adnetwork" \
AUCTION_JS_URL="http://privacy-sandbox-demos-ssp-y.dev:8080/js/ssp/usecase/bidding-and-auction/ssp-y/decision-logic.js" \
SKIP_TLS_VERIFICATION=true \
./tools/debug/start_auction
```

```bash
## SSP-Y Seller Frontend Service
DOCKER_RUN_ARGS_STRING="--ip=172.18.0.204  --network=privacy-sandbox-demos_adnetwork" \
SELLER_ORIGIN_DOMAIN="https://privacy-sandbox-demos-ssp-y.dev" \
AUCTION_SERVER_ADDR=172.18.0.203:50061 \
KEY_VALUE_SIGNALS_ADDR="http://privacy-sandbox-demos-ssp-y.dev:8080/ssp/usecase/bidding-and-auction/ssp-y/service/kv" \
BUYER_SERVER_ADDRS_JSON='{"https://privacy-sandbox-demos-dsp-y.dev":{"url":"172.18.0.102:50051","cloudPlatform":"LOCAL"},"https://privacy-sandbox-demos-dsp-x.dev":{"url":"172.18.0.202:50051","cloudPlatform":"LOCAL"}}' \
SKIP_TLS_VERIFICATION=true \
./tools/debug/start_sfe
```

6. Validate all services are running properly by ensuring the following logs are printed on each service.

```bash
## Bidding Service ##
bidding_main.cc:627] privacy_sandbox_system_log: Server listening on 0.0.0.0:50057

## Buyer Frontend Service ##
buyer_frontend_main.cc:397] privacy_sandbox_system_log: Server listening on 0.0.0.0:50051

## Auction Service ##
auction_main.cc:374] privacy_sandbox_system_log: Server listening on 0.0.0.0:50061

## Seller Frontend Service ##
seller_frontend_main.cc:364] privacy_sandbox_system_log: Server listening on 0.0.0.0:50053

```

### **Do not proceed until services are running and validated properly.**

## **Steps**

1. Navigate to the Advertiser's shop site [privacy-sandbox-demos-shop.dev](privacy-sandbox-demos-shop.dev).
2. Click on any item in the shop.
   - The advertiser assumes the user is interested in this type of product. The advertiser uses a demand-side provider (DSP) to handle advertising
     needs. The DSP has a tag on this page that will add the user to an interest group for this product category.
3. Once on the product page, add the `?auctionType=ba` query parameter to the query string to enable this demo.

   - **NOTE**: In a production deployment, this query parameter would **not** be required. This is for demo purposes only.
   - Example: `https://privacy-sandbox-demos-shop.dev/items/1f45f?auctionType=ba`

4. Open the Chrome Developer Tools console and view the `Console` tab. Here you can see console logs of the user being added to an interest group.
5. Navigate to the `Application` tab. Select `Interest Groups` under the `Storage` section.
   - **NOTE**: If this tab has no events, refresh the page.
6. Select the `dsp-a-ba-test` event. This shows a `joinAdInterestGroup` call for a DSP without
   [payload optimization](https://github.com/privacysandbox/protected-auction-services-docs/blob/main/bidding-auction-services-payload-optimization.md).
7. Select the `dsp-x-ba-test` event. This shows a `joinAdInterestGroup` call for a DSP with
   [payload optimization](https://github.com/privacysandbox/protected-auction-services-docs/blob/main/bidding-auction-services-payload-optimization.md).
   - Within the `ads` field, note the `adRenderId` field. This is an optimization to retrieve the `renderURL` from a Key-Value server.
   - Note the field `auctionServerRequestFlags: ["omit-ads","omit-user-bidding-signals"]`. This field notifies the browser to allow for ommission of
     the `ads` and `userBiddingSignals` fields as these can cause larger payloads.
   - Note the field `trustedBiddingSignalsKeys`. This field will notify the Buyer Frontend Service to retrieve these real time bidding signals from
     their Key-Value server before generating a bid.
8. Navigate to the news site [https://privacy-sandbox-demos-news.dev](https://privacy-sandbox-demos-news.dev/) with the Chrome Developers Tool window
   open.
9. Once on the news site, add the `uc-ba?demo=true` query parameter to the query string.
   - **NOTE**: In a production deployment, this query parameter would **not** be required. This is for demo purposes only.
   - Query string: `https://privacy-sandbox-demos-news.dev/uc-ba?demo=true`

## **Implementation details**

1. The entrypoint to the B&A demo is handled through a query parameter `/bidding-and-auction`.
