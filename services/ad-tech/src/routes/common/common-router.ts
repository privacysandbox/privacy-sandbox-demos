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
import {getTemplateVariables} from '../../lib/template-utils.js';

/**
 * This router is responsible for registering HTTP headers, preflight requests,
 * and serve the index page which isn't used in use-case journeys.
 * 
 * Path: /
 */
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
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin!);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Private-Network', 'true');
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
/** Handler for pre-flight OPTIONS requests. */
CommonRouter.options('*', (req: Request, res: Response) => {
  if (req.headers.origin?.startsWith('https://privacy-sandbox-demos-')) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin!);
    res.setHeader('Access-Control-Private-Network', 'true');
    res.sendStatus(200);
  }
});

/** Index page, not commonly used in tests. */
CommonRouter.get('/', async (req: Request, res: Response) => {
  if (req.hostname.includes('ssp')) {
    res.render('ssp/index', getTemplateVariables());
  } else {
    res.render('dsp/index', getTemplateVariables());
  }
});
