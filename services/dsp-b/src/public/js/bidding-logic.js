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

const IMAGE_AD_TYPE = 'image';
const VIDEO_AD_TYPE = 'video';
const MULTI_PIECE_AD_TYPE = 'multi-piece';

function generateBid(
  interestGroup,
  auctionSignals,
  perBuyerSignals,
  trustedBiddingSignals,
  browserSignals,
) {
  const {ads, adComponents} = interestGroup;
  const {adType} = auctionSignals;
  const {seller, topLevelSeller} = browserSignals;

  let render;

  switch (adType) {
    case IMAGE_AD_TYPE:
      render = ads.find(
        ({metadata}) => metadata.adType === IMAGE_AD_TYPE,
      )?.renderUrl;
      break;
    case VIDEO_AD_TYPE:
      // We look through the video ads passed in from the interest group and
      // select the ad that matches the component seller's origin
      render = ads.find(
        ({metadata}) =>
          metadata.adType === VIDEO_AD_TYPE && metadata.seller.includes(seller),
      ).renderUrl;
      break;
    case MULTI_PIECE_AD_TYPE:
      render = ads.find(
        ({metadata}) => metadata.adType === MULTI_PIECE_AD_TYPE,
      ).renderUrl;
      break;
  }

  return {
    // We return a random bid of 0 to 100
    bid: Math.floor(Math.random() * 100, 10),
    render,
    adComponents: adComponents.map(({renderUrl}) => ({url: renderUrl})),
    allowComponentAuction: !!topLevelSeller,
  };
}

function reportWin(
  auctionSignals,
  perBuyerSignals,
  sellerSignals,
  browserSignals,
) {
  sendReportTo(browserSignals.interestGroupOwner + `/reporting?report=win`);
}
