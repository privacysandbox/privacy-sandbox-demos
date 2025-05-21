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

const CURRENT_HOST = '<%= HOSTNAME %>';
const CURRENT_ORIGIN = '<%= CURRENT_ORIGIN %>';
const LOG_PREFIX = '[PSDemo] <%= HOSTNAME %> bidding logic:';

// ********************************************************
// Helper Functions
// ********************************************************
/** Returns whether running in debug mode. */
function inDebugMode({auctionSignals, perBuyerSignals, trustedBiddingSignals}) {
  const debugFlag = `DEBUG_${CURRENT_HOST}`;
  if (
    (auctionSignals && debugFlag in auctionSignals) ||
    (perBuyerSignals && debugFlag in perBuyerSignals) ||
    (trustedBiddingSignals && debugFlag in trustedBiddingSignals)
  ) {
    console.info(LOG_PREFIX, 'running in debug mode');
    console.debug(
      LOG_PREFIX,
      'generateBid() invoked for seller',
      browserSignals.seller,
      '\n\n',
      JSON.stringify({biddingContext}),
    );
    return true;
  }
  return false;
}

/** Checks whether the current ad campaign is active. */
function isCurrentCampaignActive({trustedBiddingSignals, browserSignals}) {
  if ('true' !== trustedBiddingSignals['isActive']) {
    // Don't place a bid if campaign is inactive.
    console.error(
      LOG_PREFIX,
      'not bidding because campaign is inactive\n\n',
      JSON.stringify({
        trustedBiddingSignals,
        seller: browserSignals.seller,
        topLevelSeller: browserSignals.topLevelSeller,
        dataVersion: browserSignals.dataVersion,
      }),
    );
    return false;
  }
  return true;
}

/** Calculates a bid price based on real-time signals. */
function calculateBidAmount({
  trustedBiddingSignals,
  dealId,
  browserSignals,
  inDebugMode,
}) {
  const minBid = Number(trustedBiddingSignals.minBid) || 0.5;
  const maxBid = Number(trustedBiddingSignals.maxBid) || 1.5;
  let multiplier = 1.0;
  if (dealId) {
    // If an eligible deal is found, use the corresponding bid multiplier.
    multiplier = Number(trustedBiddingSignals[`multiplier-${dealId}`]) || 0.5;
  } else {
    multiplier = Number(trustedBiddingSignals.multiplier) || 1.0;
  }
  let bid = Math.random() * (maxBid - minBid) + minBid;
  bid = (bid * multiplier).toFixed(2);
  if (inDebugMode) {
    console.debug(
      LOG_PREFIX,
      'calculated bid price',
      browserSignals.seller,
      JSON.stringify({bid, minBid, maxBid, multiplier}),
    );
  }
  return bid;
}

/** Selects a deal ID from selectable buyer and seller reporting IDs. */
function selectDealId({selectedAd, auctionSignals, inDebugMode}) {
  const {
    buyerReportingId,
    buyerAndSellerReportingId,
    selectableBuyerAndSellerReportingIds,
  } = selectedAd;
  if (
    !selectableBuyerAndSellerReportingIds ||
    !selectableBuyerAndSellerReportingIds.length
  ) {
    if (inDebugMode) {
      console.debug(
        LOG_PREFIX,
        'no selectableBuyerAndSellerReportingIds found in interest group\n\n',
        JSON.stringify({selectedAd, auctionSignals}),
      );
    }
    // No deal IDs in interest group to choose from.
    return;
  }
  // Filter deals in interest group with deals from bid request.
  const eligibleDeals = ((dealsQuery) => {
    const availableDeals = dealsQuery?.split(',');
    if (availableDeals && availableDeals.length) {
      return selectableBuyerAndSellerReportingIds.filter((id) =>
        auctionSignals.availableDeals.includes(id),
      );
    }
  })(auctionSignals.availableDeals);
  if (!eligibleDeals || !eligibleDeals.length) {
    // No eligible deals for this bid request.
    console.info(LOG_PREFIX, 'no eligible deals for this bid request');
    if (inDebugMode) {
      console.debug(
        LOG_PREFIX,
        'no eligible deals for this bid request\n\n',
        JSON.stringify({selectedAd, auctionSignals, availableDeals}),
      );
    }
    return;
  }
  // Choose one of the eligible deals at random.
  const countOfEligibleDeals = eligibleDeals.length;
  const randomIndex = Math.floor(Math.random() * countOfEligibleDeals);
  const selectedDeal = eligibleDeals[randomIndex];
  if (inDebugMode) {
    console.debug(
      LOG_PREFIX,
      'returning a selectedBuyerAndSellerReportingId from interest group\n\n',
      JSON.stringify({
        buyerReportingId,
        buyerAndSellerReportingId,
        selectableBuyerAndSellerReportingIds,
        selectedDeal,
        selectedAd,
      }),
    );
  }
  return selectedDeal;
}

