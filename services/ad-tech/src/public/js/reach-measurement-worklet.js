console.log(
  'Loading . . . services/ad-tech/src/public/js/reach-measurment-worklet.js',
);

// Learn more about noise and scaling from the Private Aggregation fundamentals
// documentation on Chrome blog
const SCALE_FACTOR = 65536;
function convertContentIdToBucket(contentId) {
  return BigInt(contentId);
}

class ReachMeasurementOperation {
  async run(data) {
    const {contentId} = data;

    // Read from Shared Storage
    const key = 'has-reported-content: ' + contentId;
    const hasReportedContent = (await sharedStorage.get(key)) === 'true';

    // Do not report if a report has been sent already
    if (hasReportedContent) {
      console.log('Content ID already seen:  ' + key);
      return;
    }

    // console.log('contentId:');
    // console.log(contentId);

    // Generate the aggregation key and the aggregatable value
    const bucket = convertContentIdToBucket(contentId);
    const value = 1 * SCALE_FACTOR;

    console.log('bucket:');
    console.log(bucket);

    // Send an aggregatable report via the Private Aggregation API
    console.log('contributeToHistogram:');
    privateAggregation.contributeToHistogram({bucket, value});
    // Set the report submission status flag
    console.log('Shared Storage key ' + key + ' stored');
    await sharedStorage.set(key, true);
  }
}

// Register the operation
register('reach-measurement', ReachMeasurementOperation);
