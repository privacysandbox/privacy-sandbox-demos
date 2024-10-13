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
 * TODO: Rename to run-single-seller-ad-auction after unified branch is merged.
 * Where is this script used:
 *   This script is loaded inside the ad-tech iframe to run a single-seller
 *   Protected Audience auction.
 *
 * What does this script do:
 *   This script fetches the auction configurations from its server and this
 *   script includes any embedded first-party context in the iframe URL.
 */
(() => {
  /** Domain of the current script. */
  const CURR_HOSTNAME = new URL(document.currentScript.src).hostname;
  // ****************************************************************
  // HELPER FUNCTIONS
  // ****************************************************************
  /** Logs to console. */
  const log = (label, context) => {
    console.log('[PSDemo] Ad seller', CURR_HOSTNAME, label, {context});
  };

  /** Validates the post messages and returns a valid adUnit if found. */
  const getValidatedAdUnit = (message) => {
    const iframeUrl = new URL(window.location.href);
    const publisher = iframeUrl.searchParams.get('publisher');
    if (message.origin !== publisher) {
      return log('ignoring message from unknown origin', {message, publisher});
    }
    try {
      const {adUnit, otherSellers} = JSON.parse(message.data);
      if (!adUnit.adType) {
        return log('stopping as adType not found in adUnit', {adUnit});
      }
      if (otherSellers && otherSellers.length) {
        log('ignoring other sellers', {adUnit, otherSellers});
      }
      log('received valid adUnit config', {adUnit});
      return adUnit;
    } catch (e) {
      return log('encountered error in parsing adUnit config', {message});
    }
  };

  /** Makes a request to the server to retrieve an auction config. */
  const getAuctionConfig = async (adUnit) => {
    const currentUrl = new URL(location.href);
    const auctionConfigUrl = new URL(location.origin);
    auctionConfigUrl.pathname = '/ssp/auction-config.json';
    // Copy adUnit configs as query params.
    for (const [key, value] of Object.entries(adUnit)) {
      auctionConfigUrl.searchParams.append(key, value);
    }
    // Copy query params from current context.
    for (const [key, value] of currentUrl.searchParams) {
      if (auctionConfigUrl.searchParams.has(key)) {
        log('INTERNAL overwriting query parameter', {
          key,
          oldValue: auctionConfigUrl.searchParams.get(key),
          newValue: value,
          url: auctionConfigUrl.toString(),
        });
      }
      auctionConfigUrl.searchParams.append(key, value);
    }
    log('retrieving auction config', {auctionConfigUrl});
    const res = await fetch(auctionConfigUrl);
    if (res.ok) {
      const auctionConfig = await res.json();
      log('retrieved auction config', {auctionConfig});
      return auctionConfig;
    } else {
      log('encountered error in fetching auction config', {
        status: res.statusText,
      });
    }
  };

  /** Executes the single-seller ad auction for the given adUnit config. */
  const runSingleSellerAdAuction = async (message) => {
    const adUnit = getValidatedAdUnit(message);
    if (!adUnit) {
      return;
    }
    const auctionConfig = await getAuctionConfig(adUnit);
    log('starting Protected Audience auction', {auctionConfig});
    const adAuctionResult = await navigator.runAdAuction(auctionConfig);
    if (!adAuctionResult) {
      return log("didn't get a Protected Audience result", {
        auctionConfig,
        adAuctionResult,
      });
    } else {
      log('got Protected Audience result', {auctionConfig, adAuctionResult});
      const {isFencedFrame, size} = adUnit;
      const adElement = isFencedFrame ? 'fencedframe' : 'iframe';
      const adFrame = document.createElement(adElement);
      if (isFencedFrame) {
        adFrame.config = adAuctionResult;
      } else {
        adFrame.src = adAuctionResult;
      }
      [adFrame.width, adFrame.height] = size;
      adFrame.addEventListener('load', () => {
        adFrame.contentWindow.postMessage(
          JSON.stringify({
            auctionId: adUnit.auctionId,
          }),
          '*',
        );
      });
      log('delivering ads in ', {
        adFrame,
        adUnit,
        auctionConfig,
        adAuctionResult,
      });
      document.body.appendChild(adFrame);
    }
  };

  // ****************************************************************
  // MAIN FUNCTION
  // ****************************************************************
  (() => {
    if (!navigator.runAdAuction) {
      return log('stopping becuase Protected Audience is not supported', {});
    }
    // Wait for adUnit object to be post-messaged by ad server tag.
    window.addEventListener('message', runSingleSellerAdAuction);
    log('single-seller waiting for adUnit configs', {});
  })();
})();
