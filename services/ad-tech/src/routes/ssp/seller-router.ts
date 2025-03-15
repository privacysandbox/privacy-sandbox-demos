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
import {constructAuctionConfig} from '../../lib/auction-config-helper.js';
import {getEjsTemplateVariables} from '../../lib/common-utils.js';
import {EXTERNAL_PORT, HOSTNAME} from '../../lib/constants.js';

/**
 * This is the main Seller router and is responsible for handling a variety of
 * requests made at the top-level path: /ssp. This includes retrieving
 * iframes that deliver ads, auction configurations, and the wrapped VAST XML
 * for video ads.
 *
 * Path: /ssp/
 */
export const SellerRouter = express.Router();

/**
 * Generic handler for iframe HTML documents served by ad seller.
 * This matches paths like: /ssp/...*.html
 */
SellerRouter.get('*.html', async (req: Request, res: Response) => {
  // Pass URL query parameters as EJS template variables.
  const additionalContext: {[key: string]: string} = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (value) {
      additionalContext[key] = value.toString();
    }
  }
  console.debug(
    '[SellerRouter] Rendering HTML document',
    req.path,
    additionalContext,
  );
  // Translate req.path to 'view' path to EJS template.
  // req.path example: '/run-ad-auction.html'
  // view = 'ssp/run-ad-auction' ('.ejs' is implied.)
  res.render(
    /* view= */ `ssp${req.path.replace('.html', '')}`,
    getEjsTemplateVariables(/* titleMessage= */ req.path, additionalContext),
  );
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

/** Returns the finalized VAST XML to deliver video ads with PAAPI. */
SellerRouter.get('/vast.xml', async (req: Request, res: Response) => {
  const dspVast = decodeURIComponent(req.query.dspVast?.toString() || '');
  const auctionId =
    req.query.auctionId?.toString() || `SSP-${crypto.randomUUID()}`;
  const advertiser = req.query.advertiser?.toString() || HOSTNAME;
  /**
   * TODO: Consider using additional video ad types.
   * https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/tags
   */
  res.type('application/xml').render('ssp/vast-preroll', {
    HOSTNAME,
    EXTERNAL_PORT,
    AUCTION_ID: auctionId,
    DSP_VAST: dspVast,
    ADVERTISER_HOST: advertiser,
  });
});
