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

function log(label, o) {
  console.log(label, JSON.stringify(o, ' ', ' '));
}

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
  return {
    'ad': interestGroup.ads[0].metadata,
    'bid': Math.floor(Math.random() * 100, 10),
    'render': {
      'url': interestGroup.ads[0].renderURL,
      'width': interestGroup.ads[0].metadata.adSizes[0].width,
      'height': interestGroup.ads[0].metadata.adSizes[0].height,
    },
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
