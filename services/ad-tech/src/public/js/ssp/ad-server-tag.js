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
  const CURRENT_HOST = '<%= HOSTNAME %>';
  const LOG_PREFIX = '[PSDemo] <%= HOSTNAME %> ad server tag';

  // ********************************************************
  // HELPER FUNCTIONS
  // ********************************************************
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
    console.debug(LOG_PREFIX, 'injecting iframe', {src, divId, iframeEl});
    document.getElementById(divId).appendChild(iframeEl);
    return iframeEl;
  };

  /** Listen for potential post messages from DSPs. */
  const addEventListenerForDspPostMessages = () => {
    window.addEventListener('message', async (event) => {
      if (!event.origin.startsWith('https://<%= DEMO_HOST_PREFIX %>')) {
        return;
      }
      if ('string' === typeof event.data) {
        try {
          const {auctionId, buyer, vastXml} = JSON.parse(event.data);
          console.debug(LOG_PREFIX, 'received VAST post-message from DSP', {
            auctionId,
            buyer,
            event,
          });
          if (vastXml) {
            console.info(LOG_PREFIX, 'setting up video ad', {
              auctionId,
              buyer,
              vastXml,
            });
            window.PSDemo.VideoAdHelper.setUpIMA(vastXml);
          }
        } catch (err) {
          console.error(
            LOG_PREFIX,
            'encountered error while parsing post-message',
            {err},
          );
        }
      }
    });
    console.debug(LOG_PREFIX, 'listening for post-messages from buyers');
  };

  /** Adds a descriptive label for demonstration purposes. */
  const addDescriptionToAdContainer = (divId, adType, isFencedFrame) => {
    const paragraphEl = document.createElement('p');
    paragraphEl.innerText = `${adType} ad in ${
      isFencedFrame ? 'FENCED FRAME' : 'IFRAME'
    } by ${CURRENT_HOST}`;
    paragraphEl.className = 'ad-label';
    const adContainer = document.getElementById(divId);
    if (adContainer) {
      adContainer.appendChild(paragraphEl);
    } else {
      console.warn(LOG_PREFIX, 'did not find ad container ', {divId, adType});
    }
  };

  /** Validates the adUnit configuration. */
  const isValidAdUnit = (adUnit) => {
    const {divId, adType, isFencedFrame, size} = adUnit;
    if (!divId) {
      console.warn(LOG_PREFIX, 'did not find divId in adUnit', {adUnit});
      return false;
    }
    const $divEl = document.getElementById(divId);
    if (!$divEl) {
      console.warn(LOG_PREFIX, 'did not find ad container on page', {adUnit});
      return false;
    }
    if (!adType) {
      console.warn(LOG_PREFIX, 'did not find adType in adUnit', {adUnit});
      return false;
    }
    if (!['DISPLAY', 'VIDEO', 'MULTIPIECE'].includes(adType)) {
      console.warn(LOG_PREFIX, 'found unsupported adType', {adUnit});
      return false;
    }
    if ('VIDEO' === adType && isFencedFrame) {
      console.warn(LOG_PREFIX, 'does not support video ads in fenced frames', {
        adUnit,
      });
      return false;
    }
    if (!size || size.length !== 2) {
      console.warn(
        LOG_PREFIX,
        'expected size to be an array of 2: [w, h] in adUnit',
        {adUnit},
      );
      return false;
    }
    return true;
  };

  // ****************************************************************
  // CORE LOGIC: DELIVER ADS FOR EACH AD UNIT
  // ****************************************************************
  /** Iterates through adUnit configs and delivers ads. */
  const deliverAds = (adUnits, otherSellers) => {
    // Iterate over adUnits and inject an ad-container iframe for each adUnit.
    // The container iframe has additional scripts to execute ad auctions for
    // a given adUnit config. This ad-server-tag will post message the adUnit config
    // to the injected iframe once it's loaded.
    const pageContext = window.PSDemo.getPageContextData();
    for (const adUnit of adUnits) {
      if (!isValidAdUnit(adUnit)) {
        continue;
      }
      console.debug(LOG_PREFIX, 'processing adUnit', {adUnit});
      const {divId, adType, isFencedFrame} = adUnit;
      let {size} = adUnit;
      addDescriptionToAdContainer(divId, adType, isFencedFrame);
      if ('VIDEO' === adType.toUpperCase()) {
        addEventListenerForDspPostMessages();
        size[1] = 48; // Set height to 48px, just enough for a description.
      }
      const src = new URL(document.currentScript.src);
      src.pathname = '/ssp/run-sequential-ad-auction.html';
      // Add page context to ad unit configuration.
      Object.assign(adUnit, pageContext);
      console.debug(LOG_PREFIX, 'injecting iframe for adUnit', {src, adUnit});
      const iframeEl = injectAndReturnIframe({
        src,
        divId,
        size,
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
            message: 'RUN_AD_AUCTION',
            adUnit,
            otherSellers,
          }),
          '*',
        );
        console.debug(LOG_PREFIX, 'post-messaged adUnit configs', {
          adUnit,
          iframeEl,
        });
      });
      console.debug(LOG_PREFIX, 'delivering for validated adUnit', {
        adUnit,
        iframeEl,
      });
    }
  };

  // ****************************************************************
  // MAIN FUNCTION
  // ****************************************************************
  (() => {
    // Read page ad unit configurations from local storage.
    if (!window.PSDemo || !window.PSDemo.PAGE_ADS_CONFIG) {
      console.warn(LOG_PREFIX, 'did not find window.PSDemo.PAGE_ADS_CONFIG');
      return;
    }
    const {adUnits, otherSellers} = window.PSDemo.PAGE_ADS_CONFIG;
    if (!adUnits || !adUnits.length) {
      console.warn(
        LOG_PREFIX,
        'did not find adUnits in window.PSDemo.PAGE_ADS_CONFIG',
      );
      return;
    }
    console.info(LOG_PREFIX, 'delivering ads', {adUnits, otherSellers});
    deliverAds(adUnits, otherSellers);
  })();
})();
