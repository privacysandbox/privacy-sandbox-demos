// @ts-nocheck
import path from 'path';
import protoLoader from '@grpc/proto-loader';
import grpc, {ChannelCredentials} from '@grpc/grpc-js';

const GRPC_SERVER_ADDRESS = process.env.SSP_Y_GRPC;
const GRPC_SECURE_CONNECTION = process.env.SSP_Y_GRPC_SECURE === 'true';
let client: SellerFrontEnd | null = null;

if (GRPC_SERVER_ADDRESS) {
  try {
    const protoPath = path.join(
      path.resolve(),
      '/build/routes/ssp/usecase/bidding-and-auction/server/proto/sfe-client.proto',
    );

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const packageObject: any = grpc.loadPackageDefinition(packageDefinition);

    if (
      packageObject &&
      packageObject.privacy_sandbox &&
      packageObject.privacy_sandbox.bidding_auction_servers &&
      packageObject.privacy_sandbox.bidding_auction_servers.SellerFrontEnd
    ) {
      const {
        privacy_sandbox: {
          bidding_auction_servers: {SellerFrontEnd},
        },
      } = packageObject;

      let credentials;
      if (GRPC_SECURE_CONNECTION) {
        console.log(
          `SFE client for SSP-Y: Using secure TLS connection to ${GRPC_SERVER_ADDRESS}`,
        );
        credentials = grpc.credentials.createSsl();
      } else {
        console.log(
          `SFE client for SSP-Y: Using insecure connection to ${GRPC_SERVER_ADDRESS}`,
        );
        credentials = grpc.credentials.createInsecure();
      }

      client = new SellerFrontEnd(GRPC_SERVER_ADDRESS, credentials);
      console.log('SFE client for SSP-Y gRPC client created.');
    } else {
      console.error(
        'Failed to load SellerFrontEnd service definition from proto.',
      );
    }
  } catch (error) {
    console.error(
      'Error loading or creating gRPC client for SSP-Y:',
      error instanceof Error ? error.message : error,
    );
    console.log('SFE client for SSP-Y will not be loaded due to an error.');
  }
} else {
  console.log(
    'SSP_Y_GRPC environment variable not provided. SFE client will not be loaded.',
  );
}
export default client;
