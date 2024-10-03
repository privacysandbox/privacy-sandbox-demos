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

(async () => {
  let bucket = document.currentScript.getAttribute('bucket');
  let cloudEnv = document.currentScript.getAttribute('cloudenv');

  sharedStorage.set('bucket', `${bucket}`);
  sharedStorage.set('cloudenv', `${cloudEnv}`);
  console.log(
    `https://publickeyservice.msmt.${cloudEnv}.privacysandboxservices.com`,
  );

  const privateAggCloud = {
    'privateAggregationConfig': {
      'aggregationCoordinatorOrigin': `https://publickeyservice.msmt.${cloudEnv}.privacysandboxservices.com`,
    },
  };

  await window.sharedStorage.worklet.addModule(
    '/js/dsp/private-aggregation-worklet.js',
  );
  await window.sharedStorage.run('test-private-aggregation', privateAggCloud);
})();
