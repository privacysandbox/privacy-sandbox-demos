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

import {
  EXTERNAL_PORT,
  HOSTNAME,
  MACRO_DISPLAY_RENDER_URL_AD_SIZE,
  MACRO_VIDEO_RENDER_URL_SSP_VAST,
} from './constants.js';

/** Supported ad types. */
export enum AdType {
  DISPLAY = 'DISPLAY',
  VIDEO = 'VIDEO',
}

/** Generalized interface for an interest group ad object. */
export interface InterestGroupAd {
  // REQUIRED FIELDS
  renderURL: string;
  metadata: {
    advertiser: string;
    adType: AdType;
    adSizes?: {width: string; height: string}[];
  };
  // OPTIONAL FIELDS
  sizeGroup?: string;
  // [Optional] Reporting IDs
  selectableBuyerAndSellerReportingIds?: string[];
  buyerReportingId?: string;
  buyerAndSellerReportingId?: string;
}

// ****************************************************************************
// HELPER FUNCTIONS
// ****************************************************************************
/** Returns video ads for a given advertiser and SSP hosts to integrate. */
const getVideoAdForRequest = (advertiser: string): InterestGroupAd => {
  const renderUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/ads/video-ads?`,
  );
  renderUrl.searchParams.append('advertiser', advertiser);
  return {
    renderURL: `${renderUrl.toString()}&${MACRO_VIDEO_RENDER_URL_SSP_VAST}`,
    metadata: {
      advertiser,
      adType: AdType.VIDEO,
    },
    selectableBuyerAndSellerReportingIds: ['deal1', 'deal2', 'deal3'],
    buyerReportingId: 'buyerSpecificInfo1',
    buyerAndSellerReportingId: 'seatid-1234',
  };
};

/** Returns the interest group display ad to for the given advertiser. */
const getDisplayAdForRequest = (
  advertiser: string,
  itemId?: string,
): InterestGroupAd => {
  const renderUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/ads/display-ads`,
  );
  renderUrl.searchParams.append('advertiser', advertiser);
  if (itemId) {
    renderUrl.searchParams.append('itemId', itemId);
  }
  return {
    renderURL: `${renderUrl.toString()}&${MACRO_DISPLAY_RENDER_URL_AD_SIZE}`,
    metadata: {
      advertiser,
      adType: AdType.DISPLAY,
      adSizes: [{width: '300px', height: '250px'}],
    },
    sizeGroup: 'medium-rectangle',
    selectableBuyerAndSellerReportingIds: ['deal1', 'deal2', 'deal3'],
    buyerReportingId: 'buyerSpecificInfo1',
    buyerAndSellerReportingId: 'seatid-1234',
  };
};

// ****************************************************************************
// EXPORTED FUNCTIONS
// ****************************************************************************
/** Returns the interest groups ads for the given advertiser. */
export const getAdsForRequest = (
  advertiser: string,
  itemId?: string,
): InterestGroupAd[] => {
  // Include all types of ads in the interest group and filter based on
  // opportunity at bidding time.
  return [
    getDisplayAdForRequest(advertiser, itemId),
    getVideoAdForRequest(advertiser),
  ];
};
