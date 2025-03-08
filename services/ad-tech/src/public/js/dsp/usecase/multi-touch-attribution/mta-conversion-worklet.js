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

function generateAggregationKey(campaignId, publisherId) {
  const aggregationKey = BigInt(`${campaignId}${publisherId}`);
  return aggregationKey;
}

class MultiTouchAttributionConversion {
  async run(data) {
    const {campaignId, purchaseValue} = data;
    console.log('[PSDemo] Purchase value for MTA Conversion', purchaseValue);

    // Read from Shared Storage
    const impressionContextSSKey = 'impressionContext' + campaignId;
    console.log('[PSDemo] Reading from Shared Storage', impressionContextSSKey);
    let impressions = await sharedStorage.get(impressionContextSSKey);

    // Do not report if there isn't any impression
    if (!impressions) {
      console.log(
        "[PSDemo] Couldn't find impressions in Shared Storage",
        impressionContextSSKey,
      );
      return;
    }

    // Impressions saved in the Shared Storage will have this format:
    // "|{"publisherId":"1000","campaignId":"123","timestamp":1723061856804}|{"publisherId":"2000","campaignId":"123","timestamp":1723061876437}|..."
    // So, we need to split using the delimeter '|' after removing the first character

    impressions = impressions.substring(1);
    const impressionsArray = impressions.split('|');
    const numberImpressions = impressionsArray.length;

    console.log('[PSDemo] Found impressions', numberImpressions);

    // Custom logic for Multi Touch Attribution
    // In this example, we are splitting the total purchase value of this
    // campaign equally between all impressions (which might have duplicate
    // publishers)

    impressionsArray.forEach((impression) => {
      let impressionParsed = JSON.parse(impression);

      // Generate the aggregation key and the aggregatable value
      const bucket = generateAggregationKey(
        campaignId,
        impressionParsed.publisherId,
      );
      const value =
        Math.floor(purchaseValue / numberImpressions) * SCALE_FACTOR;

      // Send an aggregatable report via the Private Aggregation API
      console.log('[PSDemo] contributeToHistogram', {bucket, value});
      privateAggregation.contributeToHistogram({bucket, value});
    });

    // Delete these impressions after the conversion and reporting
    await sharedStorage.delete(impressionContextSSKey);
    console.log('[PSDemo] Deleted Shared Storage key', impressionContextSSKey);
  }
}

// Register the operation
register('mta-conversion', MultiTouchAttributionConversion);
