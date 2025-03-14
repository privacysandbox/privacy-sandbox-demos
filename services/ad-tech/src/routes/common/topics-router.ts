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

/**
 * This router is responsible for handling all requests related to the Topics
 * API. This includes requests to observe browsing topics over fetch requests
 * using HTTP headers.
 *
 * Path: /topics/
 */
export const TopicsRouter = express.Router();

// ************************************************************************
// HTTP handlers
// ************************************************************************
/** TODO: Verify this use-case */
TopicsRouter.get(
  '/observe-browsing-topics',
  async (req: Request, res: Response) => {
    const browsingTopics = req.get('Sec-Browsing-Topics');
    res.json({topics: browsingTopics});
  }
);
