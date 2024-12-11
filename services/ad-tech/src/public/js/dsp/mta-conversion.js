let campaignId = document.currentScript.getAttribute('campaignId');
let budget = document.currentScript.getAttribute('budget');

async function multiTouchAttributionConversion() {
  // Load the Shared Storage worklet
  await window.sharedStorage.worklet.addModule('js/mta-conversion-worklet.js');

  // Run the multi touch attribution logic
  await window.sharedStorage.run('mta-conversion', {
    data: {campaignId: campaignId, budget: budget},
  });
}

multiTouchAttributionConversion();
