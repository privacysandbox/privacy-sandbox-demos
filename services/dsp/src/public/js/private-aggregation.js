let bucket = document.currentScript.getAttribute('bucket');
let cloudEnv = document.currentScript.getAttribute('cloudenv');

sharedStorage.set('bucket', `${bucket}`);
sharedStorage.set('cloudenv', `${cloudEnv}`);
console.log(`https://publickeyservice.msmt.${cloudEnv}.privacysandboxservices.com`);

async function runPrivateAggregation() {
  const privateAggCloud = {
    'privateAggregationConfig': {
      'aggregationCoordinatorOrigin': `https://publickeyservice.msmt.${cloudEnv}.privacysandboxservices.com`,
    },
  };
  await window.sharedStorage.worklet.addModule(
    'js/private-aggregation-worklet.js',
  );
  await window.sharedStorage.run('test-private-aggregation', privateAggCloud);
}

runPrivateAggregation();
