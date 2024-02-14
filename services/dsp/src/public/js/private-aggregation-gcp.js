async function runPrivateAggregationGcp() {
    const privateAggCloud = {'privateAggregationConfig':
      {'aggregationCoordinatorOrigin': 'https://publickeyservice.msmt.gcp.privacysandboxservices.com'}};
    await window.sharedStorage.worklet.addModule('js/private-aggregation-gcp-worklet.js');
    await window.sharedStorage.run('test-private-aggregation', privateAggCloud);
  }
  
  runPrivateAggregationGcp();
  