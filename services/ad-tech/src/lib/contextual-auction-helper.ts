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
import {
  DSP_A_HOST,
  DSP_A_URI,
  DSP_B_HOST,
  DSP_B_URI,
  DSP_HOST,
  DSP_URI,
} from './constants.js';

/**
 * Generalized contents of a contextual bid response.
 * Where a contextual bid request / response references everything that is not
 * originating from Protected Audience. This interface is shared between the
 * contextual bid responses from both the buyer and the seller endpoints.
 */
export interface ContextualBidResponse {
  // FIELDS GENERALLY PRESENT ON ALL RESPONSES THAT AREN'T ERRORS:
  /**
   * Hostname of the bidder that is responding to the HTTP request, but need
   * not be the ad buyer placing the bid.
   */
  bidderHost?: string;
  /**
   * Origin of the bidder that is responding to the HTTP request, but need not
   * be the ad buyer placing the bid.
   */
  bidderOrigin?: string;
  /** Unique auction ID for the current request / response context. */
  auctionId?: string;
  /** Bid CPM in USD with 2 decimal digits. */
  bid?: string;
  /** URL of the ad creative. */
  renderURL?: string;

  // FIELDS THAT ARE ONLY FOUND ON SPECIFIC RESPONSES AS NOTED BELOW
  /**
   * Included in buyer's server-to-server response to seller's request.
   * Buyer signals to include in component auction config. The buyer may choose
   * to not include additional signals or not participate in the Protected
   * Audience auction altogether as well.
   */
  buyerSignals?: any;
  /**
   * Included in seller's response to ad server's request from the browser.
   * Hostname of the ultimate ad buyer placing the bid while bidderHost is set
   * to the ad seller responding to the bid request.
   */
  buyerHost?: string;
  /**
   * Included in seller's response to ad server's request from the browser.
   * Origin of the ultimate ad buyer placing the bid while bidderHost is set to
   * the ad seller responding to the bid request.
   */
  buyerOrigin?: string;
  /**
   * Included in seller's response to ad server's request from the browser.
   * Component auction configuration to include in the overall Protected
   * Audience auction configuration.
   */
  componentAuctionConfig?: any;
}

/** Timeout of 5 seconds for before the ad seller responds to the request. */
export const CONTEXTUAL_AUCTION_TIMEOUT_MS = 5000;

/** Returns the contextual bidding URL for a given origin. */
const getContextualBidUrl = (origin: string) => {
  const contextualBidUrl = new URL(origin);
  contextualBidUrl.pathname = '/dsp/contextual-bid';
  return contextualBidUrl.toString();
};

/**
 * We use an environment variable to determine the contextual bidding endpoint
 * because the origins vary across the execution environments -- local, dev,
 * and prod deployments. For local deployments, we rely on Docker mesh for
 * networking, routing requests to: http://...dsp.dev:8080/, while in dev and
 * prod environments, these need to be plain HTTPS requests made to the public
 * endpoint: https://...dsp.dev:443/
 */
/** Map of ad buyer contextual bidding URLs indexed by hostname. */
export const CONTEXTUAL_ENDPOINT_BY_BUYER_HOST = new Map([
  [DSP_HOST!, getContextualBidUrl(DSP_URI!)],
  [DSP_A_HOST!, getContextualBidUrl(DSP_A_URI!)],
  [DSP_B_HOST!, getContextualBidUrl(DSP_B_URI!)],
]);

// ****************************************************************************
// EXPORTED FUNCTIONS
// ****************************************************************************
/**
 * Executes a contextual auction and returns all the contextual bid responses.
 * The invoker is assumed to be on the sell-side, with the specified bidders
 * on the buy-side. As such, the contextual bid requests are made to the
 * `/dsp/contextual-bid` path.
 */
export async function getContextualBids(
  bidderHosts: string[] = [],
  signals: {[key: string]: string} = {},
): Promise<ContextualBidResponse[]> {
  console.log('Starting contextual auction', {bidderHosts, signals});
  const bidQuery = Object.entries(signals)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const bidUrls = bidderHosts.map((host) => {
    const contextualEndpoint = CONTEXTUAL_ENDPOINT_BY_BUYER_HOST.get(host);
    return `${contextualEndpoint}?${bidQuery}`;
  });
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
  // Use Promise.race to implement a timeout for the contextual auction.
  const bidResponses = await Promise.race([
    (await Promise.allSettled(bidResponsePromises))
      .filter((p) => p.status === 'fulfilled')
      .map((p) => p.value),
    new Promise<ContextualBidResponse[]>((resolve) =>
      setTimeout(() => resolve([]), CONTEXTUAL_AUCTION_TIMEOUT_MS),
    ),
  ]);
  return bidResponses;
}
