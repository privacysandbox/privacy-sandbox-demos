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

import * as axios from 'axios';
import * as assert from 'node:assert';
import * as puppeteer from 'puppeteer';

import {SHOP_URI, NEWS_URI} from './lib/constants.js';

// Synthetic Monitoring with Puppeteer
// Use Case : Retargeting / Remarketing
async function runMonitorUcRemarketing(logger, executionId) {
  /*
   * This function executes the synthetic code for testing purposes.
   * If the code runs without errors, the synthetic test is considered successful.
   * If an error is thrown during execution, the synthetic test is considered failed.
   */

  // Print the use case demo name
  const usecase = 'Retargeting / Remarketing';
  logger.info(
    `Synthetic Monitoring Starts for Privacy Sandbox Demos Use Case : ${usecase} `,
  );

  // Launch a headless Chrome browser and open a new page
  const browser = await puppeteer.launch({headless: 'new', timeout: 0});
  const page = await browser.newPage();

  // Navigate to the target URL
  const result = await page.goto(NEWS_URI, {waitUntil: 'load'});

  // Confirm successful navigation
  await assert.equal(result.status(), 200);

  // Print the page title to the console
  const title = await page.title();
  logger.info(`My Page title: ${title} ` + executionId);

  // Print the use case demo name
  logger.info(
    `Synthetic Monitoring Ends for Privacy Sandbox Demos Use Case : ${usecase} `,
  );

  // Close the browser
  await browser.close();
}

export {runMonitorUcRemarketing}; // Export the function to make it accessible
