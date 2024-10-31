import {Router, Request, Response} from 'express';
const {DSP_A_HOST, EXTERNAL_PORT} = process.env;

const router = Router();
const DSP_A_ORIGIN = new URL(`https://${DSP_A_HOST}:${EXTERNAL_PORT}`).origin;

router.get('/contextual-bid', async (req: Request, res: Response) => {
  res.json({
    bid: Math.floor(Math.random() * 100),
    renderURL: `https://${DSP_A_HOST}/uc-ba/html/contextual-ad.html`,
    perBuyerSignals: {'testKey': 'dsp-a'},
  });
});

router.get(
  '/join-ad-interest-group.html',
  async (req: Request, res: Response) => {
    res.render('uc-ba/join-ad-interest-group', {
      DSP_A_HOST,
      EXTERNAL_PORT,
    });
  },
);

router.get('/interest-group.json', async (req: Request, res: Response) => {
  const imageCreative = new URL(
    '/uc-ba/html/protected-audience-ad.html',
    DSP_A_ORIGIN,
  );
  const biddingLogicUrl = new URL('/uc-ba/js/bidding-logic.js', DSP_A_ORIGIN);

  res.json({
    owner: DSP_A_ORIGIN,
    name: 'dsp-a-ba-test',
    biddingLogicUrl,
    ads: [
      {
        renderURL: imageCreative,
      },
    ],
  });
});

router.get('/', (req: Request, res: Response) => {
  res.sendStatus(200);
});

export default router;
