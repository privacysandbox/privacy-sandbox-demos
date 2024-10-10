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
  // ****************************************************************
  // CONSTANTS
  // ****************************************************************
  /** Local storage item containing configurations for this library. */
  const LOCAL_STORAGE_HEADER_BIDDING_CONFIG = 'HEADER_BIDDING_LIB_CONFIG';
  /** Local storage item containing configurations for ad units on page. */
  const LOCAL_STORAGE_PAGE_ADS_CONFIG = 'PAGE_ADS_CONFIG';
  /** Local storage item to store the winning header bid. */
  const LOCAL_STORAGE_WINNING_HEADER_BID = 'WINNING_HEADER_BID';
  /** Local storage item to store component auction configs. */
  const LOCAL_STORAGE_AUCTION_CONFIGS = 'AUCTION_CONFIGS';
  /** Local storage item to indicate overall status of header bidding. */
  const LOCAL_STORAGE_HEADER_BIDDING_STATUS = 'HEADER_BIDDING_STATUS';
  /** Text indicating pending status. */
  const HEADER_BIDDING_STATUS_PENDING = 'PENDING';
  /** Text indicating completed status. */
  const HEADER_BIDDING_STATUS_COMPLETE = 'COMPLETE';
  /** Timeout in milliseconds for the on-page contextual auction. */
  const CONTEXTUAL_AUCTION_TIMEOUT_MS = 5000;

  // ****************************************************************
  // HELPER FUNCTIONS
  // ****************************************************************
  /** Builds and returns the various bid request URLs. */
  const getBidRequestUrlsWithContext = (sellers, adUnits) => {
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

  /** Runs and returns contextual bid responses. */
  const getAllBidResponses = async (sellers, adUnits) => {
    const bidRequestUrls = getBidRequestUrlsWithContext(sellers, adUnits);
    const bidResponsePromises = bidRequestUrls.map(async (bidRequestUrl) => {
      console.log('[PSDemo] Making header bid request', {bidRequestUrl});
      const response = await fetch(bidRequestUrl);
      if (response.ok) {
        const bidResponse = await response.json();
        console.log('[PSDemo] Received header bid response', {bidResponse});
        return bidResponse;
      } else {
        console.log('[PSDemo] Error in contextual bid response', {
          statusText: response.statusText,
          bidRequestUrl,
        });
        return {bid: 0.0};
      }
    });
    // Use Promise.race to implement the timeout.
    const bidResponses = await Promise.race([
      (await Promise.allSettled(bidResponsePromises))
        .filter((p) => p.status === 'fulfilled')
        .map((p) => p.value),
      new Promise((resolve) =>
        setTimeout(() => resolve([]), CONTEXTUAL_AUCTION_TIMEOUT_MS),
      ),
    ]);
    return bidResponses;
  };

  /** Sorts bid responses by auction ID and extracts auction configs. */
  const getBidResponsesAndAuctionConfigs = (auctionIds, bidResponses) => {
    const bidResponsesByAuctionId = {};
    const auctionConfigsByAuctionId = {};
    for (const bidResponse of bidResponses) {
      if (!auctionIds.includes(bidResponse.auctionId)) {
        console.log('Ignoring bid response for unexpected auctionId', {
          auctionIds,
          bidResponse,
        });
        continue;
      }
      const {auctionId, componentAuctionConfig} = bidResponse;
      if (!bidResponsesByAuctionId.hasOwnProperty(auctionId)) {
        bidResponsesByAuctionId[auctionId] = [];
      }
      bidResponsesByAuctionId[auctionId].push(bidResponse);
      if (componentAuctionConfig) {
        if (!auctionConfigsByAuctionId.hasOwnProperty(auctionId)) {
          auctionConfigsByAuctionId[auctionId] = [];
        }
        auctionConfigsByAuctionId[auctionId].push(componentAuctionConfig);
      }
    }
    return [bidResponsesByAuctionId, auctionConfigsByAuctionId];
  };

  /** Stores the winning bid and auction configs for each auction IDs. */
  const writeWinningBidsAndAuctionConfigsToLocalStorage = (
    auctionIds,
    bidResponsesByAuctionId,
    auctionConfigsByAuctionId,
  ) => {
    for (const auctionId of auctionIds) {
      const bidResponses = bidResponsesByAuctionId[auctionId];
      if (!bidResponses) {
        console.log('[PSDemo] No header bids received', {auctionId});
        continue;
      }
      const [winningBid] = bidResponses.sort(
        (bid1, bid2) => Number(bid2.bid) - Number(bid1.bid),
      );
      const keyForWinningBid = `${LOCAL_STORAGE_WINNING_HEADER_BID}||${auctionId}`;
      localStorage.setItem(
        keyForWinningBid,
        JSON.stringify(winningBid),
      );
      console.log('[PSDemo] Winning header bid written to local storage', {
        auctionId,
        localStorageKey: keyForWinningBid,
        winningBid,
      });
      if (auctionConfigsByAuctionId.hasOwnProperty(auctionId)) {
        const auctionConfigs = auctionConfigsByAuctionId[auctionId];
        const keyForAuctionConfigs = `${LOCAL_STORAGE_AUCTION_CONFIGS}||${auctionId}`;
        localStorage.setItem(
          keyForAuctionConfigs,
          JSON.stringify(auctionConfigs),
        );
        console.log(
          '[PSDemo] Header bidding lib stored auction configs', {
            auctionId,
            localStorageKey: keyForAuctionConfigs,
            auctionConfigs,
        });
      }
    }
  };

  /** Cleans older output configurations from local storage. */
  const resetLocalStorage = () => {
    const allKeys = Object.keys(localStorage);
    const keysToDel = [];
    // Remove keys for old winning header bids.
    keysToDel.push(...allKeys.filter(key => key.startsWith(LOCAL_STORAGE_WINNING_HEADER_BID)));
    // Remove keys for old auction configs.
    keysToDel.push(...allKeys.filter(key => key.startsWith(LOCAL_STORAGE_AUCTION_CONFIGS)));
    console.log('[PSDemo] Removing old header bidding outputs', {keysToDel});
    for (const keyToRemove of keysToDel) {
      localStorage.removeItem(keyToRemove);
    }
  }

  // ****************************************************************
  // MAIN FUNCTION
  // ****************************************************************
  (async () => {
    // Set status to PENDING while header bidding is in progress.
    console.log('[PSDemo] Header bidding in progress',
      {LOCAL_STORAGE_HEADER_BIDDING_STATUS});
    localStorage.setItem(LOCAL_STORAGE_HEADER_BIDDING_STATUS,
      HEADER_BIDDING_STATUS_PENDING);
    resetLocalStorage();
    // Read configurations from local storage.
    const {sellers} = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_HEADER_BIDDING_CONFIG),
    );
    const {adUnits} = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_PAGE_ADS_CONFIG),
    );
    console.log('[PSDemo] Header bidding library initialized', {
      sellers,
      adUnits,
    });
    // Start contextual auction.
    const auctionIds = adUnits.map((adUnit) => adUnit.auctionId);
    const contextualBidResponses = await getAllBidResponses(sellers, adUnits);
    const [bidResponsesByAuctionId, auctionConfigsByAuctionId] =
      getBidResponsesAndAuctionConfigs(auctionIds, contextualBidResponses);
    // Write winning bid and auction configs to local storage.
    writeWinningBidsAndAuctionConfigsToLocalStorage(
      auctionIds,
      bidResponsesByAuctionId,
      auctionConfigsByAuctionId,
    );
    // Set status to COMPLETE.
    localStorage.setItem(LOCAL_STORAGE_HEADER_BIDDING_STATUS,
      HEADER_BIDDING_STATUS_COMPLETE);
    console.log('[PSDemo] Header bidding complete',
      {LOCAL_STORAGE_HEADER_BIDDING_STATUS});
  })();
})();
