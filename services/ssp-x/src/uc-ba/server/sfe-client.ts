// @ts-nocheck
import path from 'path';
import protoLoader from '@grpc/proto-loader';
import grpc from '@grpc/grpc-js';

const GRPC_SERVER_ADDRESS = '172.18.0.104:50053';

const protoPath = path.join(
  path.resolve(),
  '/build/uc-ba/server/proto/sfe-client.proto',
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const {
  privacy_sandbox: {
    bidding_auction_servers: {SellerFrontEnd},
  },
} = grpc.loadPackageDefinition(packageDefinition);
const client = new SellerFrontEnd(
  GRPC_SERVER_ADDRESS,
  grpc.credentials.createInsecure(),
);

console.log('$$$ SFE client loaded');

export default client;
