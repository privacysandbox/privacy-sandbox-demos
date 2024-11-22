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

export const {
  // Runtime variables
  PORT,
  EXTERNAL_PORT,
  HOSTNAME,

  // Publishers
  NEWS_HOST,
  NEWS_DETAIL,
  MOTO_NEWS_HOST,
  SOCCER_NEWS_HOST,
  GARDENING_HOST,

  // Ad-techs
  SSP_HOST,
  SSP_A_HOST,
  SSP_B_HOST,

  HOME_HOST,
  AD_SERVER_HOST,
  TOPICS_SERVER_HOST,
} = process.env;

export const CURRENT_ORIGIN = new URL(
  `https://${HOSTNAME}:${EXTERNAL_PORT}`,
).toString();

export const SSP_ORIGIN = new URL(
  `https://${SSP_HOST}:${EXTERNAL_PORT}`,
).toString();

export const SSP_A_ORIGIN = new URL(
  `https://${SSP_A_HOST}:${EXTERNAL_PORT}`,
).toString();

export const SSP_B_ORIGIN = new URL(
  `https://${SSP_B_HOST}:${EXTERNAL_PORT}`,
).toString();

export const TEXT_LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing ' +
  'elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ' +
  'ut aliquip ex ea commodo consequat. Duis aute irure dolor in ' +
  'reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla ' +
  'pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa ' +
  'qui officia deserunt mollit anim id est laborum.';
