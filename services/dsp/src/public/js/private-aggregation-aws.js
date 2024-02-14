async function runPrivateAggregationAws() {
  const privateAggCloud = {'privateAggregationConfig':
    {'aggregationCoordinatorOrigin': 'https://publickeyservice.msmt.aws.privacysandboxservices.com'}};
  await window.sharedStorage.worklet.addModule('js/private-aggregation-aws-worklet.js');
  await window.sharedStorage.run('test-private-aggregation', privateAggCloud);
}

runPrivateAggregationAws();
