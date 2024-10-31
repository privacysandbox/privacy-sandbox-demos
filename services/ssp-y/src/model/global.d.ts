declare global {
  interface Window {
    auctionInfoCollector?: any;
  }

  interface Navigator {
    getInterestGroupAdAuctionData?: function;
    runAdAuction?: function;
  }

  interface RequestInit {
    adAuctionHeaders?: boolean;
  }

  interface HTMLElement {
    config: FencedFrameConfig;
  }

  interface FencedFrameConfig {
    setSharedStorageContext?: function;
  }
}

export default global;
