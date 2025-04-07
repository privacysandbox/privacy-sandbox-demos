// @ts-nocheck
import path from 'path';
import protoLoader from '@grpc/proto-loader';
import grpc, {ChannelCredentials} from '@grpc/grpc-js';

const GRPC_SERVER_ADDRESS = process.env.SSP_X_GRPC;
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

      client = new SellerFrontEnd(
        GRPC_SERVER_ADDRESS,
        grpc.credentials.createInsecure(),
      );

      console.log('SFE client for SSP-X loaded successfully');
    } else {
      console.error(
        'Failed to load SellerFrontEnd service definition from proto.',
      );
    }
  } catch (error) {
    console.error(
      'Error loading or creating gRPC client for SSP-X:',
      error instanceof Error ? error.message : error,
    );
    console.log('SFE client for SSP-X will not be loaded due to an error.');
  }
} else {
  console.log(
    'SSP_X_GRPC environment variable not provided. SFE client will not be loaded.',
  );
}
export default client;
