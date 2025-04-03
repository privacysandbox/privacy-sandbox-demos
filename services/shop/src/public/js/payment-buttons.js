/*
 Copyright 2025 Google LLC

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
 * This script is used on Summary page
 * and it creates fenced frame with config provided by Service-Provider
 * resulting in rendering personalized payment button that on click opens
 * payment provider popup to simulate payment process
 */

const EXTERNAL_PORT = '<%= EXTERNAL_PORT %>';
const SERVICE_PROVIDER_HOST = '<%= SERVICE_PROVIDER_HOST %>';
const SHOP_HOST = '<%= SHOP_HOST %>';

(function createPaymentButtons() {
  const fencedframe = document.createElement('fencedframe');

  fencedframe.addEventListener('fencedtreeclick', () => {
    const height = 600;
    const width = 600;
    const y = window.top.outerHeight / 2 + window.top.screenY - height / 2;
    const x = window.top.outerWidth / 2 + window.top.screenX - width / 2;

    const params = `width=${width}, height=${height}, top=${y}, left=${x}`;

    window.open(
      `https://${SERVICE_PROVIDER_HOST}:${EXTERNAL_PORT}/popup`,
      'example-pay-popup',
      params,
    );

    window.addEventListener('message', (event) => {
      const receivedMessage = event.data;
      if (receivedMessage === 'PAYMENT_PROCESSED') {
        navigateToCheckout();
      } else {
        console.error('[PSDemo] Cannot perform payment simulation.');
      }
    });
  });

  try {
    fencedframe.config = new FencedFrameConfig(
      `https://${SERVICE_PROVIDER_HOST}:${EXTERNAL_PORT}/button`,
    );
    fencedframe.height = '75px';
    fencedframe.width = '250px';
    fencedframe.style.border = '0px';
    fencedframe.style.borderRadius = '25px';

    document.getElementById('button-holder').appendChild(fencedframe);
  } catch (e) {
    console.error('[PSDemo] Cannot provide personalized button: ', {e});
  }
})();

function navigateToCheckout() {
  const form = document.getElementById('cart-form');
  form.submit();
}
