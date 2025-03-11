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
  ADVERTISER_CONTEXTUAL,
  EXTERNAL_PORT,
  HOSTNAME,
  PORT,
  NEWS_HOST,
  SHOP_HOST,
  TRAVEL_HOST,
  PUBLISHER_IDS,
} from './constants.js';

/** Returns template variables for the contextual advertiser. */
export const getContextualAdTemplateVariables = () => {
  const registerSourceUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/attribution/register-source`,
  );
  registerSourceUrl.searchParams.append('advertiser', ADVERTISER_CONTEXTUAL);
  return {
    TITLE: `Contextual ads from ${ADVERTISER_CONTEXTUAL}`,
    DESTINATION: new URL(`https://${TRAVEL_HOST}:${EXTERNAL_PORT}`).toString(),
    CREATIVE: new URL( // Doughnut image.
      `https://${HOSTNAME}:${EXTERNAL_PORT}/img/emoji_u1f369.svg`,
    ).toString(),
    ATTRIBUTION_SRC: registerSourceUrl.toString(),
  };
};

/** Returns variables for use in the ad template for Protected Audience. */
export const getInterestGroupAdTemplateVariables = (requestQuery: any) => {
  const advertiser = requestQuery.advertiser?.toString() || HOSTNAME!;
  const destination = new URL(`https://${advertiser}:${EXTERNAL_PORT}`);
  const creative = new URL(`https://${advertiser}:${EXTERNAL_PORT}`);
  const registerSourceUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/attribution/register-source`,
  );
  registerSourceUrl.searchParams.append('advertiser', advertiser);
  const itemId = requestQuery.itemId?.toString() || '';
  if (itemId) {
    // Load specific ad for SHOP advertiser.
    destination.pathname = `/items/${itemId}`;
    creative.pathname = `/ads/${itemId}`;
    registerSourceUrl.searchParams.append('itemId', itemId);
  } else {
    if (HOSTNAME === advertiser) {
      // If advertiser is current ad-tech itself, show static ad.
      creative.pathname = '/img/emoji_u1f4b0.svg'; // Bag of cash image.
    } else {
      creative.pathname = '/ads';
    }
  }
  return {
    TITLE: `Your special ads from ${advertiser}`,
    DESTINATION: destination,
    CREATIVE: creative,
    ATTRIBUTION_SRC: registerSourceUrl.toString(),
  };
};

/** Returns variables for use in the static ad templates. */
export const getStaticAdTemplateVariables = (
  requestQuery: any,
  requestHeaders: any,
) => {
  // Assemble URL for registering attribution source with ARA, and include all
  // query parameters from the ad URL in source registration context.
  const registerSourceUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/attribution/register-source`,
  );
  for (const [key, value] of Object.entries(requestQuery)) {
    registerSourceUrl.searchParams.append(key, value as string);
  }
  // Default to blue running shoe ad, unless overriden in URL query.
  const itemId = requestQuery.itemId?.toString() || '1f45f';
  /** TODO(sidsahoo): When and why does this need to be set to false? */
  const enableWriteImpression =
    requestQuery.enableWriteImpression?.toString() != 'false';
  const publisherHost = requestHeaders.referer
    ? new URL(requestHeaders.referer).hostname
    : NEWS_HOST!;
  return {
    TITLE: `Your special ads from ${SHOP_HOST}`,
    DESTINATION: new URL(
      `https://${SHOP_HOST}:${EXTERNAL_PORT}/items/${itemId}`,
    ),
    CREATIVE: new URL(`https://${SHOP_HOST}:${EXTERNAL_PORT}/ads/${itemId}`),
    ATTRIBUTION_SRC: registerSourceUrl.toString(),
    PUBLISHER_ID: PUBLISHER_IDS[publisherHost] || '9999',
    CAMPAIGN_ID: 1234,
    ENABLE_WRITE_IMPRESSION: enableWriteImpression,
  };
};

/** Returns EJS template variables for EJS files. */
export const getEjsTemplateVariables = (titleMessage: string = '') => {
  const hostDetails = {
    HOSTNAME,
    EXTERNAL_PORT,
    PORT,
    SHOP_HOST,
    TITLE: `${HOSTNAME} - ${titleMessage}`,
  };
  console.log('Built template context: ', hostDetails);
  return hostDetails;
};

/** Returns the given argument as a structured stringified object. */
export const getStructuredObject = (obj: any): {[key: string]: string} => {
  const params: {[key: string]: string} = {};
  for (const [key, value] of Object.entries(obj)) {
    params[key] = value as string;
  }
  return params;
};
