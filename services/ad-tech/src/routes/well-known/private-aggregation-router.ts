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
import {ReportStore, ReportCategory} from '../../controllers/report-store.js';

/**
 * This router is responsible for handling the well-known endpoints for the
 * Private Aggregation API. There are two ways to generate reports with the
 * Private Aggregation API -- (1) via Shared Storage, and (2) via Protected
 * Audience. And with each way, we may receive regular reports and debug
 * reports.
 * 
 * Path: /.well-known/private-aggregation/
 */
export const WellKnownPrivateAggregationRouter = express.Router();

// ************************************************************************
// Private Aggregation with Shared Storage
// ************************************************************************
// Shared Storage: Regular report
WellKnownPrivateAggregationRouter.post(
  '/report-shared-storage',
  async (req: Request, res: Response) => {
    console.log(
      '[pAgg+SS] Received aggregatable report on live endpoint: ',
      req.body,
    );
    ReportStore.addReport({
      category: ReportCategory.PAGG_VIA_SS,
      timestamp: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

// Shared Storage: Debug report
WellKnownPrivateAggregationRouter.post(
  '/debug/report-shared-storage',
  async (req: Request, res: Response) => {
    console.log(
      '[pAgg+SS] Received aggregatable report on debug endpoint: ',
      req.body,
    );
    ReportStore.addReport({
      category: ReportCategory.PAGG_VIA_SS_DEBUG,
      timestamp: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

// ************************************************************************
// Private Aggregation with Protected Audience
// ************************************************************************
// Protected Audience: Regular report
WellKnownPrivateAggregationRouter.post(
  '/report-protected-audience',
  async (req: Request, res: Response) => {
    console.log(
      '[pAgg+SS] Received aggregatable report on live endpoint: ',
      req.body,
    );
    ReportStore.addReport({
      category: ReportCategory.PAGG_VIA_PAAPI,
      timestamp: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

// Protected Audience: Debug report
WellKnownPrivateAggregationRouter.post(
  '/debug/report-protected-audience',
  async (req: Request, res: Response) => {
    console.log(
      '[pAgg+SS] Received aggregatable report on debug endpoint: ',
      req.body,
    );
    ReportStore.addReport({
      category: ReportCategory.PAGG_VIA_PAAPI_DEBUG,
      timestamp: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);
