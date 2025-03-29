// FIXME: Refactor this file into a specific use-case.
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
 * This script is used to demonstrate passing page context data such as
 * top-level page URL search params into a Shared Storage worklet.
 *
 * What does this script do:
 * This script uses the Private Aggregation API to contribute to the aggregate
 * histogram. This operation allows for local testing by overriding key
 * variables using the page URL, such as bucketKey, bucketValue, scaleFactor,
 * and contextId.
 */
class TestPrivateAggregation {
  async run(data) {
    if ('debug' in data) {
      debugger;
    }
    let {bucketKey, bucketValue, contextId, scaleFactor} = data;
    if (!contextId) {
      contextId = BigInt(Math.floor(Math.random() * Math.pow(2, 64)));
    }
    if (!bucketKey) {
      bucketKey = BigInt('1234567890');
    }
    if (!bucketValue) {
      bucketValue = 1;
    }
    if (scaleFactor) {
      bucketValue *= scaleFactor;
    }
    // Finally, contribute to aggregate histogram.
    privateAggregation.enableDebugMode({debugKey: contextId});
    privateAggregation.contributeToHistogram({
      bucket: bucketKey,
      value: bucketValue,
    });
    console.info('[PSDemo] Contributed to histogram with Private Aggregation', {
      bucketKey,
      bucketValue,
      contextId,
      debugKey: contextId,
      data,
    });
  }
}

register('test-private-aggregation', TestPrivateAggregation);
