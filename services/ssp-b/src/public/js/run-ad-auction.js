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

// ssp
async function getAuctionConfig() {
  const url = new URL(location.origin);
  url.pathname = '/auction-config.json';
  const res = await fetch(url);
  return res.json();
}

document.addEventListener('DOMContentLoaded', async (e) => {
  if (navigator.runAdAuction === undefined) {
    return console.log('Protected Audience API is not supported');
  }

  const auctionConfig = await getAuctionConfig();

  const adAuctionResult = await navigator.runAdAuction(auctionConfig);

  console.log({
    auctionConfig,
    adAuctionResult,
  });

  const $fencedframe = document.createElement('fencedframe');
  $fencedframe.config = adAuctionResult;
  $fencedframe.setAttribute('mode', 'opaque-ads');
  $fencedframe.setAttribute('scrolling', 'no');
  // $fencedframe.setAttribute("allow", "attribution-reporting; run-ad-auction")
  $fencedframe.width = 300;
  $fencedframe.height = 250;

  console.log(`display ads in ${$fencedframe}`);

  document.body.appendChild($fencedframe);
});
