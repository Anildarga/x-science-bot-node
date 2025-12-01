const fetch = require('node-fetch');
const { TwitterApi } = require('twitter-api-v2');

// Environment variables (set these in Vercel)
const {
  TW_API_KEY,
  TW_API_SECRET,
  TW_ACCESS_TOKEN,
  TW_ACCESS_SECRET,
  UNSPLASH_KEY,
  OPENAI_API_KEY,
  NASA_API_KEY
} = process.env;

const facts = [
  "A teaspoon of neutron star weighs 110 million tons 🌑",
  "Octopuses have three hearts and blue blood 🐙",
  "Your body replaces ~330 billion cells every day",
  "More trees on Earth (3 trillion) than stars in the Milky Way (100–400 billion) 🌳",
  "Quantum entanglement: particles linked faster than light ⚛",
];

// Twitter client (v1.1 endpoints are required for media upload)
const twitterClient = new TwitterApi({
  appKey: TW_API_KEY,
  appSecret: TW_API_SECRET,
  accessToken: TW_ACCESS_TOKEN,
  accessSecret: TW_ACCESS_SECRET,
});

async function nasaApod() {
  try {
    const key = NASA_API_KEY || 'DEMO_KEY';
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${key}`);
    const j = await res.json();
    if (j.media_type === 'image') return { url: j.url, title: j.title || 'NASA APOD' };
  } catch (e) {}
  return null;
}

async function unsplashImage() {
  if (!UNSPLASH_KEY) return null;
  try {
    const res = await fetch(`https://api.unsplash.com/photos/random?query=science&client_id=${UNSPLASH_KEY}`);
    const j = await res.json();
    if (j && j.urls && j.urls.regular) return { url: j.urls.regular, title: j.alt_description || 'Unsplash science' };
  } catch (e) {}
  return null;
}

async function openaiImage() {
  if (!OPENAI_API_KEY) return null;
  try {
    const resp = await fetch('https://api.openai.com/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: 'A stunning science-themed image for a daily science tweet.',
        n: 1,
        size: '1024x1024'
      })
    });
    const j = await resp.json();
    if (j.data && j.data[0] && j.data[0].url) return { url: j.data[0].url, title: 'AI-generated science' };
  } catch (e) {}
  return null;
}

async function uploadMediaFromUrl(url, altText) {
  try {
    const imgResp = await fetch(url);
    const arrayBuffer = await imgResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // twitter-api-v2: use v1 client for media
    const rwClient = twitterClient.v1;
    const mediaId = await rwClient.uploadMedia(buffer, { mimeType: imgResp.headers.get('content-type') });
    if (altText && rwClient) {
      try {
        await rwClient.createMediaMetadata(mediaId, { alt_text: { text: altText } });
      } catch (err) {
        // optional alt text may fail for some accounts, ignore
      }
    }
    return mediaId;
  } catch (e) {
    return null;
  }
}

async function runBot() {
  // Choose source
  const sources = ['nasa', 'unsplash', 'openai', 'none'];
  const source = sources[Math.floor(Math.random() * sources.length)];
  let chosen = null;
  if (source === 'nasa') {
    chosen = await nasaApod();
  } else if (source === 'unsplash') {
    chosen = await unsplashImage();
  } else if (source === 'openai') {
    chosen = await openaiImage();
  }
  let caption = '';
  if (chosen && chosen.url) {
    caption = `${chosen.title}\n\n#Science #Daily`;
  } else {
    caption = `Daily Science Fact:\n\n${facts[Math.floor(Math.random() * facts.length)]}\n\n#Science`;
  }

  try {
    if (chosen && chosen.url) {
      const mediaId = await uploadMediaFromUrl(chosen.url, chosen.title || 'science image');
      if (mediaId) {
        await twitterClient.v1.tweet(caption, { media_ids: [mediaId] });
        return `[OK] Posted image with source ${source}`;
      } else {
        // fallback to text-only
        await twitterClient.v1.tweet(caption);
        return `[OK] Posted text fallback (media upload failed)`;
      }
    } else {
      await twitterClient.v1.tweet(caption);
      return `[OK] Posted text fact`;
    }
  } catch (err) {
    return `[ERROR] ${String(err.message || err)}`;
  }
}

// Vercel serverless handler
module.exports = async (req, res) => {
  // Only allow GET (cron) or POST (manual)
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  const result = await runBot();
  res.status(200).send(result);
};

// If run directly (local test), run once
if (require.main === module) {
  (async () => {
    console.log('Running locally...');
    const r = await runBot();
    console.log(r);
  })();
}
