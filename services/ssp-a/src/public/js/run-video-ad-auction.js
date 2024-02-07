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
  const url = new URL(location.origin);
  url.pathname = '/auction-config.json';
  const res = await fetch(url);
  if (res.ok) {
    return res.json();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (navigator.runAdAuction === undefined) {
    return console.log('[DEMO] Protected Audience API is not supported');
  }
  const auctionConfig = await getAuctionConfig();
  // FencedFrameConfing can't be rendered in iframes.
  // This demo requires iframes.
  auctionConfig.resolveToConfig = false;
  const adAuctionResult = await navigator.runAdAuction(auctionConfig);
  console.log({auctionConfig, adAuctionResult});
  if (adAuctionResult) {
    const adFrame = document.createElement('iframe');
    adFrame.id = 'video-ad-frame';
    adFrame.src = adAuctionResult;
    adFrame.width = 0;
    adFrame.height = 0;
    document.body.appendChild(adFrame);
  }
});
