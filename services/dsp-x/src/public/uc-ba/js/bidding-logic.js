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
  // console.log('$$$ interestGroup', { interestGroup })
  // console.log('$$$ auctionSignals', { auctionSignals })
  // console.log('$$$ perBuyerSignals', { perBuyerSignals })
  // console.log('$$$ trustedBiddingSignals', { trustedBiddingSignals })
  // console.log('$$$ browserSignals', { browserSignals })

  return {
    bid: Math.ceil(Math.random() * 100),
    render:
      'https://privacy-sandbox-demos-dsp-x.dev/uc-ba/html/protected-audience-ad.html',
    allowComponentAuction: !!browserSignals.topLevelSeller,
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
