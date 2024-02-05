class HeaderBiddingLib {
  constructor() {}

  startAuction({auctionId, adUnit, sellers}) {
    return Promise.all(
      sellers.map(async (seller) => {
        const response = await fetch(
          `https://${seller}/header-bid?auctionId=${auctionId}`,
        );
        return response.json();
      }),
    );
  }
}

headerBiddingLib = new HeaderBiddingLib();
