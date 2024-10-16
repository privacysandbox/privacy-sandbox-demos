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
 *   This script orchestrates the loading of other seller modules to deliver
 *   relevant ads for all the ad slots available on the publisher page. This
 *   script reads the ad slot configurations set by the publisher and injects
 *   an iframe for each ad slot. These iframes then individually execute ad
 *   auctions to select the ad as per publisher configurations.
 */
(() => {
  /** Current script domain name. */
  const CURR_HOSTNAME = new URL(document.currentScript.src).hostname;
  // ********************************************************
  // HELPER FUNCTIONS
  // ********************************************************
  /** Logs to console. */
  const log = (label, context) => {
    console.log('[PSDemo] Ad seller', CURR_HOSTNAME, label, {context});
  };

  /** Returns frame URL with page context as search query. */
  const getIframeUrlWithPageContext = (pathname) => {
    if (!pathname) {
      return;
    }
    // Construct iframe URL using current script origin.
    const $script = document.currentScript;
    const src = new URL($script.src);
    src.pathname = pathname;
    // Append query parameters from script dataset context.
    for (const datakey in $script.dataset) {
      src.searchParams.append(datakey, $script.dataset[datakey]);
    }
    // Append query params from page URL.
    const currentUrl = new URL(location.href);
    for (const [key, value] of currentUrl.searchParams) {
      src.searchParams.append(key, value);
    }
    src.searchParams.append('publisher', location.origin);
    src.searchParams.append('title', document.title);
    return src;
  };

  /** Injects an iframe using the current script's reference. */
  const injectAndReturnIframe = ({src, divId, size, attributes}) => {
    if (!src) {
      return;
    }
    const iframeEl = document.createElement('iframe');
    iframeEl.src = src;
    [iframeEl.width, iframeEl.height] = size;
    if (attributes && 'object' === typeof attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        iframeEl.setAttribute(key, value);
      }
    }
    log('injecting iframe', {src, divId, iframeEl});
    document.getElementById(divId).appendChild(iframeEl);
    return iframeEl;
  };

  /** Listen for potential post messages from DSPs. */
  const addEventListenerForDspPostMessages = () => {
    window.addEventListener('message', async (event) => {
      if (!event.origin.startsWith('https://privacy-sandbox-demos-dsp')) {
        return;
      }
      log('received post-message from DSP', {event});
      if ('string' === typeof event.data) {
        const {vastXml} = JSON.parse(event.data);
        if (vastXml) {
          log('received VAST response', {vastXml});
          const vastResponse = await fetch(vastXml);
          if (vastResponse.ok) {
            const vastXmlText = await vastResponse.text();
            window.PSDemo.VideoAdHelper.setUpIMA(vastXmlText);
          } else {
            log('did not receive VAST XML response', {
              url: vastXml,
              statusText: vastResponse.statusText,
            });
          }
        }
      }
    });
    log('listening for post-messages from buyers');
  };

  /** Adds a descriptive label for demonstration purposes. */
  const addDescriptionToAdContainer = (divId, adType, isFencedFrame) => {
    const paragraphEl = document.createElement('p');
    paragraphEl.innerText = `${adType} ad in ${
      isFencedFrame ? 'fenced frame' : 'iframe'
    }`.toUpperCase();
    paragraphEl.className = 'font-mono text-sm';
    const adContainer = document.getElementById(divId);
    if (adContainer) {
      adContainer.appendChild(paragraphEl);
    } else {
      log('did not find ad container ', {divId, adType});
    }
  };

  /** Validates the adUnit configuration. */
  const isValidAdUnit = (adUnit) => {
    const {divId, adType, isFencedFrame, size} = adUnit;
    if (!divId) {
      log('did not find divId in adUnit', {adUnit});
      return false;
    }
    const $divEl = document.getElementById(divId);
    if (!$divEl) {
      log('did not find ad container on page', {adUnit});
      return false;
    }
    if (!adType) {
      log('did not find adType in adUnit', {adUnit});
      return false;
    }
    if (!['DISPLAY', 'VIDEO'].includes(adType)) {
      log('found unsupported adType', {adUnit});
      return false;
    }
    if ('VIDEO' === adType && isFencedFrame) {
      log('does not support video ads in fenced frames', {adUnit});
      return false;
    }
    if (!size || size.length !== 2) {
      log('expected size to be an array of 2: [w, h] in adUnit', {adUnit});
      return false;
    }
    return true;
  };

  /** Iterates through adUnit configs and delivers ads. */
  const deliverAds = (adUnits, otherSellers) => {
    // Iterate over adUnits and inject an ad-container iframe for each adUnit.
    // The container iframe has additional scripts to execute ad auctions for
    // a given adUnit config. This ssp-tag will post message the adUnit config
    // to the injected iframe once it's loaded.
    for (const adUnit of adUnits) {
      if (!isValidAdUnit(adUnit)) {
        continue;
      }
      const {divId, adType, isFencedFrame} = adUnit;
      let {size} = adUnit;
      if ('DISPLAY' === adType.toUpperCase()) {
        addDescriptionToAdContainer(divId, adType, isFencedFrame);
      } else if ('VIDEO' === adType.toUpperCase()) {
        addEventListenerForDspPostMessages();
        size = [0, 0]; // Hide frame as this will only post message the VAST.
      } else {
        return log('unsupported adType', {adUnit});
      }
      const pathname = ((otherSellers) => {
        if (!otherSellers || !otherSellers.length) {
          return '/ssp/run-ad-auction.html'; // Single-seller
        } else {
          return '/ssp/run-sequential-ad-auction.html'; // Multi-seller
        }
      })(otherSellers);
      const iframeEl = injectAndReturnIframe({
        src: getIframeUrlWithPageContext(pathname),
        divId: divId,
        size: size,
        attributes: {
          'scrolling': 'no',
          'style': 'border: none',
          'allow': 'attribution-reporting; run-ad-auction',
        },
      });
      // Post-message the adUnit config to the injected iframe.
      iframeEl.addEventListener('load', () => {
        iframeEl.contentWindow.postMessage(
          JSON.stringify({
            adUnit,
            otherSellers,
          }),
          '*',
        );
        log('post-messaged adUnit configs', {adUnit, iframeEl});
      });
      log('delivering for validated adUnit', {adUnit, iframeEl});
    }
  };

  /** Main function. */
  (() => {
    // Read page ad unit configurations from local storage.
    if (!window.PSDemo || !window.PSDemo.PAGE_ADS_CONFIG) {
      return log('did not find', {key: 'window.PSDemo.PAGE_ADS_CONFIG'});
    }
    const {adUnits, otherSellers} = window.PSDemo.PAGE_ADS_CONFIG;
    if (!adUnits || !adUnits.length) {
      return log('did not find adUnits', {
        PAGE_ADS_CONFIG: window.PSDemo.PAGE_ADS_CONFIG,
      });
    }
    log('delivering ads', {adUnits, otherSellers});
    deliverAds(adUnits, otherSellers);
  })();
})();
