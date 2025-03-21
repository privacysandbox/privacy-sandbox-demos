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

import cbor from 'cbor';
import express, {Request, Response} from 'express';
import {ReportStore, ReportCategory} from '../../controllers/report-store.js';
//import {decodeBucket} from '../../lib/arapi.js';

/**
 * This router is responsible for handling the well-known endpoints for the
 * Realtime Monitoring API.
 *
 * Path: /.well-known/interest-group/real-time-report
 */
export const WellKnownRealtimeMonitoringRouter = express.Router();

// Realtime Monitoring Report
WellKnownRealtimeMonitoringRouter.post(
  '/',
  async (req: Request, res: Response) => {
    console.log('[RTM] Received realtime monitoring data - Starting ');
    try {
      // Read the raw request body as a Buffer
      const rawData = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        req.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        req.on('error', reject);
      });

      // Decode the CBOR data
      const decodedData = cbor.decode(rawData);
      console.log('Decoded RTM CBOR data:', decodedData);

      if (
        !decodedData ||
        !decodedData.histogram ||
        !decodedData.histogram.buckets
      ) {
        console.error('No histogram in CBOR data: ', decodedData);
        res.status(500).send('No histogram in CBOR data');
        return;
      }
      if (
        !decodedData ||
        !decodedData.platformHistogram ||
        !decodedData.platformHistogram.buckets
      ) {
        console.error('No platformHistogram in CBOR data: ', decodedData);
        res.status(500).send('No platformHistogram in CBOR data');
        return;
      }
      // Process Platform Buckets
      const decodedPlatformHistogramBuckets = processBucketData(
        decodedData.platformHistogram,
      );
      console.log(
        'Platform Histogram Buckets:',
        decodedPlatformHistogramBuckets,
      );
      ReportStore.addReport({
        category: ReportCategory.RTM_PLATFORM,
        timestamp: Date.now().toString(),
        data: decodedPlatformHistogramBuckets,
      });

      // Process Histogram Buckets
      const decodedHistogramBuckets = processBucketData(decodedData.histogram);
      console.log('Histogram Buckets:', decodedHistogramBuckets);
      ReportStore.addReport({
        category: ReportCategory.RTM_HISTOGRAM,
        timestamp: Date.now().toString(),
        data: decodedHistogramBuckets,
      });
    } catch (error) {
      console.error('Error processing CBOR data:', error);
      res.status(500).send('Error processing CBOR data');
      return;
    }
    res.sendStatus(200);
  },
);

function processBucketData(jsonDecodedHistogramData: any): number[] {
  const decodedHistogramBuckets: number[] = [];
  for (const byte of jsonDecodedHistogramData.buckets) {
    // Convert each byte to its binary representation (as a string)
    const binaryString = byte.toString(2).padStart(8, '0'); // Pad with leading zeros

    // Convert each bit in the binary string to a number (0 or 1)
    for (const bit of binaryString) {
      decodedHistogramBuckets.push(parseInt(bit, 10));
    }
  }
  const finalHistogram = decodedHistogramBuckets.slice(
    0,
    jsonDecodedHistogramData.length,
  );
  return finalHistogram;
}
