import {Router, Request, Response} from 'express';
const {EXTERNAL_PORT, DSP_X_HOST} = process.env;

const DSP_X_ORIGIN = new URL(`https://${DSP_X_HOST}:${EXTERNAL_PORT}`).origin;

const router = Router();

router.get('/service/kv', (req, res) => {
  res.json({
    keys: {
      'a': 123,
      'b': 456,
    },
  });
});

router.get('/contextual-bid', (req: Request, res: Response) => {
  res.json({
    bid: Math.floor(Math.random() * 100),
    renderURL: new URL(
      '/uc-ba/html/contextual-ad.html',
      DSP_X_ORIGIN,
    ).toString(),
    perBuyerSignals: {'testKey': 'dsp-x'},
  });
});

router.get('/join-ad-interest-group.html', async (req, res) => {
  const title = 'DSP X - Join Ad Interest Group';
  res.render(`uc-ba/join-ad-interest-group`, {
    title,
    DSP_X_HOST,
    EXTERNAL_PORT,
  });
});

router.get('/interest-group.json', async (req, res) => {
  const imageCreative: string = new URL(
    'uc-ba/html/protected-audience-ad.html',
    DSP_X_ORIGIN,
  ).toString();
  const biddingLogicUrl: string = new URL(
    `uc-ba/js/bidding-logic.js`,
    DSP_X_ORIGIN,
  ).toString();

  res.json({
    name: 'dsp-x-ba-test',
    owner: DSP_X_ORIGIN,
    biddingLogicUrl,
    ads: [
      {
        adRenderId: '1234',
        renderURL: imageCreative,
      },
    ],
    auctionServerRequestFlags: ['omit-ads', 'omit-user-bidding-signals'],
    trustedBiddingSignalsKeys: ['a', 'b'],
  });
});

router.get('/', (req, res) => {
  res.sendStatus(200);
});

export default router;
