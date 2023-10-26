# Changelog

## v1.x.x (2023/xx/xx)

#### Enhancements
- DSP Site : serve attestation file version2 on privacy-sandbox-demos-dsp.dev
- Use Case : Single-touch conversion Attribution. Move attribution code from SSP to DSP
- Tools : Add [Aggregatable Report Converter](https://github.com/privacysandbox/privacy-sandbox-demos/tree/main/tools/aggregatable_report_converter) to the tooling codebase. This tool helps developers to create debug aggregatable reports that can be used for Local Testing and AWS Aggregation Service testing
- GitHub documentation : Add a changelog.

#### Bug Fixes


---

## v1.1 (2023/10/13)

#### Enhancements
- Shop site  : refactor service using expressJS (from nextJS)
- Shop site : fix issue with Firebase filtering session cookies
- DSP Site : attestation file is served from privacy-sandbox-demos-dsp.dev
- Use Case : remarketing. Move `renderURL` from the SSP codebase to the DSP codebase
- Use Case : VAST Video Protected Audience. Release v1


#### Bug Fixes
- Use Case : Single-touch conversion Attribution. Fix registering attribution sources ("Attribution-Reporting-Eligible" is a Dictionary Structured Header and thus need to be decoded accordingly)
- Home site : fix Docusaurus and nginx configuration that prevented direct links to use cases
- Home site : fix broken links in documentation
- GitHub documentation : update deployment guides

---

## v1.0.0 (2023/06/30)
- Launch Privacy Sandbox Demos [Github Repository](https://github.com/privacysandbox/privacy-sandbox-demos)
- Launch hosted demos [https://privacy-sandbox-demos.dev/ ](https://privacy-sandbox-demos.dev/)
- Publication of a [blog post ](https://developer.chrome.com/blog/privacy-sandbox-demos/)on [developers.chrome.com](http://developers.chrome.com/)
