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
import {getEjsTemplateVariables} from '../../lib/common-utils.js';
import {
  getInterestGroup,
  getInterestGroupBiddingAndAuction,
  TargetingContext,
} from '../../lib/interest-group-helper.js';
//TODO: pull from packages in package.json instead of lib directory
import * as ed25519 from '../../lib/noble-ed25519.js';

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


async function _generateSignature(message: string, base64EncodedSecretKey: string) {
  const secretKey = Uint8Array.from(atob(base64EncodedSecretKey), c => c.charCodeAt(0));
  const [publicKey, signature] = await Promise.all([
    ed25519.getPublicKeyAsync(secretKey),
    ed25519.signAsync(new TextEncoder().encode(message), secretKey)
  ]);

  console.log('signature generated', publicKey, signature);

  return {
    'key': btoa(String.fromCharCode(...publicKey)),
    'signature': btoa(String.fromCharCode(...signature))
  };
}

function _generateAdditionalBid(auctionNonce: string, auctionSeller: string) {
  return {
    "bid": {
      "ad": 'additional-bid',
      "bid": 999,
      "bidCurrency": "USD",
      "render": "https://privacy-sandbox-demos-dsp.dev/ads/display-ads?advertiser=privacy-sandbox-demos-shop.dev&itemId=1f45f"
    },
  
    "interestGroup": {
      "owner": "https://privacy-sandbox-demos-dsp.dev/",
      "name": "additional-bid-campaign",
      "biddingLogicURL": "https://privacy-sandbox-demos-dsp.dev/bid_logic.js"
    },
    auctionNonce: auctionNonce,
    seller: auctionSeller
  };
}

// const ADDITIONAL_BID_SECRET_KEY_1 = 'nWGxne/9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A=';
// const ADDITIONAL_BID_PUBLIC_KEY = '11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=';
// const ADDITIONAL_BID_SECRET_KEY_2 = btoa(String.fromCharCode(...ed25519.utils.randomPrivateKey()));
BuyerRouter.get(
  '/additional-bids',
  async (req: Request, res: Response) => {
    const auctionNonce = req.query['auction-nonce'] as string | undefined;
    const auctionSeller = req.query['auction-seller'] as string | undefined;
    if (!!auctionNonce && !!auctionSeller) {
      const additionalBid = _generateAdditionalBid(auctionNonce, auctionSeller);
      const signedAdditionalBid = {
        bid: JSON.stringify(additionalBid),
        signatures: [
          //FYI: skipping sigs since we don't need them for additional bid without negative ig
          // await _generateSignature(JSON.stringify(additionalBid), ADDITIONAL_BID_SECRET_KEY_1),
          // await _generateSignature(JSON.stringify(additionalBid), ADDITIONAL_BID_SECRET_KEY_2),
        ]
      };
      const encodedAdditionalBid = Buffer.from(JSON.stringify(signedAdditionalBid)).toString('base64')
      console.log('additionalBid', additionalBid);
      console.log('signedAdditionalBid', signedAdditionalBid);
      console.log('encodedAdditionalBid', encodedAdditionalBid);
      res.set({
        'Ad-Auction-Additional-Bid': `${auctionNonce}:${encodedAdditionalBid}`
      });
      res.send('OK');
    } else {
      res.send('MISSING AUCTION NONCE OR SELLER');
    }
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
