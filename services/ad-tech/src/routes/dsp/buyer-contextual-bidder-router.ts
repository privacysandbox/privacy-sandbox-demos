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
  ADVERTISER_CONTEXTUAL,
  CURRENT_ORIGIN,
  EXTERNAL_PORT,
  HOSTNAME,
  CONTEXTUAL_BID_MAX,
  CONTEXTUAL_BID_MIN,
} from '../../lib/constants.js';
import {AdType} from '../../lib/interest-group-helper.js';
import {ContextualBidResponse} from '../../lib/contextual-auction-helper.js';

/**
 * This router is responsible for handling requests related to contextual
 * auctions as an ad buyer.
 *
 * Path: /dsp/contextual-bid/
 */
export const BuyerContextualBidderRouter = express.Router();

// ************************************************************************
// Helper functions
// ************************************************************************
/** Returns a random bid price with 2 decimal digits. */
const getContextualBidPrice = (): string => {
  const minBid = CONTEXTUAL_BID_MIN;
  const maxBid = CONTEXTUAL_BID_MAX;
  const bid = (Math.random() * (maxBid - minBid) + minBid).toFixed(2);
  return bid;
};

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** Places a bid for the contextual auction. */
BuyerContextualBidderRouter.get('/', async (req: Request, res: Response) => {
  // Generate a new auction ID if missing in request.
  const auctionId =
    req.query.auctionId?.toString() || `DSP-${crypto.randomUUID()}`;
  const adType = req.query.adType?.toString().toUpperCase() || '';
  if (AdType.VIDEO === adType) {
    // Don't place contextual bids for video ads request.
    const bidResponse: ContextualBidResponse = {
      bidderOrigin: CURRENT_ORIGIN,
      bidderHost: HOSTNAME,
      auctionId,
      bid: '0.0',
      buyerSignals: {
        contextualBid: '0.0',
        ...req.query,
      },
    };
    console.log('Responding to contextual video ad request', {bidResponse});
    res.json(bidResponse);
    return;
  }
  // Assemble render URL query parameters.
  const renderUrlQuery = `advertiser=${ADVERTISER_CONTEXTUAL}&auctionId=${auctionId}`;

  // /********* SERNA TODO we need a different renderURL for REACH measurment  */

  console.log('Responding to contextual XXXXXXX ad request');

  // const renderURL = new URL(
  //   `https://${HOSTNAME}:${EXTERNAL_PORT}/ads/contextual-ads?{renderUrlQuery}`,
  // ).toString();

  const renderURL = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/ads/reach-ads?SERNA=FOO&${renderUrlQuery}`,
  ).toString();

  const bid = getContextualBidPrice();
  /** Return contextual bid with buyer signals. */
  const bidResponse: ContextualBidResponse = {
    bidderOrigin: CURRENT_ORIGIN,
    bidderHost: HOSTNAME,
    auctionId,
    bid,
    renderURL,
    buyerSignals: {
      auctionId,
      buyerHost: HOSTNAME,
      buyerOrigin: CURRENT_ORIGIN,
      contextualBid: bid,
      contextualRenderURL: renderURL,
      contextualAdvertiser: ADVERTISER_CONTEXTUAL,
      ...req.query,
    },
  };
  console.log('Responding to contextual ad request', {bidResponse});
  res.json(bidResponse);
});
