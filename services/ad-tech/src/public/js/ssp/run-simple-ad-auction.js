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
 *   This script is loaded on the publisher page to run a single-seller
 *   Protected Audience auction.
 *
 * What does this script do:
 *   This script reads the ad unit configurations set by the publisher and
 *   fetches the auction configurations from its server to directly execute the
 *   Protected Audience without a contextual auction.
 */
const runSimpleAdAuction = async () => {
  /** Domain of the current script. */
  const CURR_HOSTNAME = '<%= HOSTNAME %>';
  // ****************************************************************
  // HELPER FUNCTIONS
  // ****************************************************************
  /** Logs to console. */
  const log = (message, context) => {
    console.log(
      '[PSDemo] Seller',
      CURR_HOSTNAME,
      'PAAPI auction runner',
      message,
      {context},
    );
  };

  /** Makes a request to the server to retrieve an auction config. */
  const getAuctionConfig = async (adUnit) => {
    const auctionConfigUrl = new URL(
      `https://${CURR_HOSTNAME}/ssp/auction-config.json`,
    );
    // Copy over ad unit parameters
    for (const [key, value] of Object.entries(adUnit)) {
      auctionConfigUrl.searchParams.append(key, value);
    }
    // Copy query params from current context.
    const currentUrl = new URL(location.href);
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

  // ****************************************************************
  // PROTECTED AUDIENCE : RUN AD AUCTION
  // ****************************************************************
  if (!navigator.runAdAuction) {
    return log('stopping becuase Protected Audience is not supported', {});
  }
  const [adUnit] = window.PSDemo.PAGE_ADS_CONFIG.adUnits;
  const auctionConfig = await getAuctionConfig(adUnit);
  log('starting Protected Audience auction', {auctionConfig});
  const adAuctionResult = await navigator.runAdAuction(auctionConfig);
  if (!adAuctionResult) {
    log("didn't get a Protected Audience result", {
      auctionConfig,
      adAuctionResult,
    });
    document.getElementById(adUnit.divId).innerText = 'No eligible ads';
  } else {
    log('got Protected Audience result', {auctionConfig, adAuctionResult});
    const adFrame = document.createElement('fencedframe');
    adFrame.config = adAuctionResult;
    [adFrame.width, adFrame.height] = adUnit.size;
    log('delivering ads in ', {
      adFrame,
      adUnit,
      auctionConfig,
      adAuctionResult,
    });
    document.getElementById(adUnit.divId).appendChild(adFrame);
  }
};

// Finally, execute the above function when DOM is loaded or execute
// immediately if DOM is already loaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runSimpleAdAuction);
} else {
  runSimpleAdAuction();
}
