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

/**
 * Where is this script used:
 *   This is the main tag for an ad seller delivering ads in a single seller
 *   setup. This is included on certain tagged publisher pages.
 *
 * What does this script do:
 *   This script injects an iframe in its own origin to invoke runAdAuction()
 *   and renders the ad in a fenced frame.
 */
(async () => {
  /** Listen for potential post messages from DSPs. */
  const addEventListenerForDspPostMessages = () => {
    window.addEventListener('message', (event) => {
      if (!event.origin.startsWith('https://privacy-sandbox-demos-dsp')) {
        return;
      }
      if ('string' === typeof event.data) {
        const {adVastUrl} = JSON.parse(event.data);
        setUpIMA(adVastUrl);
      }
    });
  };

  /** Injects an iframe that starts a single seller PAAPI auction. */
  const injectIframeToRunAdAuction = () => {
    // Construct iframe URL from current script origin.
    const $script = document.currentScript;
    const iframeSrc = new URL($script.src);
    iframeSrc.pathname = '/ssp/run-ad-auction.html';
    // Append query params from script dataset context.
    for (const datakey in $script.dataset) {
      iframeSrc.searchParams.append(datakey, $script.dataset[datakey]);
    }
    // Append query params from page URL.
    const currentUrl = new URL(location.href);
    for (const searchParam of currentUrl.searchParams) {
      iframeSrc.searchParams.append(searchParam[0], searchParam[1]);
    }
    const $iframe = document.createElement('iframe');
    $iframe.src = iframeSrc;
    $iframe.width = 300;
    $iframe.height = 250;
    $iframe.async = true;
    $iframe.defer = true;
    $iframe.setAttribute('scrolling', 'no');
    $iframe.setAttribute('style', 'border: none');
    $iframe.setAttribute('allow', 'attribution-reporting; run-ad-auction');
    const $ins = document.querySelector('ins.ads');
    $ins.appendChild($iframe);
  };

  /** Main function. */
  (() => {
    addEventListenerForDspPostMessages();
    injectIframeToRunAdAuction();
  })();
})();
