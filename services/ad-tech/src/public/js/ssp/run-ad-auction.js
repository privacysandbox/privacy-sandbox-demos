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

const getAuctionConfig = async () => {
  const currentUrl = new URL(location.href);
  const auctionConfigUrl = new URL(location.origin);
  auctionConfigUrl.pathname = '/ssp/auction-config.json';
  // Copy query params from current context.
  for (const searchParam of currentUrl.searchParams) {
    auctionConfigUrl.searchParams.append(searchParam[0], searchParam[1]);
  }
  const res = await fetch(auctionConfigUrl);
  if (res.ok) {
    return res.json();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (navigator.runAdAuction === undefined) {
    console.log('[PSDemo] Protected Audience API is not supported.');
    return;
  }
  const auctionConfig = await getAuctionConfig();
  const adAuctionResult = await navigator.runAdAuction(auctionConfig);
  console.log('[PSDemo] Protected Audience config, result: ', {
    auctionConfig,
    adAuctionResult,
  });
  if (!adAuctionResult) {
    console.log('[PSDemo] Protected Audience did not return a result.');
    return;
  }
  if (new URL(location.href).searchParams.get('adType') === 'video') {
    // Video ads are only supported with iframes.
    const adFrame = document.createElement('iframe');
    adFrame.id = 'video-ad-frame';
    adFrame.src = adAuctionResult;
    adFrame.width = 0;
    adFrame.height = 0;
    document.body.appendChild(adFrame);
  } else {
    // Default to display ads with fencedframes.
    const fencedframe = document.createElement('fencedframe');
    fencedframe.config = adAuctionResult;
    fencedframe.setAttribute('mode', 'opaque-ads');
    fencedframe.setAttribute('scrolling', 'no');
    // $fencedframe.setAttribute("allow", "attribution-reporting; run-ad-auction")
    fencedframe.width = 300;
    fencedframe.height = 250;
    console.log('[PSDemo] Display ads in ', fencedframe);
    document.body.appendChild(fencedframe);
  }
});
