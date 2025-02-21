const writeImpressionContextScript = document.querySelector(
  '#write-impression-context',
);
const campaignId = writeImpressionContextScript.dataset.campaignId;
const publisherId = writeImpressionContextScript.dataset.publisherId;

const impressionContextSSKey = 'impressionContext' + campaignId;
const impressionContext = {
  publisherId: publisherId,
  campaignId: campaignId,
  timestamp: Date.now(),
};

const valueToAppend = `|${JSON.stringify(impressionContext)}`;
window.sharedStorage.append(impressionContextSSKey, valueToAppend);
console.log(
  "Appended '" +
    valueToAppend +
    "' to SharedStorage key '" +
    impressionContextSSKey +
    "'.",
);
