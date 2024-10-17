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
  MAX_CONTEXTUAL_BID,
  MIN_CONTEXTUAL_BID,
} from '../../lib/constants.js';

/**
 * This router is responsible for handling requests related to contextual
 * auctions as a DSP.
 * 
 * Path: /dsp/contextual-bid/
 */
export const BuyerContextualBidderRouter = express.Router();

/** Returns a random bid price with 2 decimal digits. */
const getContextualBidPrice = (): string => {
  const minBid = MIN_CONTEXTUAL_BID;
  const maxBid = MAX_CONTEXTUAL_BID;
  const bid = (Math.random() * (maxBid - minBid) + minBid).toFixed(2);
  return bid;
};

// ************************************************************************
// HTTP Handlers
// ************************************************************************
/** Places a bid for the contextual auction. */
BuyerContextualBidderRouter.get('/', async (req: Request, res: Response) => {
  const bid = getContextualBidPrice();
  // Generate a new auction ID if missing in request.
  const auctionId = req.query.auctionId || `DSP-${crypto.randomUUID()}`;
  // Assemble render URL query parameters.
  const renderUrlQuery = `advertiser=${ADVERTISER_CONTEXTUAL}&auctionId=${auctionId}`;
  const renderURL = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/ads/display-ads?${renderUrlQuery}`,
  ).toString();
  /** Return contextual bid with buyer signals. */
  res.json({
    bidder: CURRENT_ORIGIN,
    auctionId,
    bid,
    renderURL,
    buyerSignals: {
      contextualBid: bid,
      contextualRenderURL: renderURL,
      contextualAdvertiser: ADVERTISER_CONTEXTUAL,
      ...req.query,
    },
  });
});
