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
  BUYER_HOSTS_TO_INTEGRATE_BY_SELLER_HOST,
  CURRENT_ORIGIN,
  EXTERNAL_PORT,
  HOSTNAME,
} from './constants.js';

/** Assembles and returns an auction configuration. */
export const constructAuctionConfig = (context: {
  useCase?: string;
  isFencedFrame?: string;
  auctionSignals?: {[key: string]: string};
  sellerSignals?: {[key: string]: any};
  perBuyerSignals?: {[key: string]: {[key: string]: string}};
}) => {
  const buyerHosts = BUYER_HOSTS_TO_INTEGRATE_BY_SELLER_HOST.get(HOSTNAME!)!;
  const buyerOrigins = buyerHosts.map((buyerHost) => {
    return new URL(`https://${buyerHost}:${EXTERNAL_PORT}`).toString();
  });
  const useCase = context.useCase || 'default';
  const {isFencedFrame} = context;
  // Opt-in all buyers to real-time monitoring reports.
  const perBuyerRealTimeReportingConfig: {[key: string]: {}} = {};
  for (const buyerOrigin of buyerOrigins) {
    perBuyerRealTimeReportingConfig[buyerOrigin] = {
      type: 'default-local-reporting',
    };
  }
  const auctionConfig = {
    seller: CURRENT_ORIGIN,
    decisionLogicURL: new URL(
      `https://${HOSTNAME}:${EXTERNAL_PORT}/js/ssp/${useCase}/auction-decision-logic.js`,
    ).toString(),
    trustedScoringSignalsURL: new URL(
      `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/realtime-signals/scoring-signal.json`,
    ).toString(),
    /*
     * TODO: Consider implementing direct from seller signals.
     *   directFromSellerSignals: new URL(
     *     `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/direct-signal.json`,
     *   ),
     */
    interestGroupBuyers: buyerOrigins,
    auctionSignals: {isFencedFrame, ...context.auctionSignals},
    sellerSignals: {...context.sellerSignals},
    perBuyerSignals: {...context.perBuyerSignals},
    perBuyerRealTimeReportingConfig,
    // Opt-in self for real-time monitoring reports.
    sellerRealTimeReportingConfig: {type: 'default-local-reporting'},
    // Needed for ad size macro replacements.
    requestedSize: {'width': '300px', 'height': '250px'},
    sellerCurrency: 'USD',
    // Whether runAdAuction should return a FencedFrameConfig or not.
    resolveToConfig: 'true' === isFencedFrame ? true : false,
    deprecatedRenderURLReplacements: {
      // This is for the video ads use-case where the DSP is expected to have
      // included the SSP_VAST macro in the render URL.
      '${SSP_VAST}': new URL(
        `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/vast.xml`,
      ).toString(),
      '%%SSP_VAST%%': new URL(
        `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/vast.xml`,
      ).toString(),
    },
  };
  console.log('Constructing auction config', {context, auctionConfig});
  return auctionConfig;
};
