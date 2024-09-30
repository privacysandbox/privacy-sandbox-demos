const {DSP_Y_HOST, EXTERNAL_PORT} = process.env;
const DSP_Y_ORIGIN = new URL(`https://${DSP_Y_HOST}:${EXTERNAL_PORT}`);

function buildBaInterestGroup(useCaseName: string, advertiser: string) {
  const imageCreative = new URL(`${DSP_Y_ORIGIN}ads`);
  const biddingLogicUrl = new URL(
    `${DSP_Y_ORIGIN}uc-${useCaseName}/js/bidding-logic.js`,
  );

  return {
    name: advertiser,
    owner: DSP_Y_ORIGIN,
    biddingLogicUrl,
    ads: [
      {
        renderUrl: imageCreative,
        metadata: {
          adType: 'image',
        },
      },
    ],
  };
}

function buildInterestGroup(useCaseName: string, advertiser: string) {
  switch (useCaseName) {
    case 'ba':
      return buildBaInterestGroup(useCaseName, advertiser);
  }
}

export {buildInterestGroup};
