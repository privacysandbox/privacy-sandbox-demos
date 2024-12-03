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
import {HOSTNAME} from '../../lib/constants.js';
import {getTemplateVariables} from '../../lib/common-utils.js';
import {
  getInterestGroup,
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

/** Returns the interest group to join on an advertiser page. */
BuyerRouter.get('/interest-group.json', async (req: Request, res: Response) => {
  const targetingContext = assembleTargetingContext(req.query);
  res.json(getInterestGroup(targetingContext));
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
