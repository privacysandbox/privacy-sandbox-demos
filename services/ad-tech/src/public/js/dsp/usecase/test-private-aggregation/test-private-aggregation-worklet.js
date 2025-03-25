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
 * TODO: This script needs to be refactored into a specific use-case.
 *
 * This is a simple script to test aggregate reporting with Shared Storage and
 * Private Aggregation. This script is executed inside a Shared Storage
 * worklet.
 */
class TestPrivateAggregation {
  async run(data) {
    /** Helper method to encode bucket key. */
    const convertToBucket = (bucketId) => {
      // TODO: Implement
      return BigInt(bucketId);
    };
    // Enable debug mode.
    privateAggregation.enableDebugMode({debugKey: 1234n});
    // Assemble aggregate contribution bucket key.
    let {bucketKey} = data;
    if (!bucketKey) {
      bucketKey = '1234567890';
    }
    // Finally, contribute to aggregate histogram.
    privateAggregation.contributeToHistogram({
      bucket: convertToBucket(bucketKey),
      value: 1,
    });
    // sharedStorage.clear();
  }
}

register('test-private-aggregation', TestPrivateAggregation);
