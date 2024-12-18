// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START monitoring_synthetic_monitoring_custom_puppeteer_script]
import {
  instantiateAutoInstrumentation,
  runSyntheticHandler,
} from '@google-cloud/synthetics-sdk-api';

// Run instantiateAutoInstrumentation before any other code runs, to get automatic logs and traces
instantiateAutoInstrumentation();
import * as functions from '@google-cloud/functions-framework';
import * as axios from 'axios';
import * as assert from 'node:assert';
import * as puppeteer from 'puppeteer';

import {runMonitorUcSingleTouchConversion} from './monitor-uc-single-touch-conversion.js';
import {runMonitorUcRemarketing} from './monitor-uc-remarketing.js';
import {runMonitorUcVastVideoPaapi} from './monitor-uc-vast-video-paapi.js';
import {runMonitorUcVideoMultiSellerSeqAuctionPaapi} from './monitor-uc-video-multi-seller-seq-auction-paapi.js';

// >>> MONITOR TEMPLATE >>>
// Use Case : <USE CASE FULL NAME>
// functions.http('MonitorUcShortName', runSyntheticHandler(async ({ logger, executionId }) => { // TODO : replace function name with Use Case Short name

//   // call implementation in monitor-uc-template.js // TODO : replace with filename
//   await runMonitorUcShortName(logger, executionId); // TODO : replace function name with Use Case Short name

// }));
// <<< MONITOR TEMPLATE

// Cloud Run Functions Entry points for Synthetic Monitoring with Puppeteer

// Use Case : Single-touch conversion Attribution
functions.http(
  'MonitorUcSingleTouchConversion',
  runSyntheticHandler(async ({logger, executionId}) => {
    // call implementation in monitor-uc-single-touch-conversion.js
    await runMonitorUcSingleTouchConversion(logger, executionId); // Call the exported function
  }),
);

// Use Case : Retargeting / Remarketing
functions.http(
  'MonitorUcRemarketing',
  runSyntheticHandler(async ({logger, executionId}) => {
    // call implementation in monitor-uc-remarketing.js
    await runMonitorUcRemarketing(logger, executionId); // Call the exported function
  }),
);

// Use Case : Instream VAST video ad in a Protected Audience single-seller auction
functions.http(
  'MonitorUcVastVideoPaapi',
  runSyntheticHandler(async ({logger, executionId}) => {
    // call implementation in monitor-uc-vast-video-paapi.js
    await runMonitorUcVastVideoPaapi(logger, executionId); // Call the exported function
  }),
);

// Use Case : Monitor Use Case : Instream video ad in a Protected Audience multi-seller sequential auction setup
functions.http(
  'MonitorUcVideoMultiSellerSeqAuctionPaapi',
  runSyntheticHandler(async ({logger, executionId}) => {
    // call implementation in monitor-uc-video-multi-seller-seq-auction-paapi.js
    await runMonitorUcVideoMultiSellerSeqAuctionPaapi(logger, executionId); // Call the exported function
  }),
);

// [END monitoring_synthetic_monitoring_custom_puppeteer_script]
