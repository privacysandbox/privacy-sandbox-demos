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
 *   This script is loaded on publisher sites for header-bidding support.
 *
 * What does this script do:
 *   This script reads local storage for configurations stored by publishers
 *   regarding the sellers to include in header bidding and the ad units
 *   available on the current page.
 *   This is structured as an Immediately Invoked Function Expression, with the
 *   constants and helper functions at the top, and the main function at the
 *   bottom.
 */

(() => {
  /** Local storage item containing configurations for this library. */
  const LOCAL_STORAGE_HEADER_BIDDING_CONFIG = 'HEADER_BIDDING_LIB_CONFIG';
  /** Local storage item containing configurations for ad units on page. */
  const LOCAL_STORAGE_PAGE_ADS_CONFIG = 'PAGE_ADS_CONFIG';
  /** Local storage item to store the winning header bid. */
  const LOCAL_STORAGE_WINNING_HEADER_BID = 'WINNING_HEADER_BID';
  /** Timeout in milliseconds for the on-page contextual auction. */
  const CONTEXTUAL_AUCTION_TIMEOUT_MS = 5000;

  /** Builds and returns the various bid request URLs. */
  const getContextualBidRequestUrls = (sellers, adUnits) => {
    const bidRequestUrls = [];
    for (const adUnit of adUnits) {
      const bidRequestQuery = Object.entries(adUnit)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      const auctionId = adUnit.auctionId || `HB-${crypto.randomUUID()}`;
      if (!adUnit.auctionId) {
        adUnit.auctionId = auctionId;
      }
      for (const seller of sellers) {
        const bidRequest = new URL(seller);
        bidRequest.pathname = '/ssp/contextual-bid';
        bidRequestUrls.push(`${bidRequest.toString()}?${bidRequestQuery}`);
      }
    }
    return bidRequestUrls;
  };

  /** Returns a contextual bid response for the given URL. */
  const getContextualBidResponse = async (bidRequestUrl) => {
    console.log('[PSDemo] Header bidding lib making contextual bid request', {
      bidRequestUrl,
    });
    const response = await fetch(bidRequestUrl);
    if (response.ok) {
      const bidResponse = await response.json();
      console.log('[PSDemo] Header bidding lib received contextual bid', {
        bidRequestUrl,
        bidResponse,
      });
      if (bidResponse.componentAuctionConfig) {
        const key = `AUCTIONCONFIG-${bidResponse.bidder}-${bidResponse.auctionId}`;
        console.log('[PSDemo] Header bidding lib storing auction config', {
          key,
          auctionConfig: bidResponse.componentAuctionConfig,
        });
        localStorage.setItem(
          key,
          JSON.stringify(bidResponse.componentAuctionConfig),
        );
      }
      return bidResponse;
    } else {
      console.log('[PSDemo] Error in contextual bid response', {
        statusText: response.statusText,
        bidRequestUrl,
      });
      return {
        bidder,
        bid: 0.0,
      };
    }
  };

  /** Runs and returns contextual bid responses. */
  const runContextualAuction = async (sellers, adUnits) => {
    const bidRequestUrls = getContextualBidRequestUrls(sellers, adUnits);
    const bidResponsePromises = bidRequestUrls.map((bidRequestUrl) =>
      getContextualBidResponse(bidRequestUrl),
    );
    const bidResponses = await Promise.race([
      Promise.allSettled(bidResponsePromises),
      new Promise((resolve) =>
        setTimeout(() => resolve([]), CONTEXTUAL_AUCTION_TIMEOUT_MS),
      ),
    ]);
    return bidResponses;
  };

  /** Main function that initializes the header bidding library. */
  (async () => {
    try {
      console.log('[PSDemo] Initializing header bidding library.');
      /** Read library configuration from local storage. */
      const {sellers} = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_HEADER_BIDDING_CONFIG),
      );
      /** Read configurations for ad units on page. */
      const {adUnits} = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_PAGE_ADS_CONFIG),
      );
      /** Start contextual auction. */
      console.log('[PSDemo] Header bidding library initialized.');
      const contextualBids = await runContextualAuction(sellers, adUnits);
      const [winningContextualBid] = contextualBids.sort(
        (bid1, bid2) => bid1.bid - bid2.bid,
      );
      localStorage.setItem(
        LOCAL_STORAGE_WINNING_HEADER_BID,
        JSON.stringify(winningContextualBid),
      );
    } catch (err) {
      console.log('[PSDemo] Header bidding library could not be initialized.', {
        err,
      });
      throw err;
    }
  })();
})();
