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
  ContextualBidResponse,
  getContextualBids,
} from '../../lib/contextual-auction-helper.js';
import {constructAuctionConfig} from '../../lib/auction-config-helper.js';
import {
  HOSTNAME,
  CURRENT_ORIGIN,
  BUYER_HOSTS_TO_INTEGRATE_BY_SELLER_HOST,
} from '../../lib/constants.js';

/**
 * This router is responsible for handling contextual bid requests as an ad
 * seller. When a seller receives a contextual bid request, it forwards this
 * bid request to a set of ad buyers. These buyers respond with a bid and buyer
 * signals to include in Protected Audience auctions. The seller picks the
 * winning contextual bid, collates all buyer signals to responds to the
 * original bid request with the winning contextual bid and the component
 * auction configuration to use with Protected Audience.
 *
 * Path: /ssp/contextual-bid/
 */
export const SellerContextualBidderRouter = express.Router();

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** Returns the winning contextual ad and auction config for PAAPI. */
SellerContextualBidderRouter.get('/', async (req: Request, res: Response) => {
  // Collect signals from request context.
  const signals: {[key: string]: string} = {};
  for (const key of Object.keys(req.query)) {
    signals[key] = req.query[key]?.toString() || '';
  }
  if (!signals['auctionId']) {
    // Add an auction ID if missing in request.
    // E.g. of auction ID: 'SSP-32e7f33f-a7da-4ea9-af01-63e17da48ff8'
    signals['auctionId'] = `SSP-${crypto.randomUUID()}`;
  }
  // Run server-side contextual auction.
  const contextualBids = await getContextualBids(
    /* bidderHosts= */ BUYER_HOSTS_TO_INTEGRATE_BY_SELLER_HOST.get(HOSTNAME!)!,
    /* signals= */ signals,
  );
  const [winningContextualBid] = contextualBids
    .filter((bid) => Number(bid.bid) > 0)
    .sort((bid1, bid2) => Number(bid2.bid!) - Number(bid1.bid!));
  console.log('Winning contextual bid', {winningContextualBid});
  // Collect buyer signals from contextual bids.
  const perBuyerSignals: {[key: string]: any} = {};
  for (const contextualBid of contextualBids) {
    if (contextualBid.buyerSignals) {
      perBuyerSignals[contextualBid.bidderOrigin!] = contextualBid.buyerSignals;
    }
  }
  const response: ContextualBidResponse = {
    bidderOrigin: CURRENT_ORIGIN,
    bidderHost: HOSTNAME,
    buyerOrigin: winningContextualBid?.bidderOrigin,
    buyerHost: winningContextualBid?.bidderHost,
    auctionId: signals['auctionId'],
    bid: winningContextualBid?.bid,
    renderURL: winningContextualBid?.renderURL,
    componentAuctionConfig: constructAuctionConfig({
      useCase: req.query.useCase?.toString(),
      isFencedFrame: req.query.isFencedFrame?.toString(),
      auctionSignals: signals,
      sellerSignals: {winningContextualBid},
      perBuyerSignals,
    }),
  };
  console.log('Responding to contextual bid request', {response});
  res.json(response);
});
