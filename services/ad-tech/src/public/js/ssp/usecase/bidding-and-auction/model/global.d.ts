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

declare global {
  // Adds auctionInfoCollector function to the global window object.
  interface Window {
    auctionInfoCollector?: any;
  }
  /*
   * Adds the getInterestGroupAdAuctionData and
   * runAdAuction functions to the global navigator object.
   */
  interface Navigator {
    getInterestGroupAdAuctionData?: function;
    runAdAuction?: function;
  }
  // Adds adAuctionHeaders function to the interface used when making fetch requests.
  interface RequestInit {
    adAuctionHeaders?: boolean;
  }

  interface HTMLElement {
    config: FencedFrameConfig;
  }
}

export default global;
