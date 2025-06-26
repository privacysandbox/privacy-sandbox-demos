---
title: Filtering attributions for single-touch conversion attribution
sidebar_position: 8
more_data:
  - apis:
    - Attribution Reporting API
  - parties:
    - Advertiser
    - Publisher
    - Ad Tech
---

import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# Filtering attributions for single-touch conversion attribution

<Tabs>
<TabItem value="overview" label="Overview" default>

## Overview

### Description

#### Problem Statement

Advertisers with multiple product lines want to attribute conversions to the correct campaign. This is especially important with user journeys
involving interactions with multiple items or actions that aren't directly linked to a specific ad exposure. This complexity can lead to inaccurate
measurement of ad effectiveness, making it difficult to determine the true return on investment (ROI) for advertising campaigns. The inability to
filter out irrelevant engagements results in inefficient campaign optimization, as resources might be misallocated based on misleading conversion
data.

#### Solution Overview

This use case demonstrates how advertisers can leverage the Privacy Sandbox Attribution Reporting API's filtering capabilities to achieve precise
conversion measurement. The core challenge addressed is attributing conversions solely to views or clicks that correspond to the current product or
item, effectively filtering out any irrelevant engagements. In this demo, we start by configuring specific filters during the initial ad interaction
(source) registration. This ensures that only the subsequent conversion actions that involve this specific advertised item will trigger attribution
reports. This granular filtering enables advertisers to gain a more accurate understanding of ad effectiveness by directly linking ad exposure to user
engagement with particular products. The ultimate outcome is improved campaign optimization, enabling more efficient allocation of ad spend and a
clearer view of campaign ROI.

### Privacy Sandbox APIs

