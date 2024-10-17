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
import {
  DSP_HOSTS_TO_INTEGRATE,
  EXTERNAL_PORT,
  HOSTNAME,
  KNOWN_SHOP_ITEM_LABELS_BY_ID,
  RENDER_URL_SIZE_MACRO,
  SHOP_HOST,
  TRAVEL_HOST,
} from '../../lib/constants.js';
import {KeyValueStore} from '../../controllers/key-value-store.js';

/**
 * This router is responsible for handling requests to retrieve realtime
 * scoring signals for on-device Protected Audience auctions. In that, this is
 * a simplified Bring-Your-Own-Server (BYOS) implementation of the Key - Value
 * Server for SSPs.
 * 
 * Path: /ssp/realtime-signals/
 */
export const ScoringSignalsRouter = express.Router();

// ********************************************************
// BYOS implementation of Key - Value store
// ********************************************************
/** Intializes scoring signals for key value store. */
const getDefaultScoringSignals = (): string[][] => {
  const knownAds: string[][] = [];
  // Ads from Travel advertiser
  for (const dspHost of DSP_HOSTS_TO_INTEGRATE) {
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
    for (const dspHost of DSP_HOSTS_TO_INTEGRATE) {
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
// HTTP Handlers
// ********************************************************
/** Simplified BYOS implementation for Key-Value Service. */
ScoringSignalsRouter.get(
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

// ************************************************************************
// HTTP endpoints used for demonstration purposes
// ************************************************************************
/** Adds values in query parameters to Key Value Store. */
ScoringSignalsRouter.get(
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
ScoringSignalsRouter.get(
  '/reset-scoring-signal.json',
  async (req: Request, res: Response) => {
    console.log('');
    trustedScoringSignalsStore.rewriteDefaults();
    res.status(200).send(`Rewrote default real-time signals: ${HOSTNAME}`);
  },
);
