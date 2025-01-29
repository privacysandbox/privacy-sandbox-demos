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
  getContextualAdTemplateVariables,
  getInterestGroupAdTemplateVariables,
  getStaticAdTemplateVariables,
} from '../../lib/common-utils.js';

/**
 * This router is responsible for handling requests to serve ads, i.e. the ad
 * itself. These endpoints don't execute any selection logic. The URL should
 * be sufficient to point to a specific ad creative, using query parameters if
 * disambiguation is needed.
 *
 * Path: /ads/
 */
export const AdsRouter = express.Router();

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** Used as render URL in interest groups for display ads. */
AdsRouter.get('/display-ads', async (req: Request, res: Response) => {
  const templateVariables = getInterestGroupAdTemplateVariables(req.query);
  console.log('Loading interest group ad', templateVariables);
  res
    .set('Allow-Fenced-Frame-Automatic-Beacons', 'true')
    .render('display-ad-frame', templateVariables);
});

/** Used as render URL for contextual ads or static ads. */
AdsRouter.get('/contextual-ads', async (req: Request, res: Response) => {
  const templateVariables = getContextualAdTemplateVariables();
  console.log('Loading contextual ad', templateVariables);
  res.render('contextual-ad-frame', templateVariables);
});

/** Used as render URL in interest groups for video ads. */
AdsRouter.get('/video-ads', async (req: Request, res: Response) => {
  console.log('Loading video ad', req.query);
  res.render('video-ad-frame');
});

/** Used as render URL for Multi Touch Attribution ads. */
AdsRouter.get('/static-ads', async (req: Request, res: Response) => {
  console.log('Loading MTA ad', req.query);
  const templateVariables = getStaticAdTemplateVariables(
    req.query,
    req.headers,
  );
  res.render('static-ad-frame', templateVariables);
});
