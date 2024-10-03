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
 * This is the 'default' auction decision logic for an SSP.
 * 
 * This script is referenced in auction configurations to choose among bids in
 * a Protected Audience auction.
 */

// ********************************************************
// Helper Functions
// ********************************************************
/** Logs to console. */
function log(label, o) {
  console.log('[PSDemo]', label, JSON.stringify(o, ' ', ' '));
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
  log('scoreAd', {
    adMetadata,
    bid,
    auctionConfig,
    trustedScoringSignals,
    browserSignals,
  });
  const parsedScoringSignals = JSON.parse(
    trustedScoringSignals?.renderURL[browserSignals.renderURL],
  );
  if (parsedScoringSignals?.label.toUpperCase() === 'BLOCKED') {
    // Reject bid if creative is blocked.
    return {
      desirability: 0,
      allowComponentAuction: true,
      rejectReason: 'blocked-by-publisher',
    };
  }
  const {buyerAndSellerReportingId, selectedBuyerAndSellerReportingId} =
    browserSignals;
  log('Reporting IDs', {
    buyerAndSellerReportingId,
    selectedBuyerAndSellerReportingId,
  });
  return {
    desirability: bid,
    allowComponentAuction: true,
    // incomingBidInSellerCurrency: optional
  };
}

function reportResult(auctionConfig, browserSignals) {
  log('reportResult', {auctionConfig, browserSignals});
  sendReportTo(auctionConfig.seller + '/reporting?report=result');
  return {
    success: true,
    signalsForWinner: {signalForWinner: 1},
    reportUrl: auctionConfig.seller + '/reporting',
  };
}
