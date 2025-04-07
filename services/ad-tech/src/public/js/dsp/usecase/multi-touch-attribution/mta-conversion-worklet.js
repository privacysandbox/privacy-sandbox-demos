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

/**
 * Where is this script used: TODO(sidneyzanetti)
 *
 * What does this script do: TODO(sidneyzanetti)
 */
const SCALE_FACTOR = 256;

function getImpressionContextSSKey(campaignId) {
  return `impressionContext${campaignId}`;
}

function generateAggregationKey(campaignId, publisherId) {
  const aggregationKey = BigInt(`${campaignId}${publisherId}`);
  return aggregationKey;
}

async function getImpressionsFromSharedStorage(campaignId) {
  const impressionContextSSKey = getImpressionContextSSKey(campaignId);
  const impressions = await sharedStorage.get(impressionContextSSKey);
  if (!impressions) {
    console.warn('[PSDemo] No impressions found in Shared Storage', {
      campaignId,
      impressionContextSSKey,
    });
    return [];
  }
  // Impressions saved in the Shared Storage will have this format:
  // "|{"publisherId":"1000","campaignId":"123","timestamp":1723061856804}|{"publisherId":"2000","campaignId":"123","timestamp":1723061876437}|..."
  // So, we need to split using the delimeter '|' after removing the first character.
  const impressionsArray = impressions.substring(1).split('|');
  try {
    return impressionsArray.map((impression) => JSON.parse(impression));
  } catch (error) {
    console.error('[PSDemo] Error parsing impressions', {
      error,
      impressionContextSSKey,
      impressionsArray,
    });
    return [];
  }
}

async function deleteImpressionsFromSharedStorage(campaignId) {
  const impressionContextSSKey = getImpressionContextSSKey(campaignId);
  await sharedStorage.delete(impressionContextSSKey);
  console.info('[PSDemo] Deleted Shared Storage key', impressionContextSSKey);
}

class MultiTouchAttributionConversion {
  async run(data) {
    // debugger;
    // Enable debug mode.
    privateAggregation.enableDebugMode({debugKey: 1234n});
    console.debug('[PSDemo] MTA conversion worklet triggered', {data});
    const {campaignId, purchaseValue} = data;
    // Custom logic for Multi Touch Attribution
    // In this example, we are splitting the total purchase value of this
    // campaign equally between all impressions (which might have duplicate
    // publishers).
    const impressions = await getImpressionsFromSharedStorage(campaignId);
    for (const impression of impressions) {
      const bucket = generateAggregationKey(campaignId, impression.publisherId);
      const value =
        Math.floor(purchaseValue / impressions.length) * SCALE_FACTOR;
      console.info('[PSDemo] MTA conversion contributeToHistogram', {
        bucket,
        value,
        impression,
      });
      privateAggregation.contributeToHistogram({bucket, value});
    }
    deleteImpressionsFromSharedStorage(campaignId);
  }
}

// Register the operation
register('mta-conversion', MultiTouchAttributionConversion);
