/**
 * Fetches the topic taxonomy from the specified GitHub URL and parses it into a Map.
 * A Map is used for efficient, near-instantaneous lookups of topics by their ID.
 * @returns {Promise<Map<string, string>>} A promise that resolves to a map where
 * keys are the topic IDs and values are the topic descriptions.
 */
async function getTopicTaxonomy() {
  // The URL for the raw markdown file, not the HTML view
  const url =
    'https://raw.githubusercontent.com/patcg-individual-drafts/topics/main/taxonomy_v1.md';

  try {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');
    const taxonomyMap = new Map();

    // Start loop at index 2 to skip the table header and the separator line
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|')) {
        const parts = line.split('|').map((s) => s.trim());
        // The expected format is | ID | Topic | ... |
        if (parts.length > 2) {
          const id = parts[1];
          const topic = parts[2];
          if (id && topic) {
            taxonomyMap.set(id, topic);
          }
        }
      }
    }
    return taxonomyMap;
  } catch (error) {
    console.error('Failed to fetch or parse the topic taxonomy:', error);
    // Return an empty map so the calling function doesn't fail
    return new Map();
  }
}

/**
 * Parses an input string to find space-separated numbers in the first parenthesis,
 * looks up their corresponding topics, and returns a formatted, numbered list.
 * @param {string} inputString The string to parse (e.g., "(215 254);v=...").
 * @param {Map<string, string>} taxonomy The map of topic IDs to descriptions.
 * @returns {string} A formatted, numbered list of IDs and their topics.
 */
function getTopicsFromInputString(inputString, taxonomy) {
  // Regular expression to find and capture the content of the first set of parentheses
  const match = inputString.match(/\(([^)]+)\)/);

  // Check if a match was found and it has content inside the parentheses
  if (match && match[1]) {
    // Take the captured content (e.g., "215 254"), split by space,
    // and filter out any empty strings that might result from extra spaces.
    const numbers = match[1].split(' ').filter(Boolean);

    // Map each number to its final formatted string
    const formattedList = numbers.map((num) => {
      // Look up the topic in the map. Provide a default if not found.
      const topic = taxonomy.get(num) || 'Topic not found';
      // Format the line as "215: /Shopping"
      return `${num}: ${topic}`;
    });

    // Join the array of lines into a single string separated by newlines
    return formattedList.join('<br>');
  }

  // Return an empty string if no numbers were found in the first parenthesis
  return '';
}

let currentTopics = '';
let list = '';
const emptyTopics = '();p=P0000000000000000000000000000000';
const CURRENT_ORIGIN = '<%= CURRENT_ORIGIN %>';

async function initialize() {
  // 1. Await the resolution of the promise to get the actual Map
  const topicsMap = await getTopicTaxonomy();

  // 2. Define the fetch function that uses the resolved map
  async function makeFetchRequest() {
    const url = new URL(CURRENT_ORIGIN);
    url.pathname = '/topics/observe-browsing-topics';

    try {
      const response = await fetch(url, {browsingTopics: true});
      const json = await response.json();
      const topics = json.topics;

      if (topics && topics !== currentTopics && topics != emptyTopics) {
        list = getTopicsFromInputString(
          JSON.stringify(topics, null, 2),
          topicsMap,
        );
        document.getElementById('observed-topics').innerHTML = list;
        alert('Topic(s) detected, see Topics Observed section.');
        currentTopics = topics;
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  }

  // 3. Start the interval *after* the map has been fetched and parsed
  setInterval(makeFetchRequest, 2000);
}

//API availability check
if (
  'BrowseTopics' in document &&
  document.featurePolicy.allowsFeature('Browse-topics')
) {
  // The Topics API is supported and enabled in the current context.
  // You can now proceed with using fetch requests with the BrowseTopics attribute.
  console.log('Topics API is supported.');

  // 4. Call the main initialization function to start the process
  initialize();
} else {
  // The Topics API is not supported or has been disabled by the user or a permissions policy.
  // Fallback to a different method for content personalization.
  console.log('Topics API is not supported.');
}
