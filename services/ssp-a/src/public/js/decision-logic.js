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

function scoreAd(
  adMetadata,
  bid,
  auctionConfig,
  trustedScoringSignals,
  browserSignals,
) {
  return {
    desirability: 1,
    allowComponentAuction: true,
  };
}

function reportResult(auctionConfig, browserSignals) {
  sendReportTo(auctionConfig.seller + '/reporting?report=result');
  return {
    success: true,
    signalsForWinner: {signalForWinner: 1},
    reportUrl: auctionConfig.seller + '/reporting',
  };
}
