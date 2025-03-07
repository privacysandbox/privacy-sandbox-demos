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
  EXTERNAL_PORT,
  HOSTNAME,
  DSP_A_HOST,
  DSP_B_HOST,
  DSP_X_HOST,
  DSP_Y_HOST,
} from '../../lib/constants.js';
import {constructAuctionConfig} from '../../lib/auction-config-helper.js';
import {tlsRouter} from './usecase/bidding-and-auction/bidding-and-auction-router.js';
import {sspYRouter} from './usecase/bidding-and-auction/bidding-and-auction-router.js';
import {sspXRouter} from './usecase/bidding-and-auction/bidding-and-auction-router.js';
import {sspARouter} from './usecase/bidding-and-auction/bidding-and-auction-router.js';
/**
 * This is the main Seller router and is responsible for handling a variety of
 * requests made at the top-level path: /ssp. This includes retrieving
 * iframes that deliver ads, auction configurations, and the wrapped VAST XML
 * for video ads.
 *
 * Path: /ssp/
 */
export const SellerRouter = express.Router();
const DSP_A_ORIGIN = new URL(`https://${DSP_A_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_B_ORIGIN = new URL(`https://${DSP_B_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_X_ORIGIN = new URL(`https://${DSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_Y_ORIGIN = new URL(`https://${DSP_Y_HOST}:${EXTERNAL_PORT}`).origin;
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

SellerRouter.get('/ssp-x/service/kv', (req, res) => {
  res.setHeader('Ad-Auction-Allowed', 'true');

  res.json({
    renderUrls: {
      [new URL('/html/protected-audience-ad.html', DSP_X_ORIGIN).toString()]: [
        1, 2, 3,
      ],
      [new URL('/html/protected-audience-ad.html', DSP_Y_ORIGIN).toString()]: [
        1, 2, 3,
      ],
    },
  });
});

SellerRouter.get('/ssp-y/service/kv', (req, res) => {
  res.setHeader('Ad-Auction-Allowed', 'true');

  res.json({
    renderUrls: {
      [new URL('/html/protected-audience-ad.html', DSP_A_ORIGIN).toString()]: [
        1, 2,
      ],
      [new URL('/html/protected-audience-ad.html', DSP_B_ORIGIN).toString()]: [
        1, 2,
      ],
      [new URL('/html/protected-audience-ad.html', DSP_X_ORIGIN).toString()]: [
        1, 2,
      ],
      [new URL('/html/protected-audience-ad.html', DSP_Y_ORIGIN).toString()]: [
        1, 2,
      ],
    },
  });
});

/** Route for Bidding & Auction Services use case
 * There is an implied route where this route is /ssp/usecase/bidding-and-auction */
SellerRouter.use('/usecase/bidding-and-auction', tlsRouter);
SellerRouter.use('/usecase/bidding-and-auction/ssp-x', sspXRouter);
SellerRouter.use('/usecase/bidding-and-auction/ssp-y', sspYRouter);
SellerRouter.use('/usecase/bidding-and-auction/ssp-a', sspARouter);