- [Attribution Reporting API](https://developers.google.com/privacy-sandbox/private-advertising/attribution-reporting)
- [Get started with Attribution Reporting](https://developers.google.com/privacy-sandbox/private-advertising/attribution-reporting/getting-started)

### Related parties

- Publisher
- Advertiser
- Ad Tech (e.g. Demand Side Platform (DSP))

</TabItem>
<TabItem value="design" label="Design">

## Design

### Goals

The primary goal of this use case is to demonstrate the filtering feature of the Attribution Reporting API. This demonstration will show how to ensure
that any conversion-related events, such as 'add to cart' and 'purchase' actions, are accurately attributed to the attribution sources of that
specific product or item. Consequently, these filtered conversions will trigger both event-level and summary reports.

### Assumptions

- The ad tech platform has integrated with the Privacy Sandbox Attribution Reporting API for source and trigger registration, and event level and
  summary report endpoints.
- The advertiser's website can identify the specific item by `itemId`.
- The ad tech platform can associate specific item identifiers with ad interactions during source registration.

### Key Exclusions

- This demo will focus solely on the filtering mechanism for event-level reports and summary reports. Other filtering features of the Attribution
  Reporting API are out of scope.
- Complex filter logic beyond exact `itemId` matching will not be covered in this basic demo.
- Only shows click through conversion events as a showcase.

### System Design

#### User Journey

1.  **Source Registration with Filter Data**: When a user clicks the ad, the ad tech registers a source with the browser, sending `filter_data` with
    the `item_id` for the products shown in the ad.
2.  **Trigger Registration with Filters**: When the user later adds the advertised item to a cart and proceeds to purchase it, the advertiser's site
    registers an attribution trigger with the browser. This trigger will include `filters` containing the `item_id` of the item added to the cart or
    purchased.
3.  **Browser-Side Filtering and Attribution**: The browser, operating on the user's device, is responsible for matching sources to triggers. For a
    match to occur regarding filters, for every key present in the trigger's `filters`, that same key must exist in the source's `filter_data`, and
    their associated values must be identical. If a key in the trigger's filters does not exist in the source's `filter_data`, it does not block
    attribution, and the browser evaluates other matching conditions.
4.  **Report Generation and Delivery**: Upon successful attribution that satisfies the filter conditions, the browser generates event-level and/or
    aggregatable reports and schedules them to be sent to the ad tech platform's designated reporting endpoints.

![journey](./img/single-touch-event-filtering.png)

</TabItem>
<TabItem value="demo" label="Demo">

## Demo

### Prerequisites

- Latest stable version of Chrome (Open `chrome://version` to check).
- Enable Privacy Sandbox APIs (Open `chrome://settings/adPrivacy` and ensure "Ad measurement" is enabled).

### Steps

#### Part 1: Set Up the Environment and Initial Interaction

1. Clear attribution data in `chrome://attribution-internals/`
2. [Navigate to news site](https://privacy-sandbox-demos-news.dev/mmt-single-touch-attribution-js)
   - a static ad will be displayed
3. Click the ad and navigate to the item detail page of the shop.

#### Part 2: Test Items Not Shown in Ads

4. Open the [shop site](https://privacy-sandbox-demos-shop.dev/) from a new tab and click the item not shown in the ads.
   - E.g. [Women’s Sandal](https://privacy-sandbox-demos-shop.dev/items/1f461)
   - You can check the item ID from the URL `...shop.dev/items/{ItemId}`
5. Click the “ADD TO CART” button.
6. Review “Trigger Registration” and "Event-Level Reports" tab in `chrome://attribution-internals`
   - The trigger is registered but there will be no Event-Level Reports. ![step6](./img/single-touch-event-filtering-step6.png)

#### Part 3: Test Items Shown in Ads

7. Go back to the shop site opened from step 3 and click the “ADD TO CART” button.
8. Review “Trigger Registration” and "Event-Level Reports" tab in `chrome://attribution-internals`
   - Both a trigger and an Event-Level Report are created. ![step8-1](./img/single-touch-event-filtering-step8-1.png)
     ![step8-2](./img/single-touch-event-filtering-step8-2.png)

#### Part 4: Checking summary report (Optional)

9. Go to the DSP [report page](https://privacy-sandbox-demos-dsp.dev/reporting/view-reports) and click the “Clear Report Cache” button at the bottom.
10. Go back to the shop site and click the “BANK TRANSFER” button.
11. Review “Trigger Registration” and “Aggregatable Reports” tab in `chrome://attribution-internals`
    - Only the trigger for item ID `1f45e` is reported. ![step11-1](./img/single-touch-event-filtering-step11-1.png)
      ![step11-2](./img/single-touch-event-filtering-step11-2.png) ![step11-3](./img/single-touch-event-filtering-step11-3.png)
      ![step11-4](./img/single-touch-event-filtering-step11-4.png) ![step11-5](./img/single-touch-event-filtering-step11-5.png)
12. Go back to the DSP [report page](https://privacy-sandbox-demos-dsp.dev/reporting/view-reports) and refresh the page.
13. Check the summary report from the [report page](https://privacy-sandbox-demos-dsp.dev/reporting/view-reports).
    ![step13](./img/single-touch-event-filtering-step13.png)

### Implementation details

#### Register a source

The ad tech platform is responsible for ensuring that the correct `item_id` is dynamically included in the `filter_data` during source registration.
This `item_id` must correspond precisely to the specific product featured in the ad that the user interacted with, ensuring that only relevant
conversions are attributed.

```javascript
// Initiate the source registration
<img src="https://privacy-sandbox-demos-shop.dev/image/svg/emoji_1f45e.svg" attributionsrc="https://privacy-sandbox-demos-dsp.dev/attribution/register-source?advertiser=privacy-sandbox-demos-shop.dev&itemId=1f45e">

// Complete the source registration in the server
// ...
   filter_data = {item_id: [itemId] };
// ...

// Attribution-Reporting-Register-Source header
res.set(
  "Attribution-Reporting-Register-Source",
  JSON.stringify({
    source_event_id: "EVENT_ID_123",
    destination: "https://privacy-sandbox-demos-shop.dev",
    filter_data,
    aggregation_keys: {}
    // ... other source registration parameters
  })
);
```

Refer to the real code for source registration with js
[here](https://github.com/privacysandbox/privacy-sandbox-demos/blob/0095796fcf0ec2451071b662a09d12feb3ece140/services/ad-tech/src/public/js/dsp/usecase/single-touch-attribution/static-ads-for-ara-js.js#L32)
and source header creation
[here](https://github.com/privacysandbox/privacy-sandbox-demos/blob/0095796fcf0ec2451071b662a09d12feb3ece140/services/ad-tech/src/lib/attribution-reporting-helper.ts#L145).

#### Register a trigger

The advertiser's website needs to ensure the item_id of the selected product is included during trigger registration.

```javascript
// Trigger registration when add to cart button is clicked
<button type="submit" ... onclick="addToCart()">ADD TO CART</button>

// Initiate event level report trigger registration
function addToCart() {
      const registerSourceUrl = "https://privacy-sandbox-demos-dsp.dev/attribution/register-event-level-trigger?itemId=1f45e"
 // ...
      window.fetch(registerSourceUrl, {
        mode: "no-cors",
        keepalive: true,
        attributionReporting: {
          eventSourceEligible: false,
          triggerEligible: true,
        },
      })
    }

// Attribution-Reporting-Register-Trigger
// ...
const itemId: string = requestQuery['itemId'] as string;
const filters = {item_id: [itemId]}
// ...
res.setHeader(
  "Attribution-Reporting-Register-Trigger",
  JSON.stringify({
    filters: filters,
    event_trigger_data: []
    // For aggregatable reports
    aggregatable_trigger_data: [],
    aggregatable_values: {}
    // ... other optional trigger registration parameters
  })
);

```

Refer to the real code for event level report
[here](https://github.com/privacysandbox/privacy-sandbox-demos/blob/0095796fcf0ec2451071b662a09d12feb3ece140/services/ad-tech/src/lib/attribution-reporting-helper.ts#L103)
and aggregatable report
[here](https://github.com/privacysandbox/privacy-sandbox-demos/blob/0095796fcf0ec2451071b662a09d12feb3ece140/services/ad-tech/src/lib/attribution-reporting-helper.ts#L54).

</TabItem>
</Tabs>
