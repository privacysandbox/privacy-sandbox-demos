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

import NodeCache from 'node-cache';

/** Basic categories of reports. */
export enum ReportCategory {
  EVENT_LEVEL_LOG,
  ARA_EVENT_LEVEL,
  ARA_EVENT_LEVEL_DEBUG,
  ARA_AGGREGATE,
  ARA_AGGREGATE_DEBUG,
  PAGG_VIA_SS,
  PAGG_VIA_SS_DEBUG,
  PAGG_VIA_PAAPI,
  PAGG_VIA_PAAPI_DEBUG,
}

/** High-level abstraction of a report. */
export interface Report {
  category: ReportCategory;
  timestamp: string;
  data: any;
}

/** TTL for in-memory reports: 30 minutes */
export const REPORT_TTL_SECONDS = 30 * 60;

/** Simple in-memory implementation of report storage. */
export const ReportStore = (() => {
  // In-memory storage for reports.
  const Reports = new NodeCache({stdTTL: REPORT_TTL_SECONDS});

  /** Add a new report to the in-memory storage. */
  const addReport = (report: Report) => {
    // TODO: Consider partitioning by use-case.
    Reports.set(`${report.category}||${report.timestamp}`, report);
  };

  /** Returns all reports from in-memory storage. */
  const getAllReports = (): Report[] => {
    return Reports.keys().map((key) => Reports.get(key) as Report);
  };

  /** Delete all reports from in-memory storage. */
  const cleanReports = (): Report[] => {
    Reports.flushAll();
    console.log('keys flushed');
    return Reports.keys().map((key) => Reports.get(key) as Report);
  };

  return {
    addReport,
    getAllReports,
    cleanReports,
  };
})();