/**
 * Filters ads for the specified type and logs context to console for debugging.
 */
function getAdsByType({interestGroup, adType, inDebugMode}) {
  const filteredAds = interestGroup.ads.filter(
    (ad) => ad.metadata.adType === adType,
  );
  if (!filteredAds || !filteredAds.length) {
    console.error(
      LOG_PREFIX,
      `did not find ${adType} ad in interest group`,
      interestGroup.name,
    );
    if (inDebugMode) {
      console.debug(
        LOG_PREFIX,
        `did not find ${adType} ad in interest group\n\n`,
        JSON.stringify({interestGroup}),
      );
    }
    return;
  }
  return filteredAds;
}

/** Returns the bid response for a video ad request. */
function getBidForVideoAd({
  interestGroup,
  auctionSignals,
  // UNUSED perBuyerSignals,
  trustedBiddingSignals,
  browserSignals,
  inDebugMode,
}) {
  const [selectedAd] = getAdsByType({
    interestGroup,
    adType: 'VIDEO',
    inDebugMode,
  });
  if (!selectedAd) {
    return {bid: '0.0'};
  }
  // Check if any deals are eligible.
  const dealId = selectDealId({selectedAd, auctionSignals, inDebugMode});
  return {
    ad: {
      ...selectedAd.metadata,
      seller: browserSignals.seller,
      topLevelSeller: browserSignals.topLevelSeller,
    },
    bid: calculateBidAmount({
      trustedBiddingSignals,
      dealId,
      browserSignals,
      inDebugMode,
    }),
    bidCurrency: 'USD',
    allowComponentAuction: true,
    render: selectedAd.renderURL,
    // Specify selected deal ID for reporting.
    selectedBuyerAndSellerReportingId: dealId,
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
  auctionSignals,
  // UNUSED perBuyerSignals,
  trustedBiddingSignals,
  browserSignals,
  inDebugMode,
}) {
  // Select an ad meeting the auction requirements.
  const [selectedAd] = getAdsByType({
    interestGroup,
    adType: 'DISPLAY',
    inDebugMode,
  });
  if (!selectedAd) {
    return {bid: '0.0'};
  }
  // Check if any deals are eligible.
  const dealId = selectDealId({selectedAd, auctionSignals, inDebugMode});
  return {
    ad: {
      ...selectedAd.metadata,
      seller: browserSignals.seller,
      topLevelSeller: browserSignals.topLevelSeller,
    },
    bid: calculateBidAmount({
      trustedBiddingSignals,
      dealId,
      browserSignals,
      inDebugMode,
    }),
    bidCurrency: 'USD',
    allowComponentAuction: true,
    render: {
      url: selectedAd.renderURL,
      // Specify ad size for macro replacements.
      width: selectedAd.metadata.adSizes[0].width,
      height: selectedAd.metadata.adSizes[0].height,
    },
    // Specify selected deal ID for reporting.
    selectedBuyerAndSellerReportingId: dealId,
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

function getBidForMultipieceAd({
  interestGroup,
  auctionSignals,
  // UNUSED perBuyerSignals,
  trustedBiddingSignals,
  browserSignals,
  inDebugMode,
}) {
  // Select an ad meeting the auction requirements.
  const [selectedAd] = getAdsByType({
    interestGroup,
    adType: 'MULTIPIECE',
    inDebugMode,
  });
  if (!selectedAd) {
    return {bid: '0.0'};
  }
  // Check if any deals are eligible.
  const dealId = selectDealId({selectedAd, auctionSignals, inDebugMode});
  return {
    ad: {
      ...selectedAd.metadata,
      seller: browserSignals.seller,
      topLevelSeller: browserSignals.topLevelSeller,
    },
    bid: calculateBidAmount({
      trustedBiddingSignals,
      dealId,
      browserSignals,
      inDebugMode,
    }),
    bidCurrency: 'USD',
    allowComponentAuction: true,
    render: {
      url: selectedAd.renderURL,
      // Specify ad size for macro replacements.
      width: selectedAd.metadata.adSizes[0].width,
      height: selectedAd.metadata.adSizes[0].height,
    },
    // Specify selected deal ID for reporting.
    selectedBuyerAndSellerReportingId: dealId,
    // Use-case: Ad components
    adComponents: interestGroup.adComponents.map(
      ({renderUrl, width, height}) => ({
        url: renderUrl,
        width,
        height,
      }),
    ),
    targetNumAdComponents: 5,
    numMandatoryAdComponents: 1,
  };
}

function getBidByAdType(adType, biddingContext) {
  let bid;
  switch (adType) {
    case 'VIDEO':
      bid = getBidForVideoAd(biddingContext);
      break;
    case 'MULTIPIECE':
      bid = getBidForMultipieceAd(biddingContext);
      break;
    default: // Default to DISPLAY.
      bid = getBidForDisplayAd(biddingContext);
      break;
  }
  if (bid) {
    console.info(
      LOG_PREFIX,
      'returning bid to seller',
      biddingContext.browserSignals.seller,
      '\n\n',
      JSON.stringify(bid),
    );
  } else {
    console.error(
      LOG_PREFIX,
      'did not generate bid for seller',
      biddingContext.browserSignals.seller,
    );
  }
  return bid;
}

const BUCKET_SLOW_EXECUTION = 125;
const WEIGHT_SLOW_EXECUTION = 0.1;
const BUCKET_TOO_SLOW_EXECUTION = 126;
const WEIGHT_TOO_SLOW_EXECUTION = 0.2;

function monitorScriptExecutionLatency() {
  // contribute to histogram if worklet execution takes longer than X ms
  realTimeReporting.contributeToHistogram({
    bucket: BUCKET_SLOW_EXECUTION,
    priorityWeight: WEIGHT_SLOW_EXECUTION,
    latencyThreshold: 100,
  }); // In milliseconds
  // contribute to histogram if worklet execution takes longer than X ms
  // Note that the WEIGHT_TOO_SLOW_EXECUTION in this case is higher than the
  // previous WEIGHT_SLOW_EXECUTION.
  realTimeReporting.contributeToHistogram({
    bucket: BUCKET_TOO_SLOW_EXECUTION,
    priorityWeight: WEIGHT_TOO_SLOW_EXECUTION,
    latencyThreshold: 300,
  }); // In milliseconds
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
  console.group(
    `${CURRENT_HOST} generateBid() for seller: ${browserSignals.seller}`,
  );
  try {
    // Prepare for bidding.
    const biddingContext = {
      interestGroup,
      auctionSignals,
      perBuyerSignals,
      trustedBiddingSignals,
      browserSignals,
    };
    biddingContext.inDebugMode = inDebugMode(biddingContext);
    // First, register contributions for execution latency.
    monitorScriptExecutionLatency();
    // Next, check campaign status.
    if (!isCurrentCampaignActive(biddingContext)) {
      return;
    }
    // Assemble bid for ad slot type.
    return getBidByAdType(auctionSignals.adType, biddingContext);
  } finally {
    console.groupEnd();
  }
}

function reportWin(
  auctionSignals,
  perBuyerSignals,
  sellerSignals,
  browserSignals,
) {
  console.group(
    `${CURRENT_HOST} reportWin() for seller: ${browserSignals.seller}`,
  );
  try {
    // Assemble query parameters for event logs.
    let additionalQueryParams = browserSignals.renderURL.substring(
      browserSignals.renderURL.indexOf('?') + 1,
    );
    const reportingContext = {
      auctionId: auctionSignals.auctionId,
      pageURL: auctionSignals.pageURL,
      componentSeller: browserSignals.seller,
      topLevelSeller: browserSignals.topLevelSeller,
      renderURL: browserSignals.renderURL,
      bid: browserSignals.bid,
      bidCurrency: browserSignals.bidCurrency,
      buyerReportingId: browserSignals.buyerReportingId,
      buyerAndSellerReportingId: browserSignals.buyerAndSellerReportingId,
      selectedBuyerAndSellerReportingId:
        browserSignals.selectedBuyerAndSellerReportingId,
    };
    for (const [key, value] of Object.entries(reportingContext)) {
      additionalQueryParams = additionalQueryParams.concat(`&${key}=${value}`);
    }
    const winReportUrl =
      CURRENT_ORIGIN + `reporting?report=win&${additionalQueryParams}`;
    console.info(
      LOG_PREFIX,
      'reportWin() invoked for seller',
      browserSignals.seller,
    );
    console.debug(
      LOG_PREFIX,
      'reportWin() invoked\n\n',
      JSON.stringify({
        auctionSignals,
        perBuyerSignals,
        sellerSignals,
        browserSignals,
        reportingContext,
        sendReportToUrl: winReportUrl,
      }),
    );
    sendReportTo(winReportUrl);
    // Disable redirect chain temporarily to make ARA debugging easier.
    // additionalQueryParams = additionalQueryParams.concat(
    //   `&redirect=${browserSignals.seller}`,
    // );
    registerAdBeacon({
      'impression': `${browserSignals.interestGroupOwner}/reporting?report=impression&${additionalQueryParams}`,
      'reserved.top_navigation_start': `${browserSignals.interestGroupOwner}/reporting?report=top_navigation_start&${additionalQueryParams}`,
      'reserved.top_navigation_commit': `${browserSignals.interestGroupOwner}/reporting?report=top_navigation_commit&${additionalQueryParams}`,
    });
  } finally {
    console.groupEnd();
  }
}
