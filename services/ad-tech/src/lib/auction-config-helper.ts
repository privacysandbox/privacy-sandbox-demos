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
  CURRENT_ORIGIN,
  DSP_ORIGINS_TO_INTEGRATE,
  EXTERNAL_PORT,
  HOSTNAME,
} from './constants.js';

export const AuctionConfigHelper = (() => {
  /** Filters all buyer signals to only include DSPs to integrate. */
  const getFilteredBuyerSignals = (
    buyerSignals: {[key: string]: {[key: string]: string}} = {},
  ): {[key: string]: {[key: string]: string}} => {
    const perBuyerSignals: {[key: string]: {[key: string]: string}} = {};
    for (const dspOrigin of DSP_ORIGINS_TO_INTEGRATE) {
      if (buyerSignals[dspOrigin]) {
        perBuyerSignals[dspOrigin] = buyerSignals[dspOrigin];
      } else {
        perBuyerSignals[dspOrigin] = {
          'per_buyer_signals': 'per_buyer_signals',
        };
      }
    }
    return perBuyerSignals;
  };

  /** Assembles and returns an auction configuration. */
  const constructAuctionConfig = (context: {
    useCase?: string;
    isFencedFrame?: string;
    auctionSignals?: {[key: string]: string};
    buyerSignals?: {[key: string]: {[key: string]: string}};
  }) => {
    const useCase = context.useCase || 'default';
    const {isFencedFrame, auctionSignals, buyerSignals} = context;
    const resolveToConfig = 'true' === isFencedFrame ? true : false;
    /* If `adType` is `video`, set `resolveToConfig` to `false`. This is because
     * video ads are only supported with iframes. If `resolveToConfig` is set to
     * `true`, `runAdAuction()` returns a `FencedFrameConfig`, which can only be
     * rendered in FencedFrames and not iframes.
     */
    console.log('Constructing auction config', {
      useCase,
      isFencedFrame,
      auctionSignals,
      buyerSignals,
      resolveToConfig,
    });
    const auctionConfig = {
      seller: CURRENT_ORIGIN,
      decisionLogicURL: new URL(
        `https://${HOSTNAME}:${EXTERNAL_PORT}/js/ssp/${useCase}/auction-decision-logic.js`,
      ).toString(),
      trustedScoringSignalsURL: new URL(
        `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/realtime-signals/scoring-signal.json`,
      ).toString(),
      /*
       TODO: Consider implementing direct from seller signals.
       directFromSellerSignals: new URL(
         `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/direct-signal.json`,
       ),
       */
      interestGroupBuyers: DSP_ORIGINS_TO_INTEGRATE,
      auctionSignals: {
        'auction_signals': 'auction_signals',
        isFencedFrame,
        ...auctionSignals, // Copy signals from request query.
      },
      sellerSignals: {
        'seller_signals': 'seller_signals',
      },
      perBuyerSignals: getFilteredBuyerSignals(buyerSignals),
      // Needed for size macro replacements.
      requestedSize: {'width': '300px', 'height': '250px'},
      sellerCurrency: 'USD',
      resolveToConfig,
      // deprecatedReplaceInURN: {
      //   '%%SSP_VAST_URI%%': `https://${HOSTNAME}:${EXTERNAL_PORT}/vast/preroll.xml`,
      // }
    };
    return auctionConfig;
  };

  // Exported members of AuctionConfigHelper.
  return {
    constructAuctionConfig,
  };
})();
