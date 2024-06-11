class TestPrivateAggregation {
  async run(data) {
    let cloudEnv = await sharedStorage.get('cloudenv');
    console.log(`Enabling ${cloudEnv} Private Aggregation Debug Mode`);
    privateAggregation.enableDebugMode({debugKey: 1234n});
    let bucketKey = await sharedStorage.get('bucket');
    if (bucketKey === 'undefined') {
      console.log(
        'No bucket key found for client. Adding default bucketKey 1234567890.',
      );
      bucketKey = '1234567890';
      sharedStorage.set('bucketKey', bucketKey);
    } else {
      console.log(`Bucket Key found: ${bucketKey}`);
    }
    function convertToBucket(bucketId) {
      return BigInt(bucketId);
    }
    const bucket = convertToBucket(bucketKey);
    const value = 128;
    privateAggregation.contributeToHistogram({bucket, value});
    sharedStorage.clear();
  }
}

register('test-private-aggregation', TestPrivateAggregation);
