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
  CURRENT_ORIGIN,
  EXTERNAL_PORT,
  HOSTNAME,
  SSP_HOST,
  SSP_A_HOST,
  SSP_B_HOST,
} from '../lib/constants.js';
import {getTemplateVariables} from '../lib/template-utils.js';
import {InterestGroupHelper} from '../lib/interest-group-helper.js';

export const BuyerRouter = express.Router();
/** Name of the contextual advertiser. */
export const ADVERTISER_CONTEXTUAL = 'Context Next inc.';
/** SSPs to integrate with. */
const SSP_HOSTS = [SSP_HOST!, SSP_A_HOST!, SSP_B_HOST!];

// ************************************************************************
// BYOS implementation of Key - Value store
// ************************************************************************
const trustedBiddingSignalStore = new KeyValueStore(
  /* defaultValues= */ [
    ['isActive', 'true'],
    ['minBid', '3.5'],
    ['maxBid', '4.5'],
    ['multiplier', '1.1'],
  ],
);

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** Iframe document used as context to join interest group. */
BuyerRouter.get(
  '/dsp-advertiser-iframe.html',
  async (req: Request, res: Response) => {
    res.render(
      'dsp/dsp-advertiser-iframe',
      getTemplateVariables('Join Ad Interest Group'),
    );
  },
);

/** Places a bid for the contextual auction. */
BuyerRouter.get('/contextual-bid', async (req: Request, res: Response) => {
  const bid = InterestGroupHelper.getBidPrice();
  // Generate a new auction ID if missing in request.
  const auctionId = req.query.auctionId || `DSP-${crypto.randomUUID()}`;
  // Assemble render URL query parameters.
  const renderUrlQuery = `advertiser=${ADVERTISER_CONTEXTUAL}&auctionId=${auctionId}`;
  const renderURL = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/ads?${renderUrlQuery}`,
  ).toString();
  /** Return contextual bid with buyer signals. */
  res.json({
    bidder: CURRENT_ORIGIN,
    auctionId,
    bid,
    renderURL,
    buyerSignals: {
      contextualBid: bid,
      contextualRenderURL: renderURL,
      contextualAdvertiser: ADVERTISER_CONTEXTUAL,
      ...req.query,
    },
  });
});

/** Returns the interest group to join on advertiser page. */
BuyerRouter.get('/interest-group.json', async (req: Request, res: Response) => {
  // Set advertiser from query or fallback to current host.
  const advertiser = req.query.advertiser || HOSTNAME;
  // Set usecase if included in query, else 'default'.
  const usecase = ((usecase) => {
    if (!usecase) {
      return 'default';
    }
    return Array.isArray(usecase) ? usecase[0] : usecase;
  })(req.query.usecase);
  // Add to keys if query includes tbsKey=<key>.
  const trustedBiddingSignalsKeys = ((keys) => {
    const defaultKeys = ['isActive', 'minBid', 'maxBid', 'multiplier'];
    if (!keys) {
      return defaultKeys;
    } else if (Array.isArray(keys)) {
      return [...defaultKeys, ...keys];
    } else {
      return [...defaultKeys, keys];
    }
  })(req.query.tbsKey);
  console.log('Returning IG JSON: ', req.query);
  res.json({
    name: `${advertiser}-${usecase}`,
    owner: CURRENT_ORIGIN,
    biddingLogicURL: new URL(
      `https://${HOSTNAME}:${EXTERNAL_PORT}/js/dsp/${usecase}/auction-bidding-logic.js`,
    ).toString(),
    trustedBiddingSignalsURL: new URL(
      `https://${HOSTNAME}:${EXTERNAL_PORT}/dsp/bidding-signal.json`,
    ).toString(),
    trustedBiddingSignalsKeys,
    // Daily update is not implemented yet.
    // updateURL: new URL(
    //  `https://${HOSTNAME}:${EXTERNAL_PORT}/dsp/daily-update-url`,
    // ),
    userBiddingSignals: {
      'user_bidding_signals': 'user_bidding_signals',
      ...req.query, // Copy query from request URL.
    },
    adSizes: {
      'medium-rectangle-default': {'width': '300px', 'height': '250px'},
    },
    sizeGroups: {
      'medium-rectangle': ['medium-rectangle-default'],
    },
    ads: InterestGroupHelper.getAdsForRequest(req, SSP_HOSTS),
  });
});

/** Simplified BYOS implementation for Key-Value Service. */
BuyerRouter.get('/bidding-signal.json', async (req: Request, res: Response) => {
  const publisher = req.query.hostname;
  const queryKeys = req.query.keys?.toString().split(',');
  const signalsFromKeyValueStore = trustedBiddingSignalStore.getMultiple(
    queryKeys!,
  );
  console.log('KV BYOS', {publisher, queryKeys});
  res.setHeader('X-Allow-FLEDGE', 'true');
  res.setHeader('X-fledge-bidding-signals-format-version', '2');
  const biddingSignals = {
    keys: {...signalsFromKeyValueStore},
    perInterestGroupData: {
      'name1': {
        'priorityVector': {
          'signal1': 100,
          'signal2': 200,
        },
      },
    },
  };
  console.log('Returning trusted bidding signals: ', {
    url: `${req.baseUrl}${req.path}`,
    biddingSignals,
  });
  res.json(biddingSignals);
});

// TODO: Implement
// BuyerRouter.get('/daily-update-url', async (req: Request, res: Response) => {
// })

/** Iframe document used as context to test Private Aggregation. */
BuyerRouter.get(
  '/test-private-aggregation.html',
  async (req: Request, res: Response) => {
    const bucket = req.query.bucket;
    const cloudEnv = req.query.cloudEnv;
    console.log(`${bucket}, ${cloudEnv}`);
    res.render('dsp/test-private-aggregation', {
      bucket: bucket,
      cloudEnv: cloudEnv,
    });
  },
);

// ************************************************************************
// HTTP endpoints used for demonstration purposes
// ************************************************************************
/** Adds values in query parameters to Key Value Store. */
BuyerRouter.get(
  '/set-bidding-signal.json',
  async (req: Request, res: Response) => {
    console.log('Setting bidding signals', {...req.query});
    for (const key of Object.keys(req.query)) {
      trustedBiddingSignalStore.set(key, req.query[key]?.toString());
    }
    res.sendStatus(200);
  },
);

/** Rewrites the default values in the key value store. */
BuyerRouter.get(
  '/reset-scoring-signal.json',
  async (req: Request, res: Response) => {
    trustedBiddingSignalStore.rewriteDefaults();
    res.status(200).send(`Rewrote default real-time signals: ${HOSTNAME}`);
  },
);
