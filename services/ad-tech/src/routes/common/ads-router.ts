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
// HTTP handlers for Protected Audience ads
// ************************************************************************
/** Used as render URL in interest groups for display ads. */
AdsRouter.get('/display-ads', async (req: Request, res: Response) => {
  const templateVariables = getInterestGroupAdTemplateVariables(req.query);
  console.log(
    '[AdsRouter] Loading interest group display ad',
    templateVariables,
  );
  res
    .set('Allow-Fenced-Frame-Automatic-Beacons', 'true')
    .render('display-ads', templateVariables);
});

/** Used as render URL for contextual ads or static ads. */
AdsRouter.get('/contextual-ads', async (req: Request, res: Response) => {
  const templateVariables = getContextualAdTemplateVariables();
  console.log('[AdsRouter] Loading contextual ad', templateVariables);
  res.render('contextual-ads', templateVariables);
});

/** Used as render URL in interest groups for video ads. */
AdsRouter.get('/video-ads', async (req: Request, res: Response) => {
  console.log('[AdsRouter] Loading video ad', req.query);
  res.render('video-ads');
});

/** Used as render URL in interest groups for multi piece ads. */
AdsRouter.get('/multi-piece-ads', async (req: Request, res: Response) => {
  console.log('[AdsRouter] Loading multi piece ad', req.query);
  res.render('multi-piece-ads');
});

AdsRouter.get(
  '/component-ads-for-multi-piece',
  async (req: Request, res: Response) => {
    const templateVariables = getStaticAdTemplateVariables(
      req.query,
      req.headers,
    );
    console.log(
      '[AdsRouter] Loading component ad for multi-piece',
      req.query,
      templateVariables,
    );
    res.render('component-ads-for-multi-piece', templateVariables);
  },
);

// ************************************************************************
// HTTP handlers for static ads
// ************************************************************************
/** Delivers a static ad for reach measurement. */
AdsRouter.get('/static-ads-for-reach', async (req: Request, res: Response) => {
  const templateVariables = getStaticAdTemplateVariables(
    req.query,
    req.headers,
  );
  console.debug(
    '[AdsRouter] Loading static ad for reach measurement',
    req.query,
    templateVariables,
  );
  res.render('dsp/static-ads-for-reach', templateVariables);
});

/** Used as render URL for Multi Touch Attribution ads. */
AdsRouter.get('/static-ads-for-mta', async (req: Request, res: Response) => {
  const templateVariables = getStaticAdTemplateVariables(
    req.query,
    req.headers,
  );
  console.log(
    '[AdsRouter] Loading static ad for multi-touch attribution',
    req.query,
    templateVariables,
  );
  res.render('dsp/static-ads-for-mta', templateVariables);
});

AdsRouter.get('/static-ads-for-ara', async (req: Request, res: Response) => {
  const templateVariables = getStaticAdTemplateVariables(
    req.query,
    req.headers,
  );
  console.log(
    '[AdsRouter] Loading static ad for ARA',
    req.query,
    templateVariables,
  );
  res.render('dsp/static-ads-for-ara', templateVariables);
});
