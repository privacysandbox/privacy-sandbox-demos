class TestPrivateAggregation {
  async run(data) {
    console.log('Enabling Private Aggregation Debug Mode');
    privateAggregation.enableDebugMode({debugKey: 1234n});
    let campaignId = await sharedStorage.get('campaignId');
    if (!campaignId) {
      console.log(
        'No campaign id found for client. Adding campaignId 1234567890.',
      );
      campaignId = '1234567890';
      sharedStorage.set('campaignId', campaignId);
    } else {
      console.log(`Campaign ID found: ${campaignId}`);
    }
    function convertToBucket(bucketId) {
      return BigInt(bucketId);
    }
    const bucket = convertToBucket(campaignId);
    const value = 128;
    privateAggregation.contributeToHistogram({bucket, value});
  }
}

register('test-private-aggregation', TestPrivateAggregation);
