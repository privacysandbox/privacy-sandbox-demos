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
 * Where is this script used: This script is loaded inside a static ad frame
 *   used for the single-touch attribution reporting use-case demo using the
 *   JavaScript implementation pattern.
 *
 * What does this script do: This script attaches two event listeners -- one to
 *   register an attribution source for an ad view on DOMContentLoaded, and
 *   another to register an attribution soruce for an ad click.
 */
(() => {
  /** Registers an attribution source for an ad view. */
  const registerAttributionSourceForAdView = () => {
    // TODO: Implement.
    // console.info('[PSDemo] Registering attribution source for ad view.');
    console.warn('[PSDemo] Source registration for ad view not implemented.');
  };

  /** Registers an attribution source for an ad click. */
  const registerAttributonSourceForAdClick = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const registerSourceUrl = new URL(
      '<%= `https://${HOSTNAME}:${EXTERNAL_PORT}/attribution/register-source` %>',
    );
    registerSourceUrl.searchParams.append(
      'advertiser',
      urlParams.get('advertiser'),
    );
    registerSourceUrl.searchParams.append('itemId', urlParams.get('itemId'));
    registerSourceUrl.searchParams.append('filter', urlParams.get('filter'));
    const encodedRegisterSourceUrl = encodeURIComponent(registerSourceUrl);
    const destinationUrl = new URL(
      '<%= `https://${SHOP_HOST}:${EXTERNAL_PORT}` %>',
    );
    destinationUrl.pathname = `/items/${urlParams.get('itemId')}`;
    console.info('[PSDemo] Registering attribution source for ad click', {
      destinationUrl: destinationUrl.toString(),
      encodedRegisterSourceUrl,
    });
    window.open(
      destinationUrl,
      '_blank',
      `attributionsrc=${encodedRegisterSourceUrl}`,
    );
  };

  /** Main function */
  (() => {
    document.addEventListener(
      'DOMContentLoaded',
      registerAttributionSourceForAdView,
    );
    window.addEventListener('click', registerAttributonSourceForAdClick);
  })();
})();
