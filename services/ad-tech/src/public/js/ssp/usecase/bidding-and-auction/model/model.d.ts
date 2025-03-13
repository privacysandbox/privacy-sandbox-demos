export type AdAuctionDataConfig = {
  seller: string;
  coordinatorOrigin?: string;
  requestSize: number;
  perBuyerConfig: {};
};

export type ComponentAuctionConfig = {
  seller: string;
  interestGroupBuyers: string[];
  requestId: string;
  serverResponse: Uint8Array;
  resolveToConfig?: boolean;
};
