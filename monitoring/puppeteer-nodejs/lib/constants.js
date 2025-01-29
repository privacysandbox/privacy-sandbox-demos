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

// ****************************************************************************
// ENVIRONMENT VARIABLES
// ****************************************************************************
export const {
  // Home
  HOME_HOST,
  HOME_URI,

  // Advertisers
  SHOP_HOST,
  SHOP_URI,
  TRAVEL_HOST,
  TRAVEL_URI,

  // Publishers
  NEWS_HOST,
  NEWS_URI,
  MOTO_NEWS_HOST,
  MOTO_NEWS_URI,
  SOCCER_NEWS_HOST,
  SOCCER_NEWS_URI,
  GARDENING_NEWS_HOST,
  GARDENING_NEWS_URI,

  // Ad-techs
  DSP_HOST,
  DSP_URI,

  DSP_A_HOST,
  DSP_A_URI,

  DSP_B_HOST,
  DSP_B_URI,

  SSP_HOST,
  SSP_URI,

  SSP_A_HOST,
  SSP_A_URI,

  SSP_B_HOST,
  SSP_B_URI,

  AD_SERVER_HOST,
  AD_SERVER_URI,
} = process.env;
