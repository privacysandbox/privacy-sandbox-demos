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

import express, {Request, Response} from 'express';
import {
  handleAttributionSourceRegistration,
  handleAttributionTriggerRegistration,
} from '../../lib/attribution-reporting-helper.js';

/**
 * This router is resposible for handling requests related to the Attribution
 * Reporting API. These could be requests from ad impressions to register an
 * attribution source or at conversions to trigger attribution.
 *
 * Note that there are additional requests that are eligible to register
 * attribution sources, such as the Protected Audience ad beacon reports
 * triggered via the Fenced Frames Ads Reporting API. Both of these HTTP
 * handlers use the same helper library to handle the attribution headers.
 * 
 * Path: /attribution/
 */
export const AttributionReportingRouter = express.Router();

/** Registers a click or view attribution source (impression). */
AttributionReportingRouter.get(
  '/register-source',
  async (req: Request, res: Response) => {
    handleAttributionSourceRegistration(req, res);
  },
);

/** Registers an attribution trigger (conversion). */
AttributionReportingRouter.get(
  '/register-trigger',
  async (req: Request, res: Response) => {
    handleAttributionTriggerRegistration(req, res);
  },
);
