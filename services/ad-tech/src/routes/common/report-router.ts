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
import {
  getAttributionSourceHeaders,
  getAttributionRedirectUrlIfNeeded,
} from '../../lib/attribution-reporting-helper.js';
import {
  getStructuredObject,
  getTemplateVariables,
} from '../../lib/common-utils.js';
import {decodeDict} from 'structured-field-values';

/**
 * This router is responsible for handling event-level report requests
 * generated typically from Protected Audience auctions, such as via
 * sendReportTo() from reportResult() or reportWin(), ad beacons with the
 * Fenced Frames Ads Reporting API or trackingEvents included in the VAST XML.
 *
 * Path: /reporting/
 */
export const ReportRouter = express.Router();

/** Sets ARA source registration headers if request is eligible. */
const setAttributionReportingHeadersIfEligible = (
  req: Request,
  res: Response,
) => {
  if ('attribution-reporting-eligible' in req.headers) {
    const attributionEligibleHeader = decodeDict(
      req.headers['attribution-reporting-eligible'] as string,
    );
    const queryParams = getStructuredObject(req.query);
    const sourceHeaders = getAttributionSourceHeaders(
      queryParams,
      attributionEligibleHeader,
    );
    if (sourceHeaders) {
      res.setHeader(
        'Attribution-Reporting-Source-Headers',
        JSON.stringify(sourceHeaders),
      );
    }
  }
};

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
  setAttributionReportingHeadersIfEligible(req, res);
  const queryParams = getStructuredObject(req.query);
  const redirectUrl = getAttributionRedirectUrlIfNeeded(queryParams);
  if (redirectUrl) {
    res.redirect(redirectUrl);
    return;
  }
  res
    .status(200)
    .send(`Received event-level report: ${JSON.stringify(queryParams)}`);
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
  setAttributionReportingHeadersIfEligible(req, res);
  const queryParams = getStructuredObject(req.query);
  const redirectUrl = getAttributionRedirectUrlIfNeeded(queryParams);
  if (redirectUrl) {
    res.redirect(redirectUrl);
    return;
  }
  res
    .status(200)
    .send(`Received event-level report: ${JSON.stringify(queryParams)}`);
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
