/*
 Copyright 2022 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

async function getAuctionConfig() {
  // Grab the 'excludeProductTag' param from the url
  var queryString = window.location.search;
  var urlParams = new URLSearchParams(queryString);
  var excludeProductTag = urlParams.get('excludeProductTag');

  // Create the auction config
  var jsonString =
    `{"seller":"https://privacy-sandbox-demos-ssp.dev/",\
    "decisionLogicUrl":"https://privacy-sandbox-demos-ssp.dev/js/uc-publisher-ads-req/decision-logic.js",\
    "interestGroupBuyers":["https://privacy-sandbox-demos-dsp.dev/"],\
    "auctionSignals":{"auction_signals":"auction_signals"},\
    "sellerSignals":{"excludeProductTag":"` +
    excludeProductTag +
    `"},\
    "perBuyerSignals":{"https://privacy-sandbox-demos-dsp.dev/": {"per_buyer_signals":"per_buyer_signals"}},\
    "trustedScoringSignalsURL":"https://privacy-sandbox-demos-ssp.dev/trusted-scoring-uc-publisher-ads-req",\
    "resolveToConfig":true}`;
  return JSON.parse(jsonString);
}

document.addEventListener('DOMContentLoaded', async (e) => {
  if (navigator.runAdAuction === undefined) {
    return console.log('Protected Audience API is not supported');
  }

  const auctionConfig = await getAuctionConfig();
  const adAuctionResult = await navigator.runAdAuction(auctionConfig);
  const $fencedframe = document.createElement('fencedframe');
  $fencedframe.config = adAuctionResult;
  $fencedframe.setAttribute('mode', 'opaque-ads');
  $fencedframe.setAttribute('scrolling', 'no');
  $fencedframe.width = 300;
  $fencedframe.height = 250;
  document.body.appendChild($fencedframe);
});
