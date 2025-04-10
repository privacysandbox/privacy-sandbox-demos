# Demo Buyer and Seller Terraform Configurations for GCP

## Overview

This directory contains examples of the buyer and seller terraform modules.

The operator of a buyer or seller service pair (SellerFrontEnd + Auction and BuyerFrontEnd + Bidding, henceforth referred to as 'stack') will deploy
the services using terraform. The configuration of the buyer and seller modules has many different fields, so this directory is aimed at serving as a
guide for the operator trying to bring up a fully functioning stack. The seller stack is meant to communicate with a seller ad service and buyer front
ends; the buyer stack is expected to communicate only with seller front ends.

## Local Setup

Review the public
[GCP cloud support and deployment guide](https://github.com/privacysandbox/fledge-docs/blob/main/bidding_auction_services_gcp_guide.md). This document
will be continually updated with all GCP concerns.

### After Following [Initial GCP Setup](https://github.com/privacysandbox/fledge-docs/blob/main/bidding_auction_services_gcp_guide.md#guide-package-deploy-and-run-a-service)

1. Follow the steps in the [project setup README](./project_setup_utils/README.md) for setting up your GCP project.

2. Follow the steps in `production/packaging/README.md` to generate and upload docker (cryptographically attestable) docker images. The tag of the
   images that you provide should match your environment name (see `tee-image-reference` in
   `production/deploy/gcp/terraform/services/autoscaling/main.tf` to understand how the image path is derived).

## Configuration

Each stack has two major configuration components.

### Server Binary Runtime Flags

Numerous flags are consumed by the service binaries. The flags are specified via the terraform `runtime_flags` map variable (1 per stack). They are
stored in the cloud secret manager and are fetched by the services on startup. Because each service consumes many unique flags, there are two sources
to check in order to gain a full understanding of each flag:

1. In the codebase, please familiarize yourself with `services/<service_name>/runtime_flags.h` (such as `services/auction_service/runtime_flags.h`).
   These header files serve as the ultimate source of truth for the flags unique to the service. For descriptions of each flag, you can search their
   corresponding `ABSL_FLAG` definition (typically the name of the flag but all snakecase). For usage of each flag, consider searching the codebase
   for the flag name in all uppercase.
1. For flags common to all services, please inspect `services/common/constants/common_service_flags.h`. For learning more about these flags and how
   these integrate with the codebase, you can use the same principles as from step 1. For examples, please refer to `./buyer/buyer.tf` and
   `./seller/seller.tf`.

#### Bring-Your-Own-Binary (BYOB) Flags

1. Make your
   [generateBid UDF binary](https://github.com/privacysandbox/protected-auction-services-docs/blob/main/bidding_auction_services_api.md#generatebid-binary-spec)
   available via URL, cloud bucket, or local path (testing only), and add the corresponding BYOB flags to `BUYER_CODE_FETCH_CONFIG`.

   - URL: `"fetchMode": 0` and `"biddingExecutableUrl": "[your URL]"`
   - Cloud bucket: `"fetchMode": 1`, `"protectedAuctionBiddingExecutableBucket": "[your bucket]"`, and
     `"protectedAuctionBiddingExecutableBucketDefaultBlob": "[your default blob path]"`
   - Local path: `"fetchMode": 2` and `"biddingExecutablePath": "[your path]"`

   If the correct combination of `fetchMode` and `executableUrl/Path/Bucket` is not specified, the server tries to load JS/WASM instead.

1. Note that BYOB currently only supports Protected Audience. The `ENABLE_PROTECTED_AUDIENCE` flag must be true and the `ENABLE_PROTECTED_APP_SIGNALS`
   flag must be false if the BYOB flags are set or the server will crash.
1. The `UDF_NUM_WORKERS` flag can be used to specify the number of workers to be started for the UDF.
1. Logs returned by the UDF in the `log_messages` field of `GenerateProtectedAudienceBidResponse` are printed by servers built with non_prod build
   mode at verbosity level 3. The `PS_VERBOSITY` flag should be set to >= 3 to view them. Note that the standard logs from the UDF
   [are not exported for now](https://github.com/privacysandbox/data-plane-shared-libraries/blob/main/docs/roma/byob/sdk/docs/udf/Communication%20Interface.md#standard-output-stdout)
   (this will be added later on in 2025).

### GCP Architecture Flags

Running a stack in GCP requires a large number of parameters to be specified by the operator. These parameters are all of the variables specified
outside of the `runtime_flags` fields. For descriptions, please refer to `../modules/buyer/service_vars.tf` and `../modules/seller/service_vars.tf`.
For examples, please refer to `./buyer/buyer.tf` and `./seller/seller.tf`.

## Using the Demo Configuration

1.  Create a sibling directory to `demo` (the directory hosting this file). It can be called anything, although naming it after your environment may
    be convenient. Example: `my_env`
1.  Copy either ./buyer or ./seller to your directory. Example:

```bash
         |-- environment
         |   |-- demo
         |   |   |-- buyer
         |   |   `-- seller
         |   `-- my_env
         |       `-- seller
```

1.  Set the copied buyer or seller directory as your new working directory.
1.  Modify all of the variables in buyer.tf or seller.tf.
1.  `terraform init && terraform apply` from within the buyer or seller directory.
1.  If everything was configured properly, the stack should be created on GCP.
