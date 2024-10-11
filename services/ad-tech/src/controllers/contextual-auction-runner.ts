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

/** Generalized contents of a contextual bid response. */
export interface ContextualBidResponse {
  bidder?: string;
  auctionId?: string;
  bid?: string;
  renderURL?: string;
  buyerSignals?: any;
}

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
  const getContextualBidUrls = (
    bidderHosts: string[],
    signals: {[key: string]: string},
  ): string[] => {
    // Convert signals into request query parameters.
    const bidQuery = Object.entries(signals)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return bidderHosts.map((bidderHost) =>
      new URL(
        `http://${bidderHost}:${PORT}/dsp/contextual-bid?${bidQuery}`,
      ).toString(),
    );
  };

  /** Executes a contextual auction and returns the winning bid. */
  async function getContextualBids(
    bidderHosts: string[] = [],
    signals: {[key: string]: string} = {},
  ): Promise<ContextualBidResponse[]> {
    console.log('Starting contextual auction', {bidderHosts, signals});
    const bidUrls = getContextualBidUrls(bidderHosts, signals);
    const bidResponsePromises = bidUrls.map(async (bidUrl) => {
      console.log('Making contextual bid request', {bidUrl});
      const response = await fetch(bidUrl);
      if (response.ok) {
        const bidResponse = await response.json();
        console.log('Received contextual bid response', {bidResponse});
        return bidResponse;
      } else {
        console.log('Error in contextual bid response', {response});
        return {bid: '0.0'};
      }
    });
    const bidResponses = await Promise.race([
      (await Promise.allSettled(bidResponsePromises))
        .filter((p) => p.status == 'fulfilled')
        .map((p) => p.value),
      new Promise<ContextualBidResponse[]>((resolve) =>
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
