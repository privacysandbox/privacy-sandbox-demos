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

function generateBid(
  interestGroup,
  auctionSignals,
  perBuyerSignals,
  trustedBiddingSignals,
  browserSignals,
) {
  const {ads} = interestGroup;
  const {adType} = auctionSignals;
  const {seller, topLevelSeller} = browserSignals;

  let render;

  if (adType === 'image') {
    render = ads.find((ad) => ad.metadata.adType === 'image')?.renderUrl;
  } else if (adType === 'video') {
    // We look through the video ads passed in from the interest group and
    // select the ad that matches the component seller's origin
    render = ads.find(
      (ad) =>
        ad.metadata.adType === 'video' && ad.metadata.seller.includes(seller),
    ).renderUrl;
  }

  const response = {
    // We return a random bid of 0 to 100
    bid: Math.floor(Math.random() * 100, 10),
    render,
    allowComponentAuction: !!topLevelSeller,
  };

  return response;
}

function reportWin(
  auctionSignals,
  perBuyerSignals,
  sellerSignals,
  browserSignals,
) {
  sendReportTo(browserSignals.interestGroupOwner + `/reporting?report=win`);
}
