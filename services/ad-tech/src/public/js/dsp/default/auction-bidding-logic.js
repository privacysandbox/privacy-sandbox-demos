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

/**
 * Where is this script used:
 *   This is the 'default' auction bidding logic for a DSP.
 *
 * What does this script do?
 *   This script is used by interest groups to generate bids and report on
 *   participation in Protected Audience auctions.
 */

// ********************************************************
// Helper Functions
// ********************************************************
/** Logs to console. */
function log(label, o) {
  console.log('[PSDemo] ', label, JSON.stringify(o, ' ', ' '));
}

/** Calculates a bid price based on real-time signals. */
function calculateBidAmount(trustedBiddingSignals) {
  const minBid = Number(trustedBiddingSignals.minBid) || 0.5;
  const maxBid = Number(trustedBiddingSignals.maxBid) || 1.5;
  const multiplier = Number(trustedBiddingSignals.multiplier) || 1.0;
  let bid = Math.random() * (maxBid - minBid) + minBid;
  bid = (bid * multiplier).toFixed(2);
  log('Calculated bid', {bid, minBid, maxBid, multiplier});
  return bid;
}

/** Selects a deal ID from selectable buyer and seller reporting IDs. */
function selectDealId(selectedAd) {
  const {
    buyerReportingId,
    buyerAndSellerReportingId,
    selectableBuyerAndSellerReportingIds,
  } = selectedAd;
  const countOfSelectableIds = selectableBuyerAndSellerReportingIds.length;
  const randomIndex = Math.floor(Math.random() * countOfSelectableIds);
  const selectedId = selectableBuyerAndSellerReportingIds[randomIndex];
  log('Reporting IDs', {
    buyerReportingId,
    buyerAndSellerReportingId,
    selectedBuyerAndSellerReportingId: selectedId,
  });
  return selectedId;
}

// ********************************************************
// Top-level Protected Audience functions
// ********************************************************
function generateBid(
  interestGroup,
  auctionSignals,
  perBuyerSignals,
  trustedBiddingSignals,
  browserSignals,
) {
  log('generateBid', {
    interestGroup,
    auctionSignals,
    perBuyerSignals,
    trustedBiddingSignals,
    browserSignals,
  });
  if ('true' !== trustedBiddingSignals['isActive']) {
    // Don't place a bid if campaign is inactive.
    log('Campaign inactive', {trustedBiddingSignals});
    return;
  }
  // Use real-time signals to generate bid amount.
  const bidCpm = calculateBidAmount(trustedBiddingSignals);
  // Select a deal ID from buyer and seller reporting IDs.
  const selectedId = selectDealId(interestGroup.ads[0]);
  return {
    'ad': interestGroup.ads[0].metadata,
    'bid': bidCpm,
    'bidCurrency': 'USD',
    'allowComponentAuction': true,
    'render': {
      'url': interestGroup.ads[0].renderURL,
      // Specify ad size for macro replacements.
      'width': interestGroup.ads[0].metadata.adSizes[0].width,
      'height': interestGroup.ads[0].metadata.adSizes[0].height,
    },
    // Specify selected deal ID for reporting.
    'selectedBuyerAndSellerReportingId': selectedId,
    /*
      TODO: Use-case: Ad cost reporting
      'adCost': optionalAdCost,
    */
    /*
      TODO: Use-case: Ad components     
      'adComponents':[
        {url: adComponent1, width: componentWidth1, height: componentHeight1},
        {url: adComponent2, width: componentWidth2, height: componentHeight2},
      ],
      'targetNumAdComponents': 3,
      'numMandatoryAdComponents': 1,
    */
    /*
      TODO: Use-case: Modeling signals
      'modelingSignals': 123,
    */
  };
}

function reportWin(
  auctionSignals,
  perBuyerSignals,
  sellerSignals,
  browserSignals,
) {
  log('reportWin', {
    auctionSignals,
    perBuyerSignals,
    sellerSignals,
    browserSignals,
  });
  // Add query parameters from renderURL to beacon URL.
  const additionalQueryParams = browserSignals.renderURL
    .substring(browserSignals.renderURL.indexOf('?') + 1)
    .concat(`&redirect=${browserSignals.seller}`);
  registerAdBeacon({
    'impression': `${browserSignals.interestGroupOwner}/reporting?report=impression&${additionalQueryParams}`,
    'reserved.top_navigation_start': `${browserSignals.interestGroupOwner}/reporting?report=top_navigation_start&${additionalQueryParams}`,
    'reserved.top_navigation_commit': `${browserSignals.interestGroupOwner}/reporting?report=top_navigation_commit&${additionalQueryParams}`,
  });
  sendReportTo(browserSignals.interestGroupOwner + '/reporting?report=win');
}
