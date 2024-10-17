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
  PORT,
  EXTERNAL_PORT,
  HOSTNAME,
  SHOP_HOST,
  DSP_HOST,
  DSP_A_HOST,
  DSP_B_HOST,
  SSP_HOST,
  SSP_A_HOST,
  SSP_B_HOST,
  DSP_DETAIL,
  DSP_A_DETAIL,
  DSP_B_DETAIL,
  SSP_DETAIL,
  SSP_A_DETAIL,
  SSP_B_DETAIL,
} from '../lib/constants.js';

/** Returns variables for use in the ad template. */
export const getAdTemplateVariables = (requestQuery: any) => {
  // Initialize template variables.
  const advertiser = requestQuery.advertiser || HOSTNAME;
  let destination = new URL(
    `https://${advertiser}:${EXTERNAL_PORT}`,
  ).toString();
  let creative = new URL(
    `https://${advertiser}:${EXTERNAL_PORT}/ads`,
  ).toString();
  const registerSourceUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/attribution/register-source`,
  );
  registerSourceUrl.searchParams.append('advertiser', advertiser);
  // Load specific ad for SHOP advertiser.
  if (requestQuery.itemId && SHOP_HOST === advertiser) {
    destination = new URL(
      `https://${advertiser}:${EXTERNAL_PORT}/items/${requestQuery.itemId}`,
    ).toString();
    creative = new URL(
      `https://${advertiser}:${EXTERNAL_PORT}/ads/${requestQuery.itemId}`,
    ).toString();
    registerSourceUrl.searchParams.append('itemId', requestQuery.itemId);
  }
  // If advertiser is current ad-tech itself, show static ad.
  if (HOSTNAME === advertiser) {
    creative = new URL( // Bag of cash image.
      `https://${HOSTNAME}:${EXTERNAL_PORT}/img/emoji_u1f4b0.svg`,
    ).toString();
  } else if ('contextual' === advertiser) {
    creative = new URL( // Doughnut image.
      `https://${HOSTNAME}:${EXTERNAL_PORT}/img/emoji_u1f369.svg`,
    ).toString();
  }
  return {
    title: `Your special ads from ${advertiser}`,
    destination,
    creative,
    registerSource: registerSourceUrl.toString(),
  };
};

/** Returns EJS template variables for current host. */
export const getTemplateVariables = (titleMessage: string = '') => {
  const hostDetails = {
    HOSTNAME,
    EXTERNAL_PORT,
    PORT,
    SHOP_HOST,
    title: [getAdTechDetail(HOSTNAME), titleMessage].join(' - '),
  };
  console.log('Built template context: ', hostDetails);
  return hostDetails;
};

/** Returns the mapped ad tech label. */
const getAdTechDetail = (adTechHost?: string): string | undefined => {
  switch (adTechHost) {
    case DSP_HOST:
      return DSP_DETAIL;
    case DSP_A_HOST:
      return DSP_A_DETAIL;
    case DSP_B_HOST:
      return DSP_B_DETAIL;
    case SSP_HOST:
      return SSP_DETAIL;
    case SSP_A_HOST:
      return SSP_A_DETAIL;
    case SSP_B_HOST:
      return SSP_B_DETAIL;
    default:
      return 'FIXME: UNKNOWN HOST';
  }
};
