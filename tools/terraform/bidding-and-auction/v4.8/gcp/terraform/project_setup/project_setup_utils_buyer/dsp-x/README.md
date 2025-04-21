# Overview

This directory contains various subdirectories that provide project setup functionality. See the README.md in each subdirectory for more details.

If you are setting up Bidding and Auction Services for the first time, it is strongly recommended that you perform the actions described by the
README.md in each subdirectory.

## Pre-Requisites

You will first need to create a GCP project and set up billing. You should also purchase a domain for testing.

Then, you will need to install `glcoud` on the machine from which you plan to run terraform setup and you will need to authenticate with
`gcloud auth login`.

Finally, set your default project with: `gcloud config set project <Your project id, found in cloud console>`

## Terraform Deploy Permissions

For initial setup, it is recommended that your account (or any account attempting to deploy the resources specified by the terraform) has
[`roles/owner`](https://cloud.google.com/iam/docs/roles-overview) in your GCP project.

<!-- markdownlint-disable -->
<details>
<summary>Fine-grain permissions list (if not using roles/owner).</summary>

```bash
appengine.applications.get
appengine.instances.enableDebug
artifactregistry.files.download
artifactregistry.files.list
artifactregistry.locations.list
artifactregistry.packages.delete
artifactregistry.packages.list
artifactregistry.projectsettings.get
artifactregistry.projectsettings.update
artifactregistry.repositories.create
artifactregistry.repositories.delete
artifactregistry.repositories.get
artifactregistry.repositories.list
artifactregistry.repositories.listEffectiveTags
artifactregistry.repositories.update
artifactregistry.repositories.uploadArtifacts
artifactregistry.tags.create
artifactregistry.tags.delete
artifactregistry.tags.list
artifactregistry.tags.update
artifactregistry.versions.delete
artifactregistry.versions.get
artifactregistry.versions.list
backupdr.backupPlanAssociations.list
backupdr.operations.list
billing.resourceCosts.get
cloudasset.assets.searchAllResources
cloudbuild.builds.editor
cloudnotifications.activities.list
cloudprivatecatalogproducer.products.create
commerceorggovernance.services.get
commerceorggovernance.services.list
commerceorggovernance.services.request
compute.acceleratorTypes.list
compute.addresses.list
compute.autoscalers.create
compute.autoscalers.delete
compute.autoscalers.get
compute.autoscalers.list
compute.backendServices.create
compute.backendServices.delete
compute.backendServices.get
compute.backendServices.list
compute.backendServices.use
compute.disks.create
compute.disks.get
compute.disks.list
compute.diskTypes.list
compute.firewalls.create
compute.firewalls.delete
compute.firewalls.get
compute.firewalls.list
compute.globalAddresses.create
compute.globalAddresses.delete
compute.globalAddresses.get
compute.globalAddresses.use
compute.globalForwardingRules.create
compute.globalForwardingRules.delete
compute.globalForwardingRules.get
compute.globalForwardingRules.setLabels
compute.globalOperations.get
compute.healthChecks.create
compute.healthChecks.delete
compute.healthChecks.get
compute.healthChecks.use
compute.healthChecks.useReadOnly
compute.instanceGroupManagers.create
compute.instanceGroupManagers.delete
compute.instanceGroupManagers.get
compute.instanceGroupManagers.list
compute.instanceGroupManagers.use
compute.instanceGroups.create
compute.instanceGroups.delete
compute.instanceGroups.list
compute.instanceGroups.use
compute.instances.addAccessConfig
compute.instances.attachDisk
compute.instances.create
compute.instances.delete
compute.instances.deleteAccessConfig
compute.instances.detachDisk
compute.instances.get
compute.instances.getSerialPortOutput
compute.instances.list
compute.instances.listEffectiveTags
compute.instances.listReferrers
compute.instances.osLogin
compute.instances.reset
compute.instances.resume
compute.instances.setDeletionProtection
compute.instances.setDiskAutoDelete
compute.instances.setLabels
compute.instances.setMachineResources
compute.instances.setMachineType
compute.instances.setMetadata
compute.instances.setMinCpuPlatform
compute.instances.setScheduling
compute.instances.setServiceAccount
compute.instances.setTags
compute.instances.start
compute.instances.stop
compute.instances.suspend
compute.instances.updateAccessConfig
compute.instances.updateDisplayDevice
compute.instances.updateNetworkInterface
compute.instances.updateShieldedInstanceConfig
compute.instanceTemplates.create
compute.instanceTemplates.delete
compute.instanceTemplates.get
compute.instanceTemplates.useReadOnly
compute.machineImages.create
compute.machineTypes.get
compute.machineTypes.list
compute.networks.create
compute.networks.delete
compute.networks.get
compute.networks.list
compute.networks.updatePolicy
compute.projects.get
compute.projects.setCommonInstanceMetadata
compute.regionOperations.get
compute.regions.list
compute.resourcePolicies.create
compute.resourcePolicies.list
compute.routers.create
compute.routers.delete
compute.routers.get
compute.routers.update
compute.sslCertificates.create
compute.sslCertificates.delete
compute.sslCertificates.get
compute.sslCertificates.list
compute.subnetworks.create
compute.subnetworks.delete
compute.subnetworks.get
compute.subnetworks.list
compute.subnetworks.use
compute.targetHttpsProxies.create
compute.targetHttpsProxies.delete
compute.targetHttpsProxies.get
compute.targetHttpsProxies.list
compute.targetHttpsProxies.use
compute.targetPools.list
compute.targetSslProxies.list
compute.targetTcpProxies.create
compute.targetTcpProxies.delete
compute.targetTcpProxies.get
compute.targetTcpProxies.use
compute.urlMaps.create
compute.urlMaps.delete
compute.urlMaps.get
compute.urlMaps.use
compute.zones.list
consumerprocurement.entitlements.list
container.clusters.list
container.deployments.create
containeranalysis.occurrences.list
dns.changes.create
dns.changes.get
dns.resourceRecordSets.create
dns.resourceRecordSets.delete
dns.resourceRecordSets.list
errorreporting.groups.list
iam.serviceAccounts.actAs
iam.serviceAccounts.list
iap.tunnelInstances.accessViaIAP
logging.buckets.list
logging.buckets.update
logging.logEntries.download
logging.logEntries.list
logging.logServiceIndexes.list
logging.logServices.list
logging.privateLogEntries.list
logging.queries.deleteShared
logging.queries.listShared
logging.queries.share
logging.queries.updateShared
logging.queries.usePrivate
logging.settings.get
logging.views.list
monitoring.alertPolicies.create
monitoring.alertPolicies.list
monitoring.alertPolicies.update
monitoring.dashboards.create
monitoring.dashboards.delete
monitoring.dashboards.get
monitoring.dashboards.list
monitoring.dashboards.update
monitoring.groups.list
monitoring.metricDescriptors.get
monitoring.metricDescriptors.list
monitoring.monitoredResourceDescriptors.list
monitoring.timeSeries.list
monitoring.uptimeCheckConfigs.create
monitoring.uptimeCheckConfigs.list
networkservices.grpcRoutes.create
networkservices.grpcRoutes.delete
networkservices.grpcRoutes.get
networkservices.meshes.create
networkservices.meshes.delete
networkservices.meshes.get
networkservices.meshes.use
networkservices.operations.get
observability.scopes.get
opsconfigmonitoring.resourceMetadata.list
orgpolicy.policy.get
osconfig.inventories.get
osconfig.osPolicyAssignments.create
osconfig.osPolicyAssignments.get
osconfig.vulnerabilityReports.get
pubsub.subscriptions.consume
pubsub.subscriptions.delete
pubsub.subscriptions.get
pubsub.subscriptions.getIamPolicy
pubsub.subscriptions.list
pubsub.subscriptions.setIamPolicy
pubsub.subscriptions.update
recommender.computeInstanceGroupManagerMachineTypeRecommendations.list
recommender.computeInstanceIdleResourceRecommendations.list
recommender.computeInstanceMachineTypeRecommendations.list
recommender.iamPolicyInsights.list
recommender.iamPolicyRecommendations.list
resourcemanager.projects.get
resourcemanager.projects.getIamPolicy
resourcemanager.projects.setIamPolicy
resourcemanager.projects.update
run.services.create
secretmanager.secrets.create
secretmanager.secrets.delete
secretmanager.secrets.get
secretmanager.versions.access
secretmanager.versions.add
secretmanager.versions.destroy
secretmanager.versions.enable
secretmanager.versions.get
securitycenter.userinterfacemetadata.get
serviceusage.services.disable
serviceusage.services.enable
serviceusage.services.get
serviceusage.services.list
stackdriver.projects.get
stackdriver.resourceMetadata.list
storage.buckets.create
storage.buckets.getObjectInsights
storage.buckets.list
storage.buckets.listEffectiveTags
storageinsights.reportConfigs.create
storagetransfer.jobs.create
```

</details>
<!-- markdownlint-restore -->

## Project Setup

1. Open the [main.tf file](./main.tf) and edit the `backend` block.

2. Configure your [variables.tf file](./variables.tf) to supply the modules with the necessary information for deployment

Once these files have been updated the following modules will be ready for deployment:

- [API](./api/main.tf): You must enable the APIs before attempting to run any other terraform. This directory provides terraform functionality to
  enable the APIs used by the Bidding and Auction Services.

- [Domain](./domain/main.tf) : This directory provides terraform functionality to create domain records and TLS for buyers and sellers. You only need
  to ever run this once for every unique domain you wish to use.

  When testing, it is useful to bring up both a buyer and seller, so by default the provided configs provide DNS and TLS support for all services. You
  may modify [domain terraform file](./domain/main.tf) to suit your needs, although the defaults are strongly recommended for initial project setup.

  Specifically, you will provide a domain -- for example, `example.com`. Then, the terraform in this directory will create DNS records for
  `sfe.example.com` and `bfe.example.com`, with wildcard TLS certificates for `*sfe.example.com` and `*bfe.example.com`.

  The TLS certificates renew via DNS challenge (for which the provided configs also automatically create records).

- [Internal TLS](./internal_tls/main.tf) : GCP Application Load Balancers
  [require their backends to terminate TLS connections](https://cloud.google.com/load-balancing/docs/ssl-certificates/encryption-to-the-backends). The
  terraform in this directory installs certificates that the Seller Frontend VM envoy and Buyer Frontend VM grpc server processes will use to
  terminate the load balancer TLS connection. The certificates may be self-signed and may be used in production. These are separate from the TLS
  certificates required for client to load balancer communication -- see the [Domain](./domain/main.tf) setup for more details.

- [Service accounts](./service_account/main.tf): A service account is attached to each running Bidding and Auction service's Confidential Compute
  instance and require permissions for all of the actions the service will perform.

  This directory provides terraform functionality to create a service account and configure all project permissions the service account requires to
  operate the Bidding and Auction servers.

  Additionally, the provided configs create a
  [GCS HMAC Key](https://github.com/privacysandbox/bidding-auction-servers/blob/722e1542c262dddc3aaf41be7b6c159a38cefd0a/production/deploy/gcp/terraform/modules/secrets/secrets.tf#L49)
  for usage with
  [consented debugging](https://github.com/privacysandbox/protected-auction-services-docs/blob/main/debugging_protected_audience_api_services.md#adtech-consented-debugging).
  This key is tied to the service account.

**OPTIONAL but recommended:** Configure [Cloud Build](../../../../../../packaging/gcp/cloud_build/README.md) to automatically build the latest
releases.

## Usage

In the same directory as this README, run:

```bash
terraform init
terraform apply # You will have to type 'yes' if you approve of the plan.
```

The terraform for the server setup ([buyer](../buyer/buyer.tf) and [seller](../seller/seller.tf)) may then reference the outputs of this terraform for
setup of the individual services. You will need to save the outputs (but you can just run `terraform apply` again if you lose them).

Visit the link output by `zone_url` and verify that your Primary zone NS and SOA records conform with your domain registrar.
