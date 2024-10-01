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

/** Basic categories of event-level reports. */
export enum EventReportCategory {
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

/** High-level abstraction of an event-level report. */
export interface EventReport {
  category: EventReportCategory;
  timestamp: string;
  data: any;
}

// In-memory storage for reports.
const Reports: EventReport[] = [];
// Clear in-memory storage every 10 min
setInterval(() => {
  Reports.length = 0;
}, 1000 * 60 * 10);

/** Add a new report to the in-memory storage. */
export const addReport = (report: EventReport) => {
  Reports.push(report);
};

/** Returns all reports from in-memory storage. */
export const getAllReports = (): EventReport[] => {
  return [...Reports];
};
