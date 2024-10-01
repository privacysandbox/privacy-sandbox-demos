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
import {getTemplateVariables} from '../lib/template-utils.js';

export const BuyerRouter = express.Router();

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
  const advertiser = req.query.advertiser || CURRENT_HOST;
  const usecase = req.query.usecase || 'default';
  console.log('Returning IG JSON: ', req.query);
  res.json({
    name: advertiser,
    owner: new URL(`https://${CURRENT_HOST}:${EXTERNAL_PORT}`).toString(),
    biddingLogicURL: new URL(
      `https://${CURRENT_HOST}:${EXTERNAL_PORT}/js/dsp/${usecase}/auction-bidding-logic.js`,
    ).toString(),
    trustedBiddingSignalsURL: new URL(
      `https://${CURRENT_HOST}:${EXTERNAL_PORT}/dsp/bidding-signal.json`,
    ).toString(),
    trustedBiddingSignalsKeys: [
      'trustedBiddingSignalsKeys-1',
      'trustedBiddingSignalsKeys-2',
    ],
    // Daily update is not implemented yet.
    // updateURL: new URL(
    //  `https://${CURRENT_HOST}:${EXTERNAL_PORT}/dsp/daily-update-url`,
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
        metadata: {
          // Custom ad metadata defined by ad-tech.
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
  res.setHeader('X-Allow-FLEDGE', 'true');
  res.setHeader('X-fledge-bidding-signals-format-version', '2');
  const biddingSignals = {
    keys: {
      'key1': 'xxxxxxxx',
      'key2': 'yyyyyyyy',
    },
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

// TODO: Implement
// DspRouter.get("/daily-update-url", async (req: Request, res: Response) => {
// })

/** Simple E2E Private Aggregation Demo */
BuyerRouter.get('/private-aggregation', async (req: Request, res: Response) => {
  const bucket = req.query.bucket;
  const cloudEnv = req.query.cloudEnv;
  console.log(`${bucket}, ${cloudEnv}`);
  res.render('dsp/private-aggregation', {
    bucket: bucket,
    cloudEnv: cloudEnv,
  });
});

// ************************************************************************
// DSP helper functions
// ************************************************************************
/** Constructs render URL to use in Interest Groups. */
const getRenderUrl = (requestQuery: any): string => {
  if ('video' === requestQuery.adType) {
    return new URL(
      `https://${CURRENT_HOST}:${EXTERNAL_PORT}/html/video-ad-creative.html`,
    ).toString();
  } else {
    const advertiser = requestQuery.advertiser || CURRENT_HOST;
    const imageCreative = new URL(
      `https://${CURRENT_HOST}:${EXTERNAL_PORT}/ads`,
    );
    imageCreative.searchParams.append('advertiser', advertiser);
    if (requestQuery.id) {
      imageCreative.searchParams.append('itemId', requestQuery.id);
    }
    const sizeMacro1 = 'adSize1={%AD_WIDTH%}x{%AD_HEIGHT%}';
    const sizeMacro2 = 'adSize2=${AD_WIDTH}x${AD_HEIGHT}';
    return `${imageCreative.toString()}&${sizeMacro1}&${sizeMacro2}`;
  }
};
