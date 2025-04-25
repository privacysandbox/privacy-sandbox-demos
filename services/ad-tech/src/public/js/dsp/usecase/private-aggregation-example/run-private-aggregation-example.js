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
 * This script demonstrates how an ad-tech script running in an cross-origin
 * iframe may access page context data and trigger a Shared Storage worklet.
 * This script is loaded inside a cross-origin ad-tech iframe loaded on a
 * publisher page.
 *
 * What does this script do:
 * This scripts listens for a post-message containing page context data which
 * includes top-level page URL search parameters and some standard page
 * variables. Then this script proceeds to trigger a Shared Storage worklet
 * passing the received page context data.
 */
(async () => {
  const runPrivateAggregationExample = async (data) => {
    if (!data.bucketKey) {
      // Use a placeholder bucket key if not specified.
      data.bucketKey = BigInt(data.uniqueBigInt);
    }
    if (!data.contextId) {
      data.contextId = data.uniqueInt64;
    }
    // Assemble configurations for Private Aggregation API invocation.
    const privateAggregationConfig = {};
    // Optional: Use contextId to opt-in to instant reports.
    privateAggregationConfig.contextId = data.contextId;
    // Optional: Specify coordinator origin.
    if (data.cloudEnv) {
      privateAggregationConfig.aggregationCoordinatorOrigin = new URL(
        `https://publickeyservice.msmt.${data.cloudEnv}.privacysandboxservices.com`,
      ).toString();
    }
    // Finally, create and invoke worklet.
    const worklet = await window.sharedStorage.createWorklet(
      '/js/dsp/usecase/private-aggregation-example/private-aggregation-example-worklet.js',
    );
    console.info('[PSDemo] Triggering Private Aggregation worklet', {
      run: 'test-private-aggregation',
      data,
      privateAggregationConfig,
    });
    await worklet.run('private-aggregation-example', {
      data,
      privateAggregationConfig,
    });
  };

  /** Parses post-message and triggers Private Aggregation worklet. */
  const parsePostMessageAndTriggerWorklet = (event) => {
    if (!event.origin.startsWith('https://<%= DEMO_HOST_PREFIX %>')) {
      console.debug('[PSDemo] Ignoring message from unknown origin', {event});
      return;
    }
    if ('string' === typeof event.data) {
      try {
        const parsedMessage = JSON.parse(event.data);
        if ('PAGE_LOAD' === parsedMessage.message) {
          console.debug('[PSDemo] Received page context', {parsedMessage});
          runPrivateAggregationExample(parsedMessage.pageContext);
          return;
        } else {
          console.debug('[PSDemo] Received unknown message', {parsedMessage});
        }
      } catch (err) {
        console.error('[PSDemo] Encountered error parsing post-message', {
          err,
          event,
        });
      }
    }
  };

  /** Main function. */
  (() => {
    window.addEventListener('message', parsePostMessageAndTriggerWorklet);
    console.info('[PSDemo] Waiting for PAGE_LOAD post-message.');
  })();
})();
