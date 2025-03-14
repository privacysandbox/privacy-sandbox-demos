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
    let cloudEnv = await sharedStorage.get('cloudenv');
    console.log(`Enabling ${cloudEnv} Private Aggregation Debug Mode`);
    privateAggregation.enableDebugMode({debugKey: 1234n});
    let bucketKey = await sharedStorage.get('bucket');
    if (!bucketKey) {
      console.log(
        '[PSDemo] No bucket key found for client. ',
        'Adding default bucketKey 1234567890.',
      );
      bucketKey = '1234567890';
      sharedStorage.set('bucketKey', bucketKey);
    } else {
      console.log('[PSDemo] Bucket Key found: ', {bucketKey});
    }
    function convertToBucket(bucketId) {
      return BigInt(bucketId);
    }
    const bucket = convertToBucket(bucketKey);
    const value = 128;
    privateAggregation.contributeToHistogram({bucket, value});
    sharedStorage.clear();
  }
}

register('test-private-aggregation', TestPrivateAggregation);
