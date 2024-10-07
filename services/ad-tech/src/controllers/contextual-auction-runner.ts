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
import {EXTERNAL_PORT, PORT} from '../lib/constants.js';

export const CONTEXTUAL_AUCTION_TIMEOUT_MS = 5000;

/**
 * Static controller to gather contextual bid responses from other ad-techs.
 *
 * This is structured as an immediately invoked function expression (IIFE).
 * This exports itself as `ContextualAuctionRunner` with one exported member:
 * `getContextualBids()`. This is used from ad-tech routers to execute a
 * server-side contextual auction.
 *
 * The invoker is assumed to be on the sell-side, with the specified bidders
 * on the buy-side. As such, the contextual bid requests are made to the
 * `/dsp/contextual-bid` path.
 */
export const ContextualAuctionRunner = (() => {
  /** Helper function to construct contextual bid URLs. */
  const getBidUrlByBidder = (
    bidderHosts: string[],
    signals: {[key: string]: string},
  ) => {
    // Convert signals into request query parameters.
    const bidQuery = Object.entries(signals)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    // Assemble DSP contextual bidding endpoints.
    const bidUrlByBidder = new Map<string, string>();
    for (const bidderHost of bidderHosts) {
      bidUrlByBidder.set(
        /* bidder= */ new URL(
          `https://${bidderHost}:${EXTERNAL_PORT}/`,
        ).toString(),
        /* contextualBidUrl= */ new URL(
          `http://${bidderHost}:${PORT}/dsp/contextual-bid?${bidQuery}`,
        ).toString(),
      );
    }
    return bidUrlByBidder;
  };

  /** Returns contextual bid response for the given URL. */
  const getContextualBidResponse = async (bidder: string, bidUrl: string) => {
    console.log('Making contextual bid request', {bidUrl});
    const response = await fetch(bidUrl);
    if (!response.ok) {
      console.log('Error in contextual bid response', {
        bidUrl,
        statusText: response.statusText,
      });
      return {
        bidder,
        bid: 0.0,
      };
    }
    const bidResponse = await response.json();
    console.log('Received bid response from DSP', {bidResponse});
    if (!bidResponse.bidder) {
      // Set bidder if missing.
      bidResponse.bidder = bidder;
    }
    return bidResponse;
  };

  /** Executes a contextual auction and returns the winning bid. */
  async function getContextualBids(
    bidderHosts: string[] = [],
    signals: {[key: string]: string} = {},
  ) {
    console.log('Starting contextual auction', {signals});
    const bidUrlByBidder = getBidUrlByBidder(bidderHosts, signals);
    const bidResponsePromises = [...bidUrlByBidder.entries()].map(
      async ([bidder, contextualBidUrl]) =>
        getContextualBidResponse(bidder, contextualBidUrl),
    );
    const bidResponses = await Promise.race([
      Promise.allSettled(bidResponsePromises),
      new Promise((resolve) =>
        setTimeout(() => resolve([]), CONTEXTUAL_AUCTION_TIMEOUT_MS),
      ),
    ]);
    return bidResponses;
  }

  /** Exported members of ContextualAuctionRunner. */
  return {
    getContextualBids,
  };
})();
