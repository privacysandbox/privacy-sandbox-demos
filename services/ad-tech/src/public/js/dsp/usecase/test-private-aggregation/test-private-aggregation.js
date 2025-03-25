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
 * Private Aggregation. This script is loaded inside the
 * dsp/test-private-aggregation.html iframe, and invokes a Shared Storage
 * worklet.
 */
(async () => {
  /** Configurations for Private Aggregation API invocation. */
  const privateAggregationConfig = {};
  /** Additional data to pass to the worklet. */
  const data = {};
  // Include all query parameters from the URL.
  const urlQueryParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlQueryParams.entries()) {
    data[key] = value;
  }
  // Optional: Specify coordinator origin.
  if (urlQueryParams.has('cloudEnv')) {
    const cloudEnv = urlQueryParams.get('cloudEnv');
    privateAggregationConfig.aggregationCoordinatorOrigin = new URL(
      `https://publickeyservice.msmt.${cloudEnv}.privacysandboxservices.com`,
    ).toString();
  }
  // Use a placeholder bucket key if not specified.
  if (!urlQueryParams.has('bucketKey')) {
    data.bucketKey = '1234567890';
  }
  // sharedStorage.set('bucketKey', `${data.bucketKey}`);
  // Optional: Use contextId to opt-in for instant reports.
  privateAggregationConfig.contextId = `contextId-${crypto.randomUUID()}`;
  // Finally, create and invoke worklet.
  const worklet = await window.sharedStorage.createWorklet(
    '/js/dsp/usecase/test-private-aggregation/test-private-aggregation-worklet.js',
  );
  await worklet.run('test-private-aggregation', {
    data,
    privateAggregationConfig,
  });
})();
