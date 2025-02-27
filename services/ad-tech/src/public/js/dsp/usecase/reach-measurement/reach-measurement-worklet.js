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
 * Where is this script used:
 *   This script is included in Shared Storage Reach Measurement, and is executed
 *   when an ad is delivered by this ad-tech on a publisher page.
 *
 * What does this script do:
 *
 * This script utilizes the shared storage key "has-reported-content" to identify
 * browsers that have previously contributed to Aggrigations reports for the given contentId.
 *
 * If the browser has NOT previously contributed to the Aggregation report,  the "privateAggregation.contributeToHistogram" functun is called.
 */
const SCALE_FACTOR = 65536;
function convertContentIdToBucket(contentId) {
  return BigInt(contentId);
}

class ReachMeasurementOperation {
  async run(data) {
    const {contentId} = data;

    // Read from Shared Storage
    const key = 'has-reported-content: ' + contentId;
    const hasReportedContent = (await sharedStorage.get(key)) === 'true';

    // Do not report if a report has been sent already
    if (hasReportedContent) {
      console.log('Content ID already seen:  ' + key);
      return;
    }

    // Generate the aggregation key and the aggregatable value
    const bucket = convertContentIdToBucket(contentId);
    const value = 1 * SCALE_FACTOR;

    console.log('bucket:', bucket);

    // Send an aggregatable report via the Private Aggregation API
    console.log('contributeToHistogram:');
    privateAggregation.contributeToHistogram({bucket, value});
    // Set the report submission status flag
    console.log('Shared Storage key ' + key + ' stored');
    await sharedStorage.set(key, true);
  }
}

// Register the operation
register('reach-measurement', ReachMeasurementOperation);
