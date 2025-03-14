/*
const fetchDataEl = document.getElementById('fetch-data');
const noTopicsEl = document.getElementById('no-topics');

let currentTopics = '';

function makeFetchRequest() {
  fetch('https://privacy-sandbox-demos-dsp-a.dev/topics/observe-browsing-topics', {browsingTopics: true}).
    then(function(response) {
    // console.log(response);
      return response.json();
    }).then(function(json) {
      const topics = json['sec-browsing-topics'];
      if (topics && topics !== currentTopics) {
        noTopicsEl.classList.add('hidden');
        fetchDataEl.innerHTML += fetchDataEl.innerHTML +
            `<p>fetch() request made with sec-browsing-topics header: ` +
            `${JSON.stringify(topics, null, 2)}</p>`;
        // clearInterval(intervalId)
        currentTopics = topics;
      }
  });
}

const intervalId = setInterval(makeFetchRequest, 2000);
*/

const topicsList = document.querySelector('#observed-topics')

let currentTopics = '';
const emptyTopics = '();p=P0000000000000000000000000000000';

async function makeFetchRequest() {
  const response = await fetch('https://privacy-sandbox-demos-dsp-a.dev/topics/observe-browsing-topics', { browsingTopics: true });
  const json = await response.json();
  const topics = json.topics;
  if (topics && topics !== currentTopics && topics != emptyTopics) {
      const li = document.createElement("li");
      li.textContent = `fetch() request made with sec-browsing-topics header: ${JSON.stringify(topics, null, 2)}`;
      topicsList.appendChild(li);
      //console.log(topics)
      currentTopics = topics;
  }
}

const intervalId = setInterval(makeFetchRequest, 2000);
