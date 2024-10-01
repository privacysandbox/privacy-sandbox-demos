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

let dsp = document.currentScript.getAttribute('dsp');
let bucket = document.currentScript.getAttribute('bucket');
let cloudEnv = document.currentScript.getAttribute('cloudenv');
window.addEventListener('load', (event) => {
  if (cloudEnv == 'aws' || cloudEnv == 'gcp') {
    let iframe = document.createElement('iframe');
    iframe.src = `https://${dsp}/dsp/private-aggregation?bucket=${bucket}&cloudEnv=${cloudEnv}`;
    document.body.appendChild(iframe);
  }
});
