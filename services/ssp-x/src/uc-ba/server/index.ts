import path from 'path';
import {readFile} from 'fs/promises';
import express, {Router} from 'express';
import ejs from 'ejs';
import adService from './ad-service.js';
import type {AdAuctionDataConfig} from '../../model/model.js';

const {EXTERNAL_PORT, SSP_X_HOST, DSP_X_HOST, DSP_Y_HOST} = process.env;

const SSP_X_ORIGIN = new URL(`https://${SSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_X_ORIGIN = new URL(`https://${DSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_Y_ORIGIN = new URL(`https://${DSP_Y_HOST}:${EXTERNAL_PORT}`).origin;

const router = Router();

router.use(
  express.static('src/uc-ba/public', {
    setHeaders: (res, path) => {
      // const shouldAddAuctionHeader = ['decision-logic.js'].some((fileName) =>
      //   path.includes(fileName),
      // );

      // if (shouldAddAuctionHeader) {
      //   return res.set('Ad-Auction-Allowed', 'true');
      // }
      if (path.includes('decision-logic.js')) {
        res.set('Ad-Auction-Allowed', 'true');
      }

      if (path.includes('run-ad-auction.js')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
        res.set('Permissions-Policy', 'run-ad-auction=(*)');
      }
    },
  }),
);

router.use('/service/ad', adService);

router.get('/service/kv', (req, res) => {
  res.json({
    renderUrls: {
      [new URL(
        '/uc-ba/html/protected-audience-ad.html',
        DSP_X_ORIGIN,
      ).toString()]: [1, 2],
      [new URL(
        '/uc-ba/html/protected-audience-ad.html',
        DSP_Y_ORIGIN,
      ).toString()]: [1, 2],
    },
  });
});

router.get('/js/ad-tag.js', async (req, res) => {
  const filePath = path.join(
    path.resolve(),
    '/build/public/uc-ba/js/ad-tag.js',
  );
  const file = await readFile(filePath, {encoding: 'utf8'});
  const compiledFile = await ejs.compile(file);
  const fileContent = compiledFile({SSP_X_ORIGIN});

  res.set('content-type', 'text/javascript');

  res.send(fileContent);
});

router.get('/', (req, res) => {
  res.sendStatus(200);
});

export default router;
