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

const CURR_HOST = '<%= HOSTNAME %>';
const CURR_ORIGIN = '<%= CURRENT_ORIGIN %>';
const LOG_PREFIX = '[PSDemo] <%= HOSTNAME %> decision logic';

// ********************************************************
// Helper Functions
// ********************************************************
/** Checks whether the bid is below the winning contextual bid. */
function isBidBelowAuctionFloor({
  // UNUSED adMetadata,
  bid,
  auctionConfig,
  // UNUSED trustedScoringSignals,
  // UNUSED browserSignals,
}) {
  const {winningContextualBid} = auctionConfig.sellerSignals;
  if (!winningContextualBid) {
    return false;
  }
  return bid < Number(winningContextualBid.bid);
}

/** Checks real-time signals to see whether the ad creative is blocked. */
function isCreativeBlocked(scoringContext) {
  const {
    // UNUSED adMetadata,
    // UNUSED bid,
    auctionConfig,
    trustedScoringSignals,
    browserSignals,
  } = scoringContext;
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
      console.debug(LOG_PREFIX, 'rejecting bid blocked by publisher', {
        parsedScoringSignals,
        trustedScoringSignals,
        renderURL,
        buyer: browserSignals.interestGroupOwner,
        dataVersion: browserSignals.dataVersion,
        scoringContext,
      });
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
}) {
  const {availableDeals} = auctionConfig.auctionSignals;
  if (!availableDeals || !availableDeals.length) {
    return false; // No deals available.
  }
  const {selectedBuyerAndSellerReportingId} = browserSignals;
  return availableDeals.includes(selectedBuyerAndSellerReportingId);
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
  const scoringContext = {
    adMetadata,
    bid,
    auctionConfig,
    trustedScoringSignals,
    browserSignals,
  };
  console.debug(LOG_PREFIX, 'scoreAd() invoked', {scoringContext});
  // Initialize ad score defaulting to a first-price auction.
  const score = {
    desirability: bid,
    allowComponentAuction: true,
  };
  // Check if ad creative is blocked.
  if (isCreativeBlocked(scoringContext)) {
    score.desirability = 0;
    score.rejectReason = 'disapproved-by-exchange';
    console.warn(LOG_PREFIX, 'rejecting bid with blocked creative', {
      scoringContext,
    });
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
    return score;
  } else if (bidHasEligibleDeal) {
    // Boost desirability score by 10 points for bids with eligible deals.
    score.desirability = bid + 10.0;
    console.info(LOG_PREFIX, 'boosting bid with eligible deal', {
      scoringContext,
    });
    return score;
  }
  // Check if bid is below auction floor.
  if (isBidBelowAuctionFloor(scoringContext)) {
    score.desirability = 0;
    score.rejectReason = 'bid-below-auction-floor';
    console.warn(LOG_PREFIX, 'rejecting bid below auction floor', {
      scoringContext,
    });
    return score;
  }
  // In all other cases, default to a first-price auction.
  console.info(LOG_PREFIX, 'scored bid', {scoringContext, score});
  return score;
}

function reportResult(auctionConfig, browserSignals) {
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
  console.info(LOG_PREFIX, 'reportResult() invoked', {
    auctionConfig,
    browserSignals,
    reportingContext,
    sendReportToUrl: reportUrl,
  });
  sendReportTo(reportUrl);
  return /* sellerSignals= */ {
    success: true,
    auctionId: auctionConfig.auctionSignals.auctionId,
    buyer: browserSignals.interestGroupOwner,
    reportUrl: auctionConfig.seller + '/reporting',
    signalsForWinner: {signalForWinner: 1},
  };
}
