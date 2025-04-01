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
const LOG_PREFIX = '[PSDemo] <%= HOSTNAME %> top-level seller decision logic';

// ********************************************************
// Helper Functions
// ********************************************************
function getAuctionId(auctionConfig, componentSeller) {}

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
  console.info(LOG_PREFIX, 'scoreAd() invoked', {
    adMetadata,
    bid,
    auctionConfig,
    trustedScoringSignals,
    browserSignals,
  });
  return {
    desirability: bid,
    allowComponentAuction: true,
    // incomingBidInSellerCurrency: optional
  };
}

function reportResult(auctionConfig, browserSignals) {
  const winningComponentSeller = browserSignals.componentSeller;
  const winningComponentAuctionConfig = auctionConfig.componentAuctions.find(
    (componentAuction) => winningComponentSeller === componentAuction.seller,
  );
  const reportingContext = {
    auctionId: winningComponentAuctionConfig.auctionSignals.auctionId,
    pageURL: winningComponentAuctionConfig.auctionSignals.pageURL,
    winningComponentSeller,
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
  return {
    success: true,
    auctionId: winningComponentAuctionConfig.auctionSignals.auctionId,
    buyer: browserSignals.interestGroupOwner,
    reportUrl: auctionConfig.seller + '/reporting',
    signalsForWinner: {signalForWinner: 1},
  };
}
