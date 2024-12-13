const SCALE_FACTOR = 256;

function generateAggregationKey(campaignId, publisherId) {
  const aggregationKey = BigInt(`${campaignId}${publisherId}`);
  return aggregationKey;
}

class MultiTouchAttributionConversion {
  async run(data) {
    const {campaignId, purchaseValue} = data;
    console.log('Purchase value for MTA Conversion: ' + purchaseValue);

    // Read from Shared Storage
    const impressionContextSSKey = 'impressionContext' + campaignId;
    console.log('Reading from Shared Storage. Key: ' + impressionContextSSKey);
    let impressions = await sharedStorage.get(impressionContextSSKey);

    // Do not report if there isn't any impression
    if (!impressions) {
      console.log(
        "Couldn't find impressions in Shared Storage. Key: " +
          impressionContextSSKey,
      );
      return;
    }

    // Impressions saved in the Shared Storage will have this format:
    // "|{"publisherId":"1000","campaignId":"123","timestamp":1723061856804}|{"publisherId":"2000","campaignId":"123","timestamp":1723061876437}|..."
    // So, we need to split using the delimeter '|' after removing the first character

    impressions = impressions.substring(1);
    const impressionsArray = impressions.split('|');
    const numberImpressions = impressionsArray.length;

    console.log('MTA conversion - Found ' + numberImpressions + ' impressions');

    // Custom logic for Multi Touch Attribution
    // In this example, we are splitting the total purchase value of this campaign equally between all impressions
    // (which might have duplicate publishers)

    impressionsArray.forEach((impression) => {
      let impressionParsed = JSON.parse(impression);

      // Generate the aggregation key and the aggregatable value
      const bucket = generateAggregationKey(
        campaignId,
        impressionParsed.publisherId,
      );
      const value =
        Math.floor(purchaseValue / numberImpressions) * SCALE_FACTOR;

      // Send an aggregatable report via the Private Aggregation API
      console.log('contributeToHistogram ' + bucket + ' ' + value);
      privateAggregation.contributeToHistogram({bucket, value});
    });

    // Delete these impressions after the conversion and reporting
    await sharedStorage.delete(impressionContextSSKey);
    console.log('Deleted Shared Storage. Key: ' + impressionContextSSKey);
  }
}

// Register the operation
register('mta-conversion', MultiTouchAttributionConversion);
