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
import {CURRENT_ORIGIN, EXTERNAL_PORT, HOSTNAME} from '../../lib/constants.js';
import {getTemplateVariables} from '../../lib/template-utils.js';
import {getAdsForRequest} from '../../lib/interest-group-helper.js';

/**
 * This is the main ad buyer router and is responsible for a variety of
 * requests made at the top-level path: /dsp. This includes retrieving
 * iframes to include and the interest group to join on advertiser pages.
 *
 * Path: /dsp/
 */
export const BuyerRouter = express.Router();

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

/** Returns the interest group to join on advertiser page. */
BuyerRouter.get('/interest-group.json', async (req: Request, res: Response) => {
  // Set advertiser from query or fallback to current host.
  const advertiser = req.query.advertiser?.toString() || HOSTNAME!;
  const itemId = req.query.itemId?.toString() || '';
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
      `https://${HOSTNAME}:${EXTERNAL_PORT}/dsp/realtime-signals/bidding-signal.json`,
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
    ads: getAdsForRequest(advertiser, itemId),
  });
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
