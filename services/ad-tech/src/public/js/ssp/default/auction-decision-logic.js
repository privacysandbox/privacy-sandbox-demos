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

// ********************************************************
// Helper Functions
// ********************************************************
CURR_HOST = '';
AUCTION_ID = '';
/** Logs to console. */
function log(message, context) {
  console.log(
    '[PSDemo] Seller',
    CURR_HOST,
    'decision logic',
    AUCTION_ID,
    message,
    JSON.stringify({context}, ' ', ' '),
  );
}

/** Logs execution context for demonstrative purposes. */
function logContextForDemo(message, context) {
  const {
    // UNUSED adMetadata,
    // UNUSED bid,
    auctionConfig,
    // UNUSED trustedScoringSignals,
    browserSignals,
  } = context;
  CURR_HOST = auctionConfig.seller.substring('https://'.length);
  AUCTION_ID = auctionConfig.auctionSignals.auctionId;
  log(message, context);
  // Log reporting IDs if found.
  const {buyerAndSellerReportingId, selectedBuyerAndSellerReportingId} =
    context.browserSignals;
  if (buyerAndSellerReportingId || selectedBuyerAndSellerReportingId) {
    log('found reporting IDs', {
      buyerAndSellerReportingId,
      selectedBuyerAndSellerReportingId,
    });
  }
}

/** Returns a rejection score response if scored creative is blocked. */
function getRejectScoreIfCreativeBlocked(scoringContext) {
  const {
    // UNUSED adMetadata,
    // UNUSED bid,
    // UNUSED auctionConfig,
    trustedScoringSignals,
    browserSignals,
  } = scoringContext;
  const {renderURL} = browserSignals;
  if (trustedScoringSignals && trustedScoringSignals.renderURL[renderURL]) {
    const parsedScoringSignals = JSON.parse(
      trustedScoringSignals.renderURL[renderURL],
    );
    if (
      parsedScoringSignals &&
      'BLOCKED' === parsedScoringSignals.label.toUpperCase()
    ) {
      // Reject bid if creative is blocked.
      log('rejecting bid blocked by publisher', {
        parsedScoringSignals,
        trustedScoringSignals,
        renderURL,
        buyer: browserSignals.interestGroupOwner,
        dataVersion: browserSignals.dataVersion,
        scoringContext,
      });
      return {
        desirability: 0,
        allowComponentAuction: true,
        rejectReason: 'blocked-by-publisher',
      };
    }
  }
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
  logContextForDemo('scoreAd()', scoringContext);
  const rejectScore = getRejectScoreIfCreativeBlocked(scoringContext);
  if (rejectScore) {
    return rejectScore;
  }
  return {
    desirability: bid,
    allowComponentAuction: true,
    // incomingBidInSellerCurrency: optional
  };
}

function reportResult(auctionConfig, browserSignals) {
  logContextForDemo('reportResult()', {auctionConfig, browserSignals});
  sendReportTo(auctionConfig.seller + '/reporting?report=result');
  return /* sellerSignals= */ {
    success: true,
    auctionId: AUCTION_ID,
    buyer: browserSignals.interestGroupOwner,
    reportUrl: auctionConfig.seller + '/reporting',
    signalsForWinner: {signalForWinner: 1},
  };
}
