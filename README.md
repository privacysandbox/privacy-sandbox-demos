# Privacy Sandbox Demos

A use case demo library for
[Privacy Sandbox APIs](https://developer.chrome.com/en/docs/privacy-sandbox/).

## Motivation

The Privacy Sandbox initiative offers [20+ APIs](https://developer.chrome.com/en/docs/privacy-sandbox/) to protect people’s privacy online while giving companies and developers tools to build thriving digital businesses.

Web ecosystem developers expect new approaches to typical use cases supported today by third-party cookies. These use cases often require incorporating a combination of new Privacy Sandbox APIs into their products, which requires complex planning and a clear understanding how these APIs work.

## Our proposition

The Privacy Sandbox Demos repository offers cookbook recipes, sample code, and demo applications, based on Privacy Sandbox APIs. These are intended to aid businesses and developers in adapting their applications and the businesses they support to a web ecosystem without third-party cookies.

The demo assets are released under open-source [license](https://github.com/privacysandbox/privacy-sandbox-demos).

This repository contains :

- A set of applications/services deployable as container images
- Deployment scripts
- [Instructions for deploying and running the demos in your local environment with Docker](docs/deploy-to-linux-docker.md)
- [Instructions for deploying and running the demos on Google Cloud Platform](docs/deploy-to-gcp.md)
- Development framework to contribute to the project

If you are a developer we recommend you follow the [deployment instructions](docs/deploy-to-linux-docker.md). If you are simply curious, we recommend you have a look at our [Google-hosted instances](https://privacy-sandbox-demos.dev) to quickly start learning and experimenting.

## Use Cases

The current release supports the following use cases:

| **Use Case**                        | **Description**                                                                                     | **APIs**                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Remarking                           | Show relevant ads to a user who has researched a brand or product online.                           | Protected Audience <br> Fenced Frame |
| Single-touch conversion Attribution | Measure conversion after seeing ads on a news site and buying a project on an online shopping site. | Attribution Reporting API            |

These use cases are based on a set of demo apps and services that we have developed to simulate the actors in the ad tech ecosystem :

| **Demo app/services**              | **Description**                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-commerce site                    | An advertiser shopping site                                                                                                                                                                                                                                                         |
| News site                          | A publisher site where ads will be displayed                                                                                                                                                                                                                                        |
| SSP service (Supply Side Platform) | The demo SSP service will Choose ads to show based on Topics, Protected Audience auctions and other contextual or first-party signals. Show ads in iframe or fenced frame. Register view/click impressions with Attribution Reporting API. Detect ad fraud via Private State Tokens |
| DSP service (Demand Side Platform) | The demo DSP service will Add a user into an Interest Group with Protected Audience API. Register conversions with Attribution Reporting API                                                                                                                                        |

We’re continuing our effort to deliver comprehensive documentation and demos, and we welcome your feedback on which use cases you would like to see in future releases. Share your ideas and feedback on our issue tracker.
