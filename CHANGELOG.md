# Changelog
## v3.1.0 (2025/4/22)
- **New Use Cases:**
  - Bidding & Auction Services for Protected Audience (PR #619)
  - Ads Composed of Multiple Pieces (full release)
  - Multi-touch Attribution (PR #620)
  - Reach Measurement (full release)

- **Fixes and Improvements:**
  - Nginx version update
  - Nginx Configuration Update
  - docusaurus config
  - New domain added
  - Dockerfile Modification

And Others


## v3.0.0 (2025/3/14)

- **New Use Cases:**

  - **Reach Measurement with Shared Storage:** Added demonstration of reach measurement using Shared Storage. (PR #573)
  - **Multi-piece Ads with Protected Audience:** Introduced demo showcasing multi-piece ads/Protected Audience ad components. (PR #560)

- **Fixes and Improvements:**

  - **Infrastructure Updates/Fixes:**
    - Fixed documentation index page to include missing demos.
    - Corrected firebase deployment script with missing project setting command.
    - Updated release notes for v2.0.0. (PR #570)

- **Refactoring:**
  - Significant code refactoring for improved efficiency and future development.

## v2.0.0 (2025/2/21)

- added framework skeleton for synthetic monitoring (see monitoring/puppeteer-nodejs/ folder)
- added support for Google Analytics in **home** service including consent banner
- added configuration for .github/github-repo-stats.yml
- Updated infrastructure to support additional dsp-x, dsp-y, ssp-y, ssp-y services
- Added deployment instructions and scripts to support Podman on top of Docker. docs/deploy-to-linux-podman.md
- Refactored the adtech services code into 1 services/adtech/ codebase. Removing code duplication and improving maintainability. Now dsp, ssp and
  other adtech services can be instantiated (containerized) from the same code base.
- Added new use case demos and refactored/updated existing ones.
- Added new capabilities to the framework to enable new demos :
  - support for buyerAndSellerReportingId in PAAPI auctions
  - support for deals in PAAPI auctions
  - support for multi-sellers, multi-buyers
  - support for video ads in iframe using SSP macros
  - publisher page (news site) to support multiple scenarios
  - fenced frames ads reporting

## v1.3.0 (2024/2/6)

### Enhancements

- Multi-seller auction demo has been added
  - Contextual auctions (header bidding and ad server auctions) are executed before the Protected Audience auction is executed.
  - The winning bid price of the contextual auction acts as the bid floor of the Protected Audience auction
  - Ad server / DSP-A / DSP-B / SSP-A / SSP-B participants have been added
  - The ad server acts as the top-level seller and DSPs/SSPs are component participants
- Instream video ad demo has been added
  - SSP VAST XML wraps around the DSP VAST URI
  - A unique ID is added to each reporting URL in the VAST
  - The finalized VAST is post-messaged out of the iframe to the IMA SDK

### Bug Fixes

NA

## v1.2.1 (2024/1/19)

### Enhancements

- Tools :
  - Adding Postman configs for Aggregation Service running on GCP
- CI/CD :
  - Update pre-commit-config to upgrade revision of mirrors-prettier and markdownlint-cli2

### Bug Fixes

NA

## v1.2 (2023/12/6)

### Enhancements

- GitHub documentation : Add a changelog
- Home Site : upgrade CMS to [Docusaurus v3](https://docusaurus.io/blog/releases/3.0)
- Enrollment and Attestation :
  - DSP Site : serve attestation file version2 on privacy-sandbox-demos-dsp.dev
  - SSP Site : serve attestation file version2 on privacy-sandbox-demos-ssp.dev
  - CI/CD : Cloud Build copies the attestation files from cicd/attestations to dsp/ssp services for the target environment
  - Update deployment documentation with instructions related to enrollment and attestation
- Demos
  - Use Case : Single-touch conversion Attribution. Move attribution code from SSP to DSP and update documentation
- Tools :

  - Add [Aggregatable Report Converter](https://github.com/privacysandbox/privacy-sandbox-demos/tree/main/tools/aggregatable_report_converter) to the
    tooling codebase. This tool helps developers to create debug aggregatable reports that can be used for Local Testing and AWS Aggregation Service
    testing.

- CI/CD Linting and Reformating code base on commit/PR
  - pre-commit.ci won't fix automatically but only raise a warning when submitting PR
  - prettier will now wrap markdown file where line length exceeds 150 chars
  - markdownlint will ignore line length on tables, ordered list validation, and html tags included for docusaurus layout.

### Bug Fixes

- #76
- #77
- #178

---

## v1.1 (2023/10/13)

### Enhancements

- Shop site : refactor service using expressJS (from nextJS)
- Shop site : fix issue with Firebase filtering session cookies
- DSP Site : attestation file is served from privacy-sandbox-demos-dsp.dev
- Use Case : remarketing. Move `renderURL` from the SSP codebase to the DSP codebase.
- Use Case : VAST Video Protected Audience. Release v1.

### Bug Fixes

- Use Case : Single-touch conversion Attribution. Fix registering attribution sources ("Attribution-Reporting-Eligible" is a Dictionary Structured
  Header and thus need to be decoded accordingly)
- Home site : fix Docusaurus and nginx configuration that prevented direct links to use cases
- Home site : fix broken links in documentation
- GitHub documentation : update deployment guides

---

## v1.0.0 (2023/06/30)

- Launch Privacy Sandbox Demos [Github Repository](https://github.com/privacysandbox/privacy-sandbox-demos)
- Launch hosted demos [https://privacy-sandbox-demos.dev/](https://privacy-sandbox-demos.dev/)
- Publication of a [blog post](https://privacysandbox.google.com/blog/privacy-sandbox-demos/)on [developers.chrome.com](http://developers.chrome.com/)
