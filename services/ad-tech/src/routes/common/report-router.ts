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
  Report,
  ReportCategory,
  ReportStore,
} from '../../controllers/report-store.js';
import {handleAttributionSourceRegistration} from '../../lib/attribution-reporting-helper.js';
import {getTemplateVariables} from '../../lib/template-utils.js';

/**
 * This router is responsible for handling event-level report requests
 * generated typically from Protected Audience auctions, such as via
 * sendReportTo() from reportResult() or reportWin(), ad beacons with the
 * Fenced Frames Ads Reporting API or trackingEvents included in the VAST XML.
 *
 * Path: /reporting/
 */
export const ReportRouter = express.Router();

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** Receives event logs and registers attribution source if eligible. */
ReportRouter.get('/', async (req: Request, res: Response) => {
  const report: Report = {
    category: ReportCategory.EVENT_LEVEL_LOG,
    timestamp: Date.now().toString(),
    data: req.query,
  };
  console.log('Event-level report received: ', req.baseUrl, report);
  ReportStore.addReport(report);
  handleAttributionSourceRegistration(req, res, /* isStrict= */ false);
});

/** Receives event logs and registers attribution source if eligible. */
ReportRouter.post('/', async (req: Request, res: Response) => {
  const report: Report = {
    category: ReportCategory.EVENT_LEVEL_LOG,
    timestamp: Date.now().toString(),
    data: {
      ...req.query,
      ...req.body,
    },
  };
  console.log('Event-level report received: ', req.baseUrl, report);
  ReportStore.addReport(report);
  handleAttributionSourceRegistration(req, res, /* isStrict= */ false);
});

// ****************************************************************************
// This endpoint is not functionally used in use-case journeys, but rather to
// quickly demonstrate the event-level reports the ad-tech server received
// within the last 10 minutes.
// ****************************************************************************
/** Shows all reports from in-memory storage. */
ReportRouter.get('/view-reports', async (req: Request, res: Response) => {
  const hostDetails = getTemplateVariables('Reports');
  res.render('view-reports', {
    reports: ReportStore.getAllReports(),
    ...hostDetails,
  });
});
