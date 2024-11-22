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
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const excludeProductTag = urlParams.get('excludeProductTag');

  // Load the auction config json
  const auctionConfig = await getStaticAuctionConfig();

  // Add the excluded product tag as the auction config seller signals
  auctionConfig.sellerSignals = {'excludeProductTag': excludeProductTag};

  return auctionConfig;
}

async function getStaticAuctionConfig() {
  const url = new URL(location.origin);
  url.pathname = '/uc-publisher-ads-req/auction-config.json';
  const res = await fetch(url);
  return res.json();
}

document.addEventListener('DOMContentLoaded', async (e) => {
  if (navigator.runAdAuction === undefined) {
    return console.log('Protected Audience API is not supported');
  }

  const auctionConfig = await getAuctionConfig();
  const adAuctionResult = await navigator.runAdAuction(auctionConfig);
  const ele = document.createElement('fencedframe');
  ele.config = adAuctionResult;
  ele.setAttribute('mode', 'opaque-ads');
  ele.setAttribute('scrolling', 'no');
  ele.width = 300;
  ele.height = 250;
  document.body.appendChild(ele);
});
