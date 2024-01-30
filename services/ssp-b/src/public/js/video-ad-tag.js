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
  const ins = document.querySelector('ins.ads');
  const script = document.querySelector('.ssp_a_tag');
  const src = new URL(script.src);
  src.pathname = '/video-ad-tag.html';
  const iframe = document.createElement('iframe');
  iframe.width = 0;
  iframe.height = 0;
  iframe.src = src;
  iframe.setAttribute('allow', 'attribution-reporting; run-ad-auction');
  ins.appendChild(iframe);
})();

window.addEventListener('message', (event) => {
  if (!event.origin.startsWith('https://privacy-sandbox-demos-dsp')) return;
  if (typeof event.data !== 'string') return;
  const {adVastUrl} = JSON.parse(event.data);
  setUpIMA(adVastUrl);
});
