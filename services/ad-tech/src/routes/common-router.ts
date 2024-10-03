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

import express, {NextFunction, Request, Response} from 'express';

import {
  handleAttributionSourceRegistration,
  handleAttributionTriggerRegistration,
} from '../lib/attribution-reporting-helper.js';
import {
  EventReport,
  EventReportCategory,
  EventReportStore,
} from '../controllers/event-report-store.js';
import {
  getAdTemplateVariables,
  getTemplateVariables,
} from '../lib/template-utils.js';

export const CommonRouter = express.Router();

// ************************************************************************
// HTTP Header Configurations
// ************************************************************************
CommonRouter.use((req: Request, res: Response, next: NextFunction) => {
  // Explicitly allow loading in fenced-frame.
  if (req.get('Sec-Fetch-Dest') === 'fencedframe') {
    res.setHeader('Supports-Loading-Mode', 'fenced-frame');
  }
  // Enable debug reports for Atribution Reporting.
  res.cookie('ar_debug', '1', {
    sameSite: 'none',
    secure: true,
    httpOnly: true,
  });
  // Enable CORS.
  if (req.headers.origin?.startsWith('https://privacy-sandbox-demos-')) {
    res.setHeader('Access-Control-Allow-Origin', req.headers['origin']);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  // Observe browsing topics.
  res.setHeader('Observe-Browsing-Topics', '?1');
  next();
});

/** Set PAAPI headers on static content. */
CommonRouter.use(
  express.static('src/public', {
    setHeaders: (res: Response, path: string) => {
      if (
        path.endsWith('bidding-logic.js') ||
        path.endsWith('decision-logic.js')
      ) {
        return res.set('X-Allow-FLEDGE', 'true');
      }
      if (path.endsWith('/run-ad-auction.js')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
        res.set('Permissions-Policy', 'run-ad-auction=(*)');
      }
    },
  }),
);

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** Index page, not commonly used in tests. */
CommonRouter.get('/', async (req: Request, res: Response) => {
  if (req.hostname.includes('ssp')) {
    res.render('ssp/index', getTemplateVariables());
  } else {
    res.render('dsp/index', getTemplateVariables());
  }
});

/** Used as render URL in interest groups. */
CommonRouter.get('/ads', async (req: Request, res: Response) => {
  const templateVariables = getAdTemplateVariables(req.query);
  console.log('Loading ad creative: ', templateVariables);
  res.render('ad-frame', templateVariables);
});

/** Shows all reports from in-memory storage. */
CommonRouter.get('/reports', async (req: Request, res: Response) => {
  const hostDetails = getTemplateVariables('Reports');
  res.render('reports', {
    reports: EventReportStore.getAllReports(),
    ...hostDetails,
  });
});

/** Receives event logs and registers attribution source if eligible. */
CommonRouter.get('/reporting', async (req: Request, res: Response) => {
  const report: EventReport = {
    category: EventReportCategory.EVENT_LEVEL_LOG,
    timestamp: Date.now().toString(),
    data: req.query,
  };
  console.log('Event-level report received: ', req.baseUrl, report);
  EventReportStore.addReport(report);
  handleAttributionSourceRegistration(req, res, /* isStrict= */ false);
});

/** Receives event logs and registers attribution source if eligible. */
CommonRouter.post('/reporting', async (req: Request, res: Response) => {
  const report: EventReport = {
    category: EventReportCategory.EVENT_LEVEL_LOG,
    timestamp: Date.now().toString(),
    data: {
      ...req.query,
      ...req.body,
    },
  };
  console.log('Event-level report received: ', req.baseUrl, report);
  EventReportStore.addReport(report);
  handleAttributionSourceRegistration(req, res, /* isStrict= */ false);
});

CommonRouter.get(
  '/observe-browsing-topics',
  async (req: Request, res: Response) => {
    const browsingTopics = req.get('Sec-Browsing-Topics');
    res.json({topics: browsingTopics});
  },
);

// HTTP Handlers for Attribution Reporting.
/** Registers a click or view attribution source. */
CommonRouter.get('/register-source', async (req: Request, res: Response) => {
  handleAttributionSourceRegistration(req, res);
});

/** Registers an attribution trigger. */
CommonRouter.get('/register-trigger', async (req: Request, res: Response) => {
  handleAttributionTriggerRegistration(req, res);
});
