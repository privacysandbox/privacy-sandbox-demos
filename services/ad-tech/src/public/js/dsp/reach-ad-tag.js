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

(() => {
  const $script = document.currentScript;
  const scriptSrc = $script.getAttribute('src');
  // const staticAdURL = new URL(scriptSrc);

  const staticAdURL =
    'https://privacy-sandbox-demos-dsp.dev/ads/reach-ads?advertiser=privacy-sandbox-demos-shop.dev&itemId=1f45e';

  staticAdURL.pathname = '/ads/static-ads';

  const $iframe = document.createElement('iframe');
  $iframe.width = 300;
  $iframe.height = 250;
  $iframe.src = staticAdURL;
  $iframe.setAttribute('scrolling', 'no');
  $iframe.setAttribute('style', 'border: none');
  $iframe.setAttribute('allow', 'attribution-reporting');
  $script.parentElement.insertBefore($iframe, $script);
})();

/**
 * Where is this script used:
 *   This is the main tag for an ad seller delivering ads in a single seller
 *   setup. This is included on certain tagged publisher pages.
 *
 * What does this script do:
 *   This script orchestrates the loading of other seller modules to deliver
 *   relevant ads for all the ad slots available on the publisher page. This
 *   script reads the ad slot configurations set by the publisher and injects
 *   an iframe for each ad slot. These iframes then individually execute ad
 *   auctions to select the ad as per publisher configurations.
 */
// (() => {
//     /** Current script domain name. */
//     const CURR_HOSTNAME = new URL(document.currentScript.src).hostname;
//     // ********************************************************
//     // HELPER FUNCTIONS
//     // ********************************************************
//     /** Logs to console. */
//     const log = (message, context) => {
//       console.log('[PSDemo] Seller', CURR_HOSTNAME, 'ad tag', message, {context});
//     };

//     /** Returns frame URL with page context as search query. */
//     const getIframeUrlWithPageContext = () => {
//       // Construct iframe URL using current script origin.
//       const $script = document.currentScript;
//       const src = new URL($script.src);
//       src.pathname = '/ssp/run-sequential-ad-auction.html';
//       // Append query parameters from script dataset context.
//       for (const datakey in $script.dataset) {
//         src.searchParams.append(datakey, $script.dataset[datakey]);
//       }
//       // Append query params from page URL.
//       const currentUrl = new URL(location.href);
//       for (const [key, value] of currentUrl.searchParams) {
//         src.searchParams.append(key, value);
//       }
//       src.searchParams.append('publisher', location.origin);
//       src.searchParams.append('title', document.title);
//       return src;
//     };

//     /** Injects an iframe using the current script's reference. */
//     const injectAndReturnIframe = ({src, divId, size, attributes}) => {
//       if (!src) {
//         return;
//       }
//       const iframeEl = document.createElement('iframe');
//       iframeEl.src = src;
//       [iframeEl.width, iframeEl.height] = size;
//       if (attributes && 'object' === typeof attributes) {
//         for (const [key, value] of Object.entries(attributes)) {
//           iframeEl.setAttribute(key, value);
//         }
//       }
//       log('injecting iframe', {src, divId, iframeEl});
//       document.getElementById(divId).appendChild(iframeEl);
//       return iframeEl;
//     };

//     /** Listen for potential post messages from DSPs. */
//     const addEventListenerForDspPostMessages = () => {
//       window.addEventListener('message', async (event) => {
//         if (!event.origin.startsWith('https://<%= DEMO_HOST_PREFIX %>')) {
//           return;
//         }
//         if ('string' === typeof event.data) {
//           try {
//             const {auctionId, buyer, vastXml} = JSON.parse(event.data);
//             log('received VAST post-message from DSP', {auctionId, buyer, event});
//             if (vastXml) {
//               log('setting up video ad', {auctionId, buyer, vastXml});
//               window.PSDemo.VideoAdHelper.setUpIMA(vastXml);
//             }
//           } catch (err) {
//             log('encountered error while parsing post-message', {e});
//           }
//         }
//       });
//       log('listening for post-messages from buyers');
//     };

