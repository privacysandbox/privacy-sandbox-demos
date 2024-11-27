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
 * This is the router for an ad verifier, and is responsible for handling
 * requests from ad buyers sourcing pre-bid ad verification signals.
 *
 * Path: /verifier/
 */
export const VerificationSignalsRouter = express.Router();

/**
 * This module should contain verification signals keyed to the publisher
 * pages. E.g.
 * {
 *   `${NEWS_HOST}/iframe-display-ad`: {
 *      viewabilityRate: 0.70,
 *      contentTags: ['lorem'],
 *    },
 *   `${NEWS_HOST}/iframe-video-ad`: {
 *      viewabilityRate: 0.65,
 *      contentTags: ['ipsum'],
 *    },
 * }
 */

/** Returns pre-bid ad verification signals keyed to publoisher pages. */
VerificationSignalsRouter.get(
  '/verification-signals.json',
  async (req: Request, res: Response) => {
    // TODO: Implement.
  },
);
