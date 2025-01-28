---
title: Event-level reports for single touch attribution
sidebar_position: 6
more_data:
  - apis:
      - Attribution Reporting API
  - parties:
      - Publisher
      - Advertiser
      - Ad Tech
---

import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# Event-level reports for single touch attribution

<Tabs>
<TabItem value="overview" label="Overview" default>

## Overview

### Description

Event-level reports help measure ad effectiveness while protecting user privacy. This demo shows how the Attribution Reporting API links ad
interactions to conversions without revealing user identities across websites. It focuses on single-touch attribution using the last-click model.
![overview](./img/single-touch-event-level-report-overview.png)

### Privacy Sandbox APIs

- [Attribution Reporting API](https://developer.chrome.com/en/docs/privacy-sandbox/attribution-reporting/)
- [Get started with Attribution Reporting](https://developers.google.com/privacy-sandbox/private-advertising/attribution-reporting/getting-started)

### Related parties

- Publisher: Hosts ads
- Advertiser: Hosts conversion pages, tracks conversions
- Ad Tech: Implements API, receives cross-site reports

</TabItem>
<TabItem value="scope" label="Scope">

## Scope

### System Design

We are exploring two distinct user journeys for ad attribution:

- User Journey 1: Click-through conversion: The user visits a news site, clicks on an ad, then navigates to the advertiser's site where they convert.
  The system tracks the ad click and the subsequent conversion.
- User Journey 2: View-through conversion: The user sees an ad on a news site without clicking it. Later, they independently visit the advertiser's
  site and convert. The system connects this conversion to the earlier ad view. In both cases, the Attribution Reporting API links the ad interaction
  (click or view) to a conversion without compromising user privacy across sites.

### Attribution Reporting (Event-level) Flow

We focus on two user journeys: click-through and view-through conversions. In the click-through journey, the user actively clicks an ad on a
publisher's site before converting on the advertiser's site. In the view-through journey, on the other hand, the user sees an ad without clicking, and
later independently visits and converts on the advertiser's site. Both journeys enable advertisers to measure ad effectiveness by linking ad
interactions (clicks or views) to conversions, all while preserving user privacy across different websites.
![journey](./img/single-touch-event-level-report-journey.png)

The following sequence diagram illustrates these two main user journeys in digital advertising attribution: click-through and view-through. It shows
how the Attribution Reporting API tracks user interactions across publisher and advertiser websites, highlighting the key differences in timing and
user behavior between the two scenarios.

```mermaid
sequenceDiagram
participant User/Browser
participant Publisher Website
participant Advertiser Website
participant AdTech

rect rgb(200, 220, 240)
Note right of User/Browser: Click-through Journey
User/Browser->>Publisher Website: Visit website
Publisher Website->>AdTech: Register source (ad impression)
AdTech->>User/Browser: Set Attribution-Reporting-Register-Source header
Publisher Website->>Advertiser Website: Click ad
Advertiser Website->>AdTech: Register trigger
AdTech->>User/Browser: Set Attribution-Reporting-Register-Trigger header
User/Browser->>User/Browser: Generate report
User/Browser->>AdTech: Send report to /.well-known/attribution-reporting/report-event-attribution
end

rect rgb(220, 240, 200)
Note right of User/Browser: View-through Journey
User/Browser->>Publisher Website: Visit website
Publisher Website->>AdTech: Register source (ad impression)
AdTech->>User/Browser: Set Attribution-Reporting-Register-Source header
User/Browser->>User/Browser: Time passes
User/Browser->>Advertiser Website: Directly visit advertiser website & convert
Advertiser Website->>AdTech: Register trigger
AdTech->>User/Browser: Set Attribution-Reporting-Register-Trigger header
User/Browser->>User/Browser: Generate report
User/Browser->>AdTech: Send report to /.well-known/attribution-reporting/report-event-attribution
end
```

</TabItem>
<TabItem value="demo" label="Demo">

## Demo

### Prerequisites

- Chrome > v127 (Open chrome://version to look up your current version)
- Open chrome://attribution-internals/ and Click on “Clear all attribution data”

### Click-Through Conversion Journey

1. Clear attribution data in chrome://attribution-internals/
2. [Navigate to news site](https://privacy-sandbox-demos-news.dev/iframe-static-img-ad)

- ice skate shoes image will be displayed

3. Click on the ad image

- Demo shop site of skate shoes detail page will open

4. Check Trigger Registration tab in chrome://attribution-internals
5. Go back to the shop site and click the "ADD TO CART" button
6. Check "Event-Level Reports" tab in chrome://attribution-internals

### View-Through Conversion Journey

1. Clear attribution data in chrome://attribution-internals/
2. [Navigate to news site](https://privacy-sandbox-demos-news.dev/iframe-static-img-ad)

- ice skate shoes image will be displayed

3. Click on "To the shop without ad click" below the image

- Demo shop site will open

4. Check Trigger Registration tab in chrome://attribution-internals
5. Go back to the shop site and click an item
6. Click on the "ADD TO CART" button
7. Check "Event-Level Reports" tab in chrome://attribution-internals

### Implementation details

#### Register a source

Sources are registered when a user views or clicks an ad. This is done on the publisher's website.

To do so we need to:

- Initiate the source registration with an HTML element or a Javascript call
- Complete the source registration, responding to the request with the header Attribution-Reporting-Register-Source.
  ![request](./img/single-touch-event-level-report-request.png)

### Initiatie the source registration

For clicks:

```html
<a href="https://advertiser.example/landing" attributionsrc="https://adtech.example/register-source?campaign=spring&creative=banner1">
  Click here!
</a>
```

For views:

```html
<img src="https://publisher.example/ad-image.jpg" attributionsrc="https://adtech.example/register-source?campaign=spring&creative=banner1">
```

### Complete the source registration

For both clicks and views is to respond with the Attribution-Reporting-Register-Source header.

```js
res.set(
  "Attribution-Reporting-Register-Source",
  JSON.stringify({
    source_event_id: "1234",
    destination: "https://advertiser.example",
    // Optional fields
    expiry: "604800",
    priority: "100",
    debug_key: "1234"
  })
);
```

### Register a trigger

Triggers are registered when a user converts on the advertiser's website. Here we will use a pixel.
![request2](./img/single-touch-event-level-report-request2.png)

### Initiate the trigger registration

```html
<img src="https://advertiser.example/conversion-pixel" attributionsrc="https://adtech.example/register-trigger?value=VALUE">
```

### Respond with a header

Here, we set Attribution-Reporting-Register-Trigger on the request:

```js
res.set(
  "Attribution-Reporting-Register-Trigger",
JSON.stringify({
  event_trigger_data: [{
    trigger_data: "VALUE",
    // Optional
    priority: "1000000000000",
    deduplication_key: "1234"
  }],
  debug_key: "1115698977"
});
);
```

### Set up an endpoint

All we have to do now is to create an endpoint at <https://adtech.example/.well-known/attribution-reporting/report-event-attribution> to receive
reports.

![endpoint](./img/single-touch-event-level-report-endpoint.png)

### Related API documentation

- [Attribution Reporting - Chrome Developers](https://developer.chrome.com/docs/privacy-sandbox/attribution-reporting/)
- [Attribution Reporting - Developer Guide](https://developer.chrome.com/docs/privacy-sandbox/attribution-reporting/developer-guide/)
- [Set up debug reports - Chrome Developers](https://developer.chrome.com/docs/privacy-sandbox/attribution-reporting-debugging/part-2/)

</TabItem>
</Tabs>
