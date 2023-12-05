async function runPrivateAggregation() {
  await window.sharedStorage.worklet.addModule(
    'js/private-aggregation-worklet.js',
  );
  await window.sharedStorage.run('test-private-aggregation');
}

runPrivateAggregation();
