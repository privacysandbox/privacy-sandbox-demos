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
  HOSTNAME,
  DSP_A_HOST,
  DSP_X_HOST,
  EXTERNAL_PORT,
} from '../../lib/constants.js';
import {getEjsTemplateVariables} from '../../lib/common-utils.js';
import {
  getInterestGroup,
  getInterestGroupBiddingAndAuction,
  TargetingContext,
} from '../../lib/interest-group-helper.js';

/**
 * This is the main ad buyer router and is responsible for a variety of
 * requests made at the top-level path: /dsp. This includes retrieving
 * iframes to include and the interest group to join on advertiser pages.
 *
 * Path: /dsp/
 */
export const BuyerRouter = express.Router();

/**
 * Generic handler for iframe HTML documents served by ad buyer.
 * This matches paths like: /dsp/...*.html
 */
BuyerRouter.get('*.html', async (req: Request, res: Response) => {
  // Pass URL query parameters as EJS template variables.
  const urlQueryParams: {[key: string]: string} = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (value) {
      urlQueryParams[key] = value.toString();
    }
  }
  console.debug(
    '[BuyerRouter] Rendering HTML document',
    req.path,
    urlQueryParams,
  );
  // Translate req.path to 'view' path for EJS template.
  // E.g. req.path = '/join-ad-interest-group.html'
  // view = 'dsp/join-ad-interest-group' ('.ejs' is implied.)
  res.render(
    /* view= */ `dsp${req.path.replace('.html', '')}`,
    getEjsTemplateVariables(
      /* titleMessage= */ req.path,
      /* additionalTemplateVariables= */ urlQueryParams,
    ),
  );
});

// ************************************************************************
// HTTP handlers with JSON responses
// ************************************************************************
/** Iframe document used as context to join interest group. */
/** Full route: /dsp/service/kv */
BuyerRouter.get('/service/kv', (req, res) => {
  res.setHeader('Ad-Auction-Allowed', 'true');

  res.json({
    keys: {
      'isActive': 0,
      'minBid': 1,
      'maxBid': 100,
      'multiplier': 0,
    },
  });
});

//TODO: Replace this with the buyer-contextual-bidder-router endpoint
BuyerRouter.get('/contextual-bid', async (req: Request, res: Response) => {
  res.json({
    bid: Math.floor(Math.random() * 100),
    renderURL: `https://${DSP_X_HOST}:${EXTERNAL_PORT}/html/contextual-ad.html`,
    perBuyerSignals: {'testKey': 'dsp-x'},
  });
});

/** Returns the interest group to join on an advertiser page. */
BuyerRouter.get('/interest-group.json', async (req: Request, res: Response) => {
  const targetingContext = assembleTargetingContext(req.query);
  // TODO: Generalize to accommodate additional use cases.
  if ('bidding-and-auction' === targetingContext.usecase) {
    res.json(getInterestGroupBiddingAndAuction(targetingContext));
  } else {
    res.json(getInterestGroup(targetingContext));
  }
});

/** Returns the updated interest group, usually daily, may be overridden. */
BuyerRouter.get(
  '/interest-group-update.json',
  async (req: Request, res: Response) => {
    const targetingContext = assembleTargetingContext(req.query);
    targetingContext.isUpdateRequest = true;
    res.json(getInterestGroup(targetingContext));
  },
);

// ************************************************************************
// Helper methods
// ************************************************************************
const KNOWN_TARGETING_CONTEXT_KEYS = [
  'advertiser',
  'usecase',
  'itemId',
  'biddingSignalKeys',
];
/** Assembles the targeting context from query parameters. */
const assembleTargetingContext = (query: any): TargetingContext => {
  const {advertiser, usecase, itemId, biddingSignalKeys} = query;
  const targetingContext: TargetingContext = {
    advertiser: advertiser?.toString() || HOSTNAME!, // Default to current host
    usecase: usecase?.toString() || 'default',
    itemId: itemId?.toString() || '',
    isUpdateRequest: false,
  };
  targetingContext.biddingSignalKeys = [];
  if (biddingSignalKeys) {
    if (Array.isArray(biddingSignalKeys)) {
      targetingContext.biddingSignalKeys.push(
        ...biddingSignalKeys.map((key) => key.toString()),
      );
    } else {
      targetingContext.biddingSignalKeys.push(
        biddingSignalKeys.toString().split(','),
      );
    }
  }
  targetingContext.additionalContext = {};
  for (const [key, value] of Object.entries(query)) {
    if (KNOWN_TARGETING_CONTEXT_KEYS.includes(key)) {
      continue;
    }
    if (value) {
      if (Array.isArray(value)) {
        targetingContext.additionalContext[key.toString()] = value.map(
          (value) => value.toString(),
        );
      } else {
        targetingContext.additionalContext[key.toString()] = [
          ...value.toString().split(','),
        ];
      }
    }
  }
  return targetingContext;
};
