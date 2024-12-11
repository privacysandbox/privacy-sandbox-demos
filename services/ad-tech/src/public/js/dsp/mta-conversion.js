const campaignId = document.currentScript.getAttribute('campaignId');
const budget = document.currentScript.getAttribute('budget');

async function multiTouchAttributionConversion() {
  // Load the Shared Storage worklet
  const sharedStorageWorklet = await window.sharedStorage.createWorklet(
    '/js/dsp/mta-conversion-worklet.js',
  );

  // Run the multi touch attribution logic
  await sharedStorageWorklet.run('mta-conversion', {
    data: {campaignId: campaignId, budget: budget},
  });
}

multiTouchAttributionConversion();
