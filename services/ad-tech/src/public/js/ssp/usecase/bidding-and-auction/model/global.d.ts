declare global {
  // Adds auctionInfoCollector function to the global window object.
  interface Window {
    auctionInfoCollector?: any;
  }
  /*
   * Adds the getInterestGroupAdAuctionData and
   * runAdAuction functions to the global navigator object.
   */
  interface Navigator {
    getInterestGroupAdAuctionData?: function;
    runAdAuction?: function;
  }
  // Adds adAuctionHeaders function to the interface used when making fetch requests.
  interface RequestInit {
    adAuctionHeaders?: boolean;
  }

  interface HTMLElement {
    config: FencedFrameConfig;
  }
}

export default global;
