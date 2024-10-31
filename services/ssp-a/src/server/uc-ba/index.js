import {Router} from 'express';
import path from 'path';
import {readFile} from 'fs/promises';
import ejs from 'ejs';

const {
  EXTERNAL_PORT,
  SSP_A_HOST,
  DSP_A_HOST,
  DSP_A_URI,
  DSP_B_HOST,
  DSP_B_URI,
} = process.env;

const SSP_A_ORIGIN = new URL(`https://${SSP_A_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_A_ORIGIN = new URL(`https://${DSP_A_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_B_ORIGIN = new URL(`https://${DSP_B_HOST}:${EXTERNAL_PORT}`).origin;

const router = Router();

router.get('/service/ad/auction-config.json', async (req, res) => {
  res.json({
    seller: SSP_A_ORIGIN,
    interestGroupBuyers: [DSP_A_ORIGIN, DSP_B_ORIGIN],
    decisionLogicURL: new URL('uc-ba/js/decision-logic.js', SSP_A_ORIGIN),
    trustedScoringSignalsURL: new URL('uc-ba/service/kv', SSP_A_ORIGIN),
    resolveToConfig: true,
  });
});

router.get('/service/ad/contextual-auction', async (req, res) => {
  const buyers = {
    [DSP_A_ORIGIN]: {bidUrl: new URL('/uc-ba/contextual-bid', DSP_A_URI)},
    [DSP_B_ORIGIN]: {bidUrl: new URL('/uc-ba/contextual-bid', DSP_B_URI)},
  };

  const adServerBids = await Promise.all(
    Object.keys(buyers).map(async (buyer) => {
      const response = await fetch(buyers[buyer].bidUrl);
      const result = await response.json();
      result.buyer = buyer;
      return result;
    }),
  );

  res.json(adServerBids.sort((a, b) => b.bid - a.bid));
});

router.get('/service/kv', (req, res) => {
  res.setHeader('Ad-Auction-Allowed', true);

  res.json({
    renderUrls: {
      [new URL('/uc-ba/html/ad.html', DSP_A_ORIGIN).toString()]: [1, 2],
      [new URL('/uc-ba/html/ad.html', DSP_B_ORIGIN).toString()]: [1, 2],
    },
  });
});

router.get('/js/ad-tag.js', async (req, res) => {
  const filePath = path.join(path.resolve(), '/src/public/uc-ba/js/ad-tag.js');
  const file = await readFile(filePath, {encoding: 'utf8'});
  const compiledFile = await ejs.compile(file);
  const fileContent = compiledFile({SSP_A_ORIGIN, DSP_A_ORIGIN, DSP_B_ORIGIN});

  res.set('content-type', 'text/javascript');

  res.send(fileContent);
});

router.get('/', (req, res) => {
  res.sendStatus(200);
});

export default router;
