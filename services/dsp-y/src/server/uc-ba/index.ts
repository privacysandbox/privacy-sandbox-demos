import {Router, Request, Response} from 'express';
const {EXTERNAL_PORT, DSP_Y_HOST} = process.env;

const DSP_Y_ORIGIN = new URL(`https://${DSP_Y_HOST}:${EXTERNAL_PORT}`).origin;

const router = Router();

router.get('/service/kv', (req, res) => {
  res.json({
    keys: {
      'adRenderId': 123456,
      'renderURL': "https://privacy-sandbox-demos-dsp.dev/ads?advertiser=privacy-sandbox-demos-shop.dev&id=1f45e",
    },
  });
});

router.get('/contextual-bid', async (req: Request, res: Response) => {
  res.json({
    bid: Math.floor(Math.random() * 100),
    renderURL: new URL(
      '/uc-ba/html/contextual-ad.html',
      DSP_Y_ORIGIN,
    ).toString(),
    perBuyerSignals: {'testKey': 'dsp-y'},
  });
});

router.get('/join-ad-interest-group.html', async (req, res) => {
  const title = 'DSP Y - Join Ad Interest Group';
  res.render(`uc-ba/join-ad-interest-group`, {
    title,
    DSP_Y_HOST,
    EXTERNAL_PORT,
  });
});

router.get('/interest-group.json', async (req, res) => {
  const {advertiser, id} = req.query;
  if (
    advertiser === undefined ||
    id === undefined ||
    typeof advertiser !== 'string'
  ) {
    return res.sendStatus(400);
  }

  const imageCreative: string = new URL(
    'uc-ba/html/protected-audience-ad.html',
    DSP_Y_ORIGIN,
  ).toString();
  const biddingLogicUrl: string = new URL(
    `uc-ba/js/bidding-logic.js`,
    DSP_Y_ORIGIN,
  ).toString();

  res.json({
    name: 'dsp-y-ba-test',
    owner: DSP_Y_ORIGIN,
    biddingLogicUrl,
    ads: [
      {
        adRenderId: '1234',
        renderURL: imageCreative,
      },
    ],
    auctionServerRequestFlags: ['omit-ads', 'omit-user-bidding-signals'],
    trustedBiddingSignalsKeys: ['adRenderId', 'renderURL'],
  });
});

router.get('/', (req, res) => {
  res.sendStatus(200);
});

export default router;
