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

function scoreAd(
  adMetadata,
  bid,
  auctionConfig,
  trustedScoringSignals,
  browserSignals,
) {
  let desirability;

  // If it's a video ad, there is no contextual video auction in this demo to compare
  // the bid against, so we just return the desirability score as the bid itself,
  // and the highest bid will win the auction
  if (auctionConfig.sellerSignals.adType === 'video') {
    desirability = bid;
  } else {
    // For an image ad, we compare the PA auction bid against the bid floor set by the
    // winner of the contextual auction (header bidding + ad server auctions)
    // If the contexual auction bid is higher, then we return 0 to filter out this ad
    const {bidFloor} = auctionConfig.sellerSignals;
    desirability = bid > bidFloor ? bid : 0;
  }

  return {
    desirability,
    allowComponentAuction: true,
  };
}

function reportResult(auctionConfig, browserSignals) {
  sendReportTo(auctionConfig.seller + '/reporting?report=result');
  return {
    success: true,
    signalsForWinner: {signalForWinner: 1},
    reportUrl: auctionConfig.seller + '/report_seller',
  };
}
