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
CURR_HOST = '';
/** Logs to console. */
function log(msg, context) {
  console.log(
    '[PSDemo] Buyer',
    CURR_HOST,
    'bidding logic',
    msg,
    JSON.stringify({context}, ' ', ' '),
  );
}

/** Calculates a bid price based on real-time signals. */
function calculateBidAmount(trustedBiddingSignals) {
  const minBid = Number(trustedBiddingSignals.minBid) || 0.5;
  const maxBid = Number(trustedBiddingSignals.maxBid) || 1.5;
  const multiplier = Number(trustedBiddingSignals.multiplier) || 1.0;
  let bid = Math.random() * (maxBid - minBid) + minBid;
  bid = (bid * multiplier).toFixed(2);
  log('calculated bid price', {bid, minBid, maxBid, multiplier});
  return bid;
}

/** Selects a deal ID from selectable buyer and seller reporting IDs. */
function selectDealId(selectedAd) {
  const {
    buyerReportingId,
    buyerAndSellerReportingId,
    selectableBuyerAndSellerReportingIds,
  } = selectedAd;
  if (selectableBuyerAndSellerReportingIds?.length) {
    const countOfSelectableIds = selectableBuyerAndSellerReportingIds.length;
    const randomIndex = Math.floor(Math.random() * countOfSelectableIds);
    const selectedId = selectableBuyerAndSellerReportingIds[randomIndex];
    log('found reporting IDs', {
      buyerReportingId,
      buyerAndSellerReportingId,
      selectableBuyerAndSellerReportingIds,
      selectedBuyerAndSellerReportingId: selectedId,
    });
    return selectedId;
  } else {
    log('found reporting IDs', {
      buyerReportingId,
      buyerAndSellerReportingId,
      selectableBuyerAndSellerReportingIds,
    });
  }
}

/** Returns the bid response for a video ad request. */
function getBidForVideoAd({
  interestGroup,
  trustedBiddingSignals,
  browserSignals,
}) {
  const {seller} = browserSignals;
  const {ads} = interestGroup;
  // Filter for video ads specifically mapped to current SSP.
  const [selectedAd] = ads.filter(
    (ad) =>
      'VIDEO' === ad.metadata.adType && ad.metadata.seller.includes(seller),
  );
  if (!selectedAd) {
    log('didnt find eligible video ad in IG', {interestGroup, browserSignals});
    return {bid: '0.0'};
  }
  return {
    ad: {
      ...selectedAd.metadata,
      seller: browserSignals.seller,
      topLevelSeller: browserSignals.topLevelSeller,
    },
    bid: calculateBidAmount(trustedBiddingSignals),
    bidCurrency: 'USD',
    allowComponentAuction: true,
    render: selectedAd.renderURL,
    /*
      TODO: Use-case: Ad cost reporting
      adCost: optionalAdCost,
    */
    /*
      TODO: Use-case: Modeling signals
      modelingSignals: 123,
    */
  };
}

/** Returns the bid response for a display ad request. */
function getBidForDisplayAd({
  interestGroup,
  trustedBiddingSignals,
  browserSignals,
}) {
  const [selectedAd] = interestGroup.ads.filter(
    (ad) => 'DISPLAY' === ad.metadata.adType,
  );
  if (!selectedAd) {
    log("can't select display ad, no matching ad type found", {interestGroup});
    return {bid: '0.0'};
  }
  return {
    ad: {
      ...selectedAd.metadata,
      seller: browserSignals.seller,
      topLevelSeller: browserSignals.topLevelSeller,
    },
    bid: calculateBidAmount(trustedBiddingSignals),
    bidCurrency: 'USD',
    allowComponentAuction: true,
    render: {
      url: selectedAd.renderURL,
      // Specify ad size for macro replacements.
      width: selectedAd.metadata.adSizes[0].width,
      height: selectedAd.metadata.adSizes[0].height,
    },
    // Specify selected deal ID for reporting.
    selectedBuyerAndSellerReportingId: selectDealId(selectedAd),
    /*
      TODO: Use-case: Ad cost reporting
      adCost: optionalAdCost,
    */
    /*
      TODO: Use-case: Ad components     
      adComponents:[
        {url: adComponent1, width: componentWidth1, height: componentHeight1},
        {url: adComponent2, width: componentWidth2, height: componentHeight2},
      ],
      targetNumAdComponents: 3,
      numMandatoryAdComponents: 1,
    */
    /*
      TODO: Use-case: Modeling signals
      modelingSignals: 123,
    */
  };
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
  CURR_HOST = interestGroup.owner.substring('https://'.length);
  log('generating bid', {
    interestGroup,
    auctionSignals,
    perBuyerSignals,
    trustedBiddingSignals,
    browserSignals,
  });
  if ('true' !== trustedBiddingSignals['isActive']) {
    // Don't place a bid if campaign is inactive.
    log('not bidding since campaign is inactive', {
      trustedBiddingSignals,
      seller: browserSignals.seller,
      topLevelSeller: browserSignals.topLevelSeller,
      dataVersion: browserSignals.dataVersion,
    });
    return;
  }
  const biddingContext = {
    interestGroup,
    trustedBiddingSignals,
    browserSignals,
  };
  const bid =
    'VIDEO' === auctionSignals.adType
      ? getBidForVideoAd(biddingContext)
      : getBidForDisplayAd(biddingContext);
  if (bid) {
    log('returning bid', {bid});
    return bid;
  }
}

function reportWin(
  auctionSignals,
  perBuyerSignals,
  sellerSignals,
  browserSignals,
) {
  if (sellerSignals.buyer) {
    CURR_HOST = sellerSignals.buyer.substring('https://'.length);
  }
  log('reporting win', {
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
