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
import {CURRENT_ORIGIN, HOSTNAME} from '../lib/constants.js';
import {EXTERNAL_PORT, SHOP_HOST, TRAVEL_HOST} from '../lib/constants.js';
import {DSP_HOST, DSP_A_HOST, DSP_B_HOST} from '../lib/constants.js';
import {KNOWN_SHOP_ITEM_LABELS_BY_ID} from '../lib/constants.js';
import {RENDER_URL_SIZE_MACRO} from '../lib/interest-group-helper.js';
import {ContextualAuctionRunner} from '../controllers/contextual-auction-runner.js';
import {ADVERTISER} from '../lib/arapi.js';

export const SellerRouter = express.Router();
const DSP_HOSTS = [DSP_HOST!, DSP_A_HOST!, DSP_B_HOST!];
const DSP_ORIGINS = DSP_HOSTS.map((dspHost) => {
  return new URL(`https://${dspHost}:${EXTERNAL_PORT}`).toString();
});

// ********************************************************
// BYOS implementation of Key - Value store
// ********************************************************
/** Intializes scoring signals for key value store. */
const getDefaultScoringSignals = (): string[][] => {
  const knownAds: string[][] = [];
  // Ads from Travel advertiser
  for (const dspHost of DSP_HOSTS) {
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
    for (const dspHost of DSP_HOSTS) {
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

// ********************************************************
// SSP helper functions
// ********************************************************
const getPerBuyerSignals = (
  buyerSignals: {[key: string]: {[key: string]: string}} = {},
): {[key: string]: {[key: string]: string}} => {
  const perBuyerSignals: {[key: string]: {[key: string]: string}} = {};
  for (const dspOrigin of DSP_ORIGINS) {
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
      `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/scoring-signal.json`,
    ).toString(),
    /*
     TODO: Consider implementing direct from seller signals.
     directFromSellerSignals: new URL(
       `https://${HOSTNAME}:${EXTERNAL_PORT}/ssp/direct-signal.json`,
     ),
     */
    interestGroupBuyers: DSP_ORIGINS,
    auctionSignals: {
      'auction_signals': 'auction_signals',
      isFencedFrame,
      ...auctionSignals, // Copy signals from request query.
    },
    sellerSignals: {
      'seller_signals': 'seller_signals',
    },
    perBuyerSignals: getPerBuyerSignals(buyerSignals),
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

// ************************************************************************
// HTTP handlers
// ************************************************************************
// TODO: Rename to run-single-seller-ad-auction after unified branch is merged.
/** Iframe document used as context to run single-seller PAAPI auction. */
SellerRouter.get(
  '/run-ad-auction.html',
  async (req: Request, res: Response) => {
    res.render('ssp/run-ad-auction');
  },
);

/** Iframe document used as context to run multi-seller PAAPI auction. */
SellerRouter.get(
  '/run-sequential-ad-auction.html',
  async (req: Request, res: Response) => {
    res.render('ssp/run-sequential-ad-auction');
  },
);

/** Returns the winning contextual ad and auction config for PAAPI. */
SellerRouter.get('/contextual-bid', async (req: Request, res: Response) => {
  // Collect signals from request context.
  const signals: {[key: string]: string} = {};
  for (const key of Object.keys(req.query)) {
    signals[key] = req.query[key]?.toString() || '';
  }
  if (!signals['auctionId']) {
    // Add an auction ID if missing in request.
    // E.g. of auction ID: 'SSP-32e7f33f-a7da-4ea9-af01-63e17da48ff8'
    signals['auctionId'] = `SSP-${crypto.randomUUID()}`;
  }
  // Run server-side contextual auction.
  const contextualBids = await ContextualAuctionRunner.getContextualBids(
    /* bidderHosts= */ DSP_HOSTS,
    /* signals= */ signals,
  );
  const [winningContextualBid] = contextualBids.sort(
    (bid1, bid2) => Number(bid2.bid!) - Number(bid1.bid!),
  );
  console.log('Winning contextual bid', {winningContextualBid});
  // Collect buyer signals from contextual bids.
  const buyerSignals: {[key: string]: any} = {};
  for (const contextualBid of contextualBids) {
    if (contextualBid.buyerSignals) {
      buyerSignals[contextualBid.bidder!] = contextualBid.buyerSignals;
    }
  }
  const response = {
    bidder: CURRENT_ORIGIN,
    auctionId: signals['auctionId'],
    bid: winningContextualBid.bid,
    renderURL: winningContextualBid.renderURL,
    componentAuctionConfig: constructAuctionConfig({
      useCase: req.query.useCase?.toString(),
      isFencedFrame: req.query.isFencedFrame?.toString(),
      auctionSignals: signals,
      buyerSignals,
    }),
  };
  console.log('Responding to contextual bid request', {response});
  res.json(response);
});

/** Returns the PAAPI auction config. */
SellerRouter.get(
  '/auction-config.json',
  async (req: Request, res: Response) => {
    const signals: {[key: string]: string} = {};
    for (const key of Object.keys(req.query)) {
      signals[key] = req.query[key]?.toString() || '';
    }
    const auctionConfig = constructAuctionConfig({
      useCase: req.query.useCase?.toString(),
      isFencedFrame: req.query.isFencedFrame?.toString(),
      auctionSignals: signals,
    });
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

/** Returns the finalized VAST XML to deliver video ads with PAAPI. */
SellerRouter.get('/vast.xml', async (req: Request, res: Response) => {
  const dspVast = req.query.dspVast?.toString();
  const auctionId = req.query.auctionId?.toString();
  const advertiser = req.query.advertiser?.toString() || HOSTNAME;
  res.type('application/xml').render('ssp/vast-preroll', {
    HOSTNAME,
    EXTERNAL_PORT,
    AUCTION_ID: auctionId,
    DSP_VAST: dspVast ? decodeURIComponent(dspVast) : '',
    ADVERTISER_HOST: advertiser,
  });
});

// ************************************************************************
// HTTP endpoints used for demonstration purposes
// ************************************************************************
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