//     /** Adds a descriptive label for demonstration purposes. */
//     const addDescriptionToAdContainer = (divId, adType, isFencedFrame) => {
//       const paragraphEl = document.createElement('p');
//       paragraphEl.innerText = `${adType} ad in ${
//         isFencedFrame ? 'FENCED FRAME' : 'IFRAME'
//       } by ${CURR_HOSTNAME}`;
//       paragraphEl.className = 'ad-label';
//       const adContainer = document.getElementById(divId);
//       if (adContainer) {
//         adContainer.appendChild(paragraphEl);
//       } else {
//         log('did not find ad container ', {divId, adType});
//       }
//     };

//     /** Validates the adUnit configuration. */
//     const isValidAdUnit = (adUnit) => {
//       const {divId, adType, isFencedFrame, size} = adUnit;
//       if (!divId) {
//         log('did not find divId in adUnit', {adUnit});
//         return false;
//       }
//       const $divEl = document.getElementById(divId);
//       if (!$divEl) {
//         log('did not find ad container on page', {adUnit});
//         return false;
//       }
//       if (!adType) {
//         log('did not find adType in adUnit', {adUnit});
//         return false;
//       }
//       if (!['DISPLAY', 'REACH', 'VIDEO'].includes(adType)) {
//         log('found unsupported adType', {adUnit});
//         return false;
//       }
//       if ('VIDEO' === adType && isFencedFrame) {
//         log('does not support video ads in fenced frames', {adUnit});
//         return false;
//       }
//       if (!size || size.length !== 2) {
//         log('expected size to be an array of 2: [w, h] in adUnit', {adUnit});
//         return false;
//       }
//       return true;
//     };

//     /** Iterates through adUnit configs and delivers ads. */
//     const deliverAds = (adUnits, otherSellers) => {
//       // Iterate over adUnits and inject an ad-container iframe for each adUnit.
//       // The container iframe has additional scripts to execute ad auctions for
//       // a given adUnit config. This ad-server-tag will post message the adUnit config
//       // to the injected iframe once it's loaded.
//       for (const adUnit of adUnits) {
//         if (!isValidAdUnit(adUnit)) {
//           continue;
//         }
//         log('processing adUnit', {adUnit});
//         const {divId, adType, isFencedFrame} = adUnit;
//         let {size} = adUnit;
//         addDescriptionToAdContainer(divId, adType, isFencedFrame);
//         if ('VIDEO' === adType.toUpperCase()) {
//           addEventListenerForDspPostMessages();
//           size[1] = 48; // Set height to 48px, just enough for a description.
//         }
//         const src = getIframeUrlWithPageContext();
//         log('injecting iframe for adUnit', {src, adUnit});
//         const iframeEl = injectAndReturnIframe({
//           src,
//           divId,
//           size,
//           attributes: {
//             'scrolling': 'no',
//             'style': 'border: none',
//             'allow': 'attribution-reporting; run-ad-auction',
//           },
//         });
//         // Post-message the adUnit config to the injected iframe.
//         adUnit.pageURL = location.href;
//         adUnit.pageTitle = document.title;
//         adUnit.userAgent = navigator.userAgent;
//         adUnit.isMobile = navigator.userAgentData.mobile;
//         adUnit.platform = navigator.userAgentData.platform;
//         adUnit.browserVersion = navigator.userAgentData.brands.find(
//           (brand) => 'Chromium' === brand.brand,
//         ).version;
//         iframeEl.addEventListener('load', () => {
//           iframeEl.contentWindow.postMessage(
//             JSON.stringify({
//               adUnit,
//               otherSellers,
//             }),
//             '*',
//           );
//           log('post-messaged adUnit configs', {adUnit, iframeEl});
//         });
//         log('delivering for validated adUnit', {adUnit, iframeEl});
//       }
//     };

//     /** Main function. */
//     (() => {
//       // Read page ad unit configurations from local storage.
//       if (!window.PSDemo || !window.PSDemo.PAGE_ADS_CONFIG) {
//         return log('did not find', {key: 'window.PSDemo.PAGE_ADS_CONFIG'});
//       }
//       const {adUnits, otherSellers} = window.PSDemo.PAGE_ADS_CONFIG;
//       if (!adUnits || !adUnits.length) {
//         return log('did not find adUnits', {
//           PAGE_ADS_CONFIG: window.PSDemo.PAGE_ADS_CONFIG,
//         });
//       }
//       log('delivering ads', {adUnits, otherSellers});
//       deliverAds(adUnits, otherSellers);
//     })();
//   })();
