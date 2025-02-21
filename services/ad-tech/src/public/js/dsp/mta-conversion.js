const mtaConversionScript = document.querySelector('#mta-conversion');
const campaignId = mtaConversionScript.dataset.campaignId;
const purchaseValue = mtaConversionScript.dataset.purchaseValue;

async function multiTouchAttributionConversion() {
  // Load the Shared Storage worklet
  const sharedStorageWorklet = await window.sharedStorage.createWorklet(
    '/js/dsp/mta-conversion-worklet.js',
  );

  // Run the multi touch attribution logic
  await sharedStorageWorklet.run('mta-conversion', {
    data: {campaignId: campaignId, purchaseValue: purchaseValue},
  });
}

multiTouchAttributionConversion();
