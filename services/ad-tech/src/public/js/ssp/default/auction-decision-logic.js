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
 *   This is the 'default' auction decision logic for an SSP.
 *
 * What does this script do:
 *   This script is referenced in auction configurations to choose among bids
 *   in a Protected Audience auction.
 */

const CURRENT_HOST = '<%= HOSTNAME %>';
const CURRENT_ORIGIN = '<%= CURRENT_ORIGIN %>';
const LOG_PREFIX = '[PSDemo] <%= HOSTNAME %> decision logic:';

// ********************************************************
// Helper Functions
// ********************************************************
/** Returns whether running in debug mode. */
function inDebugMode(auctionConfig) {
  const debugFlag = `DEBUG_${CURRENT_HOST}`;
  if (
    debugFlag in auctionConfig.auctionSignals ||
    debugFlag in auctionConfig.sellerSignals
  ) {
    console.info(LOG_PREFIX, 'running in debug mode');
    return true;
  }
  return false;
}

/** Checks whether the bid is below the winning contextual bid. */
function isBidBelowAuctionFloor({
  // UNUSED adMetadata,
  bid,
  auctionConfig,
  // UNUSED trustedScoringSignals,
  browserSignals,
  inDebugMode,
}) {
  const {winningContextualBid} = auctionConfig.sellerSignals;
  if (!winningContextualBid) {
    console.warn(LOG_PREFIX, 'contextual winner not in seller signals');
    return false;
  }
  const isBidBelowAuctionFloor = bid < Number(winningContextualBid.bid);
  if (isBidBelowAuctionFloor && inDebugMode) {
    console.debug(
      LOG_PREFIX,
      browserSignals.interestGroupOwner,
      'bid is below auction floor (contextual winner)',
      JSON.stringify({bid, winningContextualBid, auctionConfig}),
    );
  }
  return isBidBelowAuctionFloor;
}

/** Checks real-time signals to see whether the ad creative is blocked. */
function isCreativeBlocked({
  // UNUSED adMetadata,
  // UNUSED bid,
  auctionConfig,
  trustedScoringSignals,
  browserSignals,
  inDebugMode,
}) {
  const {excludeCreativeTag} = auctionConfig.sellerSignals;
  if (!excludeCreativeTag) {
    return false; // No creative tags to exclude
  }
  const {renderURL} = browserSignals;
  if (trustedScoringSignals && trustedScoringSignals.renderURL[renderURL]) {
    const parsedScoringSignals = JSON.parse(
      trustedScoringSignals.renderURL[renderURL],
    );
    if (
      parsedScoringSignals &&
      parsedScoringSignals.tags &&
      parsedScoringSignals.tags.includes(excludeCreativeTag)
    ) {
      // Creative tag is to be excluded, reject bid.
      if (inDebugMode) {
        console.debug(
          LOG_PREFIX,
          browserSignals.interestGroupOwner,
          'bid rejected, creative blocked by publisher',
          JSON.stringify({
            parsedScoringSignals,
            trustedScoringSignals,
            renderURL,
            buyer: browserSignals.interestGroupOwner,
            dataVersion: browserSignals.dataVersion,
            scoringContext,
          }),
        );
      }
      return true;
    }
  }
  return false;
}

/** Checks whether the bid includes a valid and eligible deal ID. */
function doesBidHaveEligibleDeal({
  // UNUSED adMetadata,
  // UNUSED bid,
  auctionConfig,
  // UNUSED trustedScoringSignals,
  browserSignals,
  inDebugMode,
}) {
  const {availableDeals} = auctionConfig.auctionSignals;
  if (!availableDeals || !availableDeals.length) {
    return false; // No deals available.
  }
  const {selectedBuyerAndSellerReportingId} = browserSignals;
  const doesBidHaveEligibleDeal = availableDeals.includes(
    selectedBuyerAndSellerReportingId,
  );
  if (inDebugMode) {
    console.debug(
      LOG_PREFIX,
      browserSignals.interestGroupOwner,
      'bid, checking deal eligibility',
      JSON.stringify({
        availableDeals,
        selectedBuyerAndSellerReportingId,
        doesBidHaveEligibleDeal,
        trustedScoringSignals,
        adMetadata,
      }),
    );
  }
  return doesBidHaveEligibleDeal;
}

