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

import cbor from 'cbor';
import express, {Request, Response} from 'express';
import {ReportStore, ReportCategory} from '../../controllers/report-store.js';
import {decodeBucket} from '../../lib/arapi.js';

/**
 * This router is responsible for handling the well-known endpoints for the
 * Attribution Reporting API. There are two types reports with this API --
 * (1) event-level reports, and (2) summary reports or aggregate reports. And
 * for each report type, we may receive regular reports and debug reports.
 *
 * Path: /.well-known/attribution-reporting/
 */
export const WellKnownAttributionReportingRouter = express.Router();

// ************************************************************************
// Attribution Reporting: Event-level Reports
// ************************************************************************
// Event-level Report: Regular Report
WellKnownAttributionReportingRouter.post(
  '/report-event-attribution',
  async (req: Request, res: Response) => {
    console.log(
      '[ARA] Received event-level report on live endpoint: ',
      req.body,
    );
    ReportStore.addReport({
      category: ReportCategory.ARA_EVENT_LEVEL,
      timestamp: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

// Event-level Report: Debug Report
WellKnownAttributionReportingRouter.post(
  '/debug/report-event-attribution',
  async (req: Request, res: Response) => {
    console.log(
      '[ARA] Received event-level report on debug endpoint: ',
      req.body,
    );
    ReportStore.addReport({
      category: ReportCategory.ARA_EVENT_LEVEL_DEBUG,
      timestamp: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

// ************************************************************************
// Attribution Reporting: Aggregate Reports
// ************************************************************************
// Aggregate Report: Regular Report
WellKnownAttributionReportingRouter.post(
  '/report-aggregate-attribution',
  async (req: Request, res: Response) => {
    const report = req.body;
    report.shared_info = JSON.parse(report.shared_info);
    console.log(
      '[ARA] Received aggregatable report on live endpoint: ',
      JSON.stringify(report),
    );
    ReportStore.addReport({
      category: ReportCategory.ARA_AGGREGATE,
      timestamp: Date.now().toString(),
      data: report,
    });
    res.sendStatus(200);
  },
);

// Aggregate Report: Debug Report
WellKnownAttributionReportingRouter.post(
  '/debug/report-aggregate-attribution',
  async (req: Request, res: Response) => {
    const debugReport = req.body;
    debugReport.shared_info = JSON.parse(debugReport.shared_info);
    debugReport.aggregation_service_payloads =
      debugReport.aggregation_service_payloads.map((e: any) => {
        const plain = Buffer.from(e.debug_cleartext_payload, 'base64');
        const debug_cleartext_payload = cbor.decodeAllSync(plain);
        e.debug_cleartext_payload = debug_cleartext_payload.map(
          ({data, operation}) => {
            return {
              operation,
              data: data.map(({value, bucket}: any) => {
                return {
                  value: value.readUInt32BE(0),
                  bucket: decodeBucket(bucket),
                };
              }),
            };
          },
        );
        return e;
      });
    console.log(
      '[ARA] Received aggregatable report on debug endpoint: ',
      JSON.stringify(debugReport),
    );
    // Save to global storage
    ReportStore.addReport({
      category: ReportCategory.ARA_AGGREGATE_DEBUG,
      timestamp: Date.now().toString(),
      data: debugReport,
    });
    res.sendStatus(200);
  },
);

// temporarily console.logging verbose report
WellKnownAttributionReportingRouter.post('/debug/verbose',
  async (req: Request, res: Response) => {
    const debugReport = req.body;
    console.log(
      '\x1b[1;31m%s\x1b[0m',
      `Received verbose debug reports from the browser`
    )
    console.log('VERBOSE REPORT(S) RECEIVED:\n=== \n', debugReport, '\n=== \n')

    res.sendStatus(200);
  });
