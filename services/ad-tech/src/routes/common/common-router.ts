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

import ejs from 'ejs';
import express, {NextFunction, Request, Response} from 'express';
import {
  DEMO_HOST_PREFIX,
  JAVASCRIPT_TEMPLATE_VARIABLES,
} from '../../lib/constants.js';
import {getTemplateVariables} from '../../lib/common-utils.js';

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
  if (req.headers.origin?.startsWith(`https://${DEMO_HOST_PREFIX}`)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin!);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Private-Network', 'true');
  }
  // Observe browsing topics.
  res.setHeader('Observe-Browsing-Topics', '?1');
  next();
});

// ************************************************************************
// HTTP handlers for static content
// ************************************************************************
/** Custom handler to use EJS renderer for JavaScript files. */
CommonRouter.get('/js/*.js', (req: Request, res: Response) => {
  const filePath = `src/public${req.path}`;
  if (
    filePath.endsWith('bidding-logic.js') ||
    filePath.endsWith('decision-logic.js')
  ) {
    res.set('X-Allow-FLEDGE', 'true');
    res.set('Ad-Auction-Allowed', 'true');
  }
  if (filePath.endsWith('/run-simple-ad-auction.js')) {
    res.set('Supports-Loading-Mode', 'fenced-frame');
    res.set('Permissions-Policy', 'run-ad-auction=(*)');
  }
  res.set('Content-Type', 'application/javascript');
  ejs.renderFile(filePath, JAVASCRIPT_TEMPLATE_VARIABLES, (err, content) => {
    if (err) {
      console.log('Encountered error rendering static JS', {
        filePath,
        JAVASCRIPT_TEMPLATE_VARIABLES,
        err,
      });
      res.status(500).send();
      return;
    }
    if (content) {
      res.send(content);
    } else {
      res.status(404).send();
    }
  });
});

/** Handler for all other static content: CSS, IMG. */
CommonRouter.use(express.static('src/public'));

// ************************************************************************
// Other common HTTP handlers
// ************************************************************************
/** Handler for pre-flight OPTIONS requests. */
CommonRouter.options('*', (req: Request, res: Response) => {
  if (req.headers.origin?.startsWith(`https://${DEMO_HOST_PREFIX}`)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin!);
    res.setHeader('Access-Control-Private-Network', 'true');
    res.sendStatus(200);
  }
});

/** Index page, not commonly used in tests. */
CommonRouter.get('/', async (req: Request, res: Response) => {
  res.render('index', getTemplateVariables());
});
