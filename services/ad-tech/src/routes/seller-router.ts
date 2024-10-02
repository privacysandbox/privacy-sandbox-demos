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

import {KeyValueStore} from '../controllers/key-value-store.js';
import {
  HOSTNAME,
  EXTERNAL_PORT,
  TRAVEL_HOST,
  SHOP_HOST,
} from '../lib/constants.js';
import {DSP_HOST, DSP_A_HOST, DSP_B_HOST} from '../lib/constants.js';
import {DSP_ORIGIN, DSP_A_ORIGIN, DSP_B_ORIGIN} from '../lib/constants.js';
import {KNOWN_SHOP_ITEM_LABELS_BY_ID} from '../lib/constants.js';
import {RENDER_URL_SIZE_MACRO} from './buyer-router.js';

export const SellerRouter = express.Router();

/** Intializes scoring signals for key value store. */
const getDefaultScoringSignals = (): string[][] => {
  const knownAds: string[][] = [];
  const dspHosts = [DSP_HOST, DSP_A_HOST, DSP_B_HOST];
  // Ads from Travel advertiser
  for (const dspHost of dspHosts) {
    knownAds.push([
      new URL(
        `https://${dspHost}:${EXTERNAL_PORT}/ads?advertiser=${TRAVEL_HOST}&${RENDER_URL_SIZE_MACRO}`,
      ).toString(),
      JSON.stringify({
        label: 'travel',
      }),
    ]);
  }
  // Ads from Shop advertiser
  for (const [key, value] of Object.entries(KNOWN_SHOP_ITEM_LABELS_BY_ID)) {
    for (const dspHost of dspHosts) {
      knownAds.push([
        new URL(
          `https://${dspHost}:${EXTERNAL_PORT}/ads?advertiser=${SHOP_HOST}&itemId=${key}&${RENDER_URL_SIZE_MACRO}`,
        ).toString(),
        JSON.stringify({
          label: value,
        }),
      ]);
    }
  }
  return knownAds;
};

/** BYOS implementation of seller key value store. */
const trustedScoringSignalsStore = new KeyValueStore(
  getDefaultScoringSignals(),
);

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
    const adType = req.query.adType || 'display';
    const usecase = req.query.usecase || 'default';
    /* If `adType` is `video`, set `resolveToConfig` to `false`. This is because
     * video ads are only supported with iframes. If `resolveToConfig` is set to
     * `true`, `runAdAuction()` returns a `FencedFrameConfig`, which can only be
     * rendered in FencedFrames and not iframes.
     */
    const resolveToConfig = adType !== 'video';
    const auctionConfig = {
      seller: new URL(`https://${HOSTNAME}:${EXTERNAL_PORT}`).toString(),
      decisionLogicURL: new URL(
        `https://${HOSTNAME}:${EXTERNAL_PORT}/js/ssp/${usecase}/auction-decision-logic.js`,
      ).toString(),
      trustedScoringSignalsURL: new URL(
        `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/scoring-signal.json`,
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
      sellerCurrency: 'USD',
      resolveToConfig,
    };
    console.log('Returning auction config: ', {auctionConfig});
    res.json(auctionConfig);
  },
);

/** Simplified BYOS implementation for Key-Value Service. */
SellerRouter.get(
  '/scoring-signal.json',
  async (req: Request, res: Response) => {
    // TODO: Partition KV keys by publisher.
    const publisher = req.query.hostname;
    const queryRenderUrls = req.query.renderUrls?.toString().split(',') || [];
    const renderUrlMetadata =
      trustedScoringSignalsStore.getMultiple(queryRenderUrls);
    const queryAdAcomponentRenderUrls =
      req.query.adComponentRenderUrls?.toString().split(',') || [];
    const adComponentRenderUrlMetadata = trustedScoringSignalsStore.getMultiple(
      queryAdAcomponentRenderUrls,
    );
    console.log(
      'KV BYOS querying',
      {queryRenderUrls, queryAdAcomponentRenderUrls},
      'for',
      {publisher},
    );
    const scoringSignals = {
      renderURLs: {...renderUrlMetadata},
      adComponentRenderURLs: {...adComponentRenderUrlMetadata},
    };
    res.setHeader('X-Allow-FLEDGE', 'true');
    // res.setHeader('X-fledge-bidding-signals-format-version', '2');
    console.log('Returning trusted scoring signals: ', {scoringSignals});
    res.json(scoringSignals);
  },
);

/** Adds values in query parameters to Key Value Store. */
SellerRouter.get(
  '/set-scoring-signal.json',
  async (req: Request, res: Response) => {
    console.log('Setting scoring signals', {...req.query});
    for (const key of Object.keys(req.query)) {
      trustedScoringSignalsStore.set(key, req.query[key]?.toString());
    }
    res.sendStatus(200);
  },
);

/** Rewrites the default values in the key value store. */
SellerRouter.get(
  '/reset-scoring-signal.json',
  async (req: Request, res: Response) => {
    console.log('');
    trustedScoringSignalsStore.rewriteDefaults();
    res.status(200).send(`Rewrote default real-time signals: ${HOSTNAME}`);
  },
);