// ********************************************************
// Top-level decision logic functions
// ********************************************************
function scoreAd(
  adMetadata,
  bid,
  auctionConfig,
  trustedScoringSignals,
  browserSignals,
) {
  console.groupCollapsed(
    `${CURRENT_HOST} scoreAd() for buyer: ${browserSignals.interestGroupOwner}`,
  );
  const scoringContext = {
    adMetadata,
    bid,
    auctionConfig,
    trustedScoringSignals,
    browserSignals,
  };
  scoringContext.inDebugMode = inDebugMode(auctionConfig);
  if (scoringContext.inDebugMode) {
    console.debug(
      LOG_PREFIX,
      'scoreAd() invoked for buyer',
      browserSignals.interestGroupOwner,
      '\n\n',
      JSON.stringify(scoringContext),
    );
  }
  // Initialize ad score defaulting to a first-price auction.
  const score = {
    desirability: bid,
    allowComponentAuction: true,
  };
  // Check if ad creative is blocked.
  if (isCreativeBlocked(scoringContext)) {
    score.desirability = 0;
    score.rejectReason = 'disapproved-by-exchange';
    console.warn(
      LOG_PREFIX,
      browserSignals.interestGroupOwner,
      'bid rejected with blocked creative',
    );
    console.groupEnd();
    return score;
  }
  // Check if DSP responded with an eligible deal ID.
  const bidHasEligibleDeal = doesBidHaveEligibleDeal(scoringContext);
  const {strictRejectForDeals} = auctionConfig.auctionSignals;
  if (strictRejectForDeals && !bidHasEligibleDeal) {
    // Only accepting bids with eligible bids.
    score.desirability = 0;
    score.rejectReason = 'invalid-bid';
    console.warn(LOG_PREFIX, 'rejecting bid with ineligible deal', {
      scoringContext,
    });
    console.warn(
      LOG_PREFIX,
      browserSignals.interestGroupOwner,
      'bid rejected with ineligible deal',
    );
    console.groupEnd();
    return score;
  } else if (bidHasEligibleDeal) {
    // Boost desirability score by 10 points for bids with eligible deals.
    score.desirability = bid + 10.0;
    console.info(
      LOG_PREFIX,
      browserSignals.interestGroupOwner,
      'bid score boosted with eligible deal',
    );
    console.groupEnd();
    return score;
  }
  // Check if bid is below auction floor.
  if (isBidBelowAuctionFloor(scoringContext)) {
    score.desirability = 0;
    score.rejectReason = 'bid-below-auction-floor';
    console.warn(
      LOG_PREFIX,
      browserSignals.interestGroupOwner,
      'bid rejected, below auction floor',
    );
    console.groupEnd();
    return score;
  }
  // In all other cases, default to a first-price auction.
  console.info(
    LOG_PREFIX,
    browserSignals.interestGroupOwner,
    'bid scored\n\n',
    JSON.stringify(score),
  );
  console.groupEnd();
  return score;
}

function reportResult(auctionConfig, browserSignals) {
  console.groupCollapsed(
    `${CURRENT_HOST} reportResult() for buyer: ${browserSignals.interestGroupOwner}`,
  );
  const reportingContext = {
    auctionId: auctionConfig.auctionSignals.auctionId,
    pageURL: auctionConfig.auctionSignals.pageURL,
    topLevelSeller: browserSignals.topLevelSeller,
    winningBuyer: browserSignals.interestGroupOwner,
    renderURL: browserSignals.renderURL,
    bid: browserSignals.bid,
    bidCurrency: browserSignals.bidCurrency,
    buyerAndSellerReportingId: browserSignals.buyerAndSellerReportingId,
    selectedBuyerAndSellerReportingId:
      browserSignals.selectedBuyerAndSellerReportingId,
  };
  let reportUrl = auctionConfig.seller + '/reporting?report=result';
  for (const [key, value] of Object.entries(reportingContext)) {
    reportUrl = `${reportUrl}&${key}=${value}`;
  }
  console.info(
    LOG_PREFIX,
    'reportResult() invoked for buyer',
    browserSignals.interestGroupOwner,
  );
  console.debug(
    LOG_PREFIX,
    'reportResult() invoked for buyer',
    browserSignals.interestGroupOwner,
    '\n\n',
    JSON.stringify({
      auctionConfig,
      browserSignals,
      reportingContext,
      sendReportToUrl: reportUrl,
    }),
  );
  sendReportTo(reportUrl);
  console.groupEnd();
  return /* sellerSignals= */ {
    success: true,
    auctionId: auctionConfig.auctionSignals.auctionId,
    buyer: browserSignals.interestGroupOwner,
    reportUrl: auctionConfig.seller + '/reporting',
    signalsForWinner: {signalForWinner: 1},
  };
}
