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

import express, {Request, Response} from 'express';

import {CURRENT_HOST, EXTERNAL_PORT} from '../lib/constants.js';
import {DSP_HOST, DSP_A_HOST, DSP_B_HOST} from '../lib/constants.js';

export const SellerRouter = express.Router();

const DSP_ORIGIN = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}`).toString();
const DSP_A_ORIGIN = new URL(
  `https://${DSP_A_HOST}:${EXTERNAL_PORT}`,
).toString();
const DSP_B_ORIGIN = new URL(
  `https://${DSP_B_HOST}:${EXTERNAL_PORT}`,
).toString();

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** Iframe document used as context to run PAAPI auction. */
SellerRouter.get(
  '/run-ad-auction.html',
  async (req: Request, res: Response) => {
    res.render('ssp/run-ad-auction');
  },
);

/** Returns the PAAPI auction config. */
SellerRouter.get(
  '/auction-config.json',
  async (req: Request, res: Response) => {
    const {adType} = req.query || 'display';
    const usecase = req.query.usecase || 'default';
    /* If `adType` is `video`, set `resolveToConfig` to `false`. This is because
     * video ads are only supported with iframes. If `resolveToConfig` is set to
     * `true`, `runAdAuction()` returns a `FencedFrameConfig`, which can only be
     * rendered in FencedFrames and not iframes.
     */
    const resolveToConfig = adType !== 'video';
    const auctionConfig = {
      seller: new URL(`https://${CURRENT_HOST}:${EXTERNAL_PORT}`).toString(),
      decisionLogicURL: new URL(
        `https://${CURRENT_HOST}:${EXTERNAL_PORT}/js/ssp/${usecase}/auction-decision-logic.js`,
      ).toString(),
      interestGroupBuyers: [DSP_ORIGIN, DSP_A_ORIGIN, DSP_B_ORIGIN],
      auctionSignals: {
        'auction_signals': 'auction_signals',
        adType,
        ...req.query, // Copy signals from request query.
      },
      sellerSignals: {
        'seller_signals': 'seller_signals',
      },
      perBuyerSignals: {
        [DSP_ORIGIN]: {'per_buyer_signals': 'per_buyer_signals'},
        [DSP_A_ORIGIN]: {'per_buyer_signals': 'per_buyer_signals'},
        [DSP_B_ORIGIN]: {'per_buyer_signals': 'per_buyer_signals'},
      },
      // Needed for size macro replacements.
      requestedSize: {'width': '300px', 'height': '250px'},
      resolveToConfig,
    };
    console.log('Returning auction config: ', {auctionConfig});
    res.json(auctionConfig);
  },
);
