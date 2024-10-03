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
import {HOSTNAME, EXTERNAL_PORT} from '../lib/constants.js';
import {getTemplateVariables} from '../lib/template-utils.js';

export const BuyerRouter = express.Router();

/** Both types of ad size macros supported in render URLs. */
export const RENDER_URL_SIZE_MACRO =
  'adSize1={%AD_WIDTH%}x{%AD_HEIGHT%}&adSize2=${AD_WIDTH}x${AD_HEIGHT}';

/** BYOS implementaion of Key Value store. */
const trustedBiddingSignalStore = new KeyValueStore(
  /* defaultValues= */ [
    ['isActive', 'true'],
    ['minBid', '1.5'],
    ['maxBid', '2.5'],
    ['multiplier', '1.1'],
  ],
);

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** Iframe document used as context to join interest group. */
BuyerRouter.get(
  '/join-ad-interest-group.html',
  async (req: Request, res: Response) => {
    res.render(
      'dsp/join-ad-interest-group',
      getTemplateVariables('Join Ad Interest Group'),
    );
  },
);

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
    owner: new URL(`https://${HOSTNAME}:${EXTERNAL_PORT}`).toString(),
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
    ads: [
      {
        renderURL: getRenderUrl(req.query),
        sizeGroup: 'medium-rectangle',
        // Reporting IDs
        selectableBuyerAndSellerReportingIds: ['deal1', 'deal2', 'deal3'],
        buyerReportingId: 'buyerSpecificInfo1',
        buyerAndSellerReportingId: 'seatid-1234',
        // Custom ad metadata defined by ad-tech.
        metadata: {
          advertiser,
          adType: 'image',
          adSizes: [{'width': '300px', 'height': '250px'}],
        },
      },
    ],
  });
});

/** Simplified BYOS implementation for Key-Value Service. */
BuyerRouter.get('/bidding-signal.json', async (req: Request, res: Response) => {
  const publisher = req.query.hostname;
  const queryKeys = req.query.keys?.toString().split(',');
  const signalsFromKeyValueStore = trustedBiddingSignalStore.getMultiple(
    queryKeys!,
  );
  console.log('KV BYOS', publisher, queryKeys);
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
  console.log(
    'Returning trusted bidding signals: ',
    req.baseUrl,
    biddingSignals,
  );
  res.json(biddingSignals);
});

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
// DSP helper functions
// ************************************************************************
/** Constructs render URL to use in Interest Groups. */
const getRenderUrl = (requestQuery: any): string => {
  if ('video' === requestQuery.adType) {
    return new URL(
      `https://${HOSTNAME}:${EXTERNAL_PORT}/html/video-ad-creative.html`,
    ).toString();
  } else {
    const advertiser = requestQuery.advertiser || HOSTNAME;
    const imageCreative = new URL(`https://${HOSTNAME}:${EXTERNAL_PORT}/ads`);
    imageCreative.searchParams.append('advertiser', advertiser);
    if (requestQuery.itemdId) {
      imageCreative.searchParams.append('itemId', requestQuery.itemId);
    }
    return `${imageCreative.toString()}&${RENDER_URL_SIZE_MACRO}`;
  }
};
