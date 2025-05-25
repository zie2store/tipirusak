export default async function handler(req, res) {
  const streamUrl = 'https://zekonew.newkso.ru/zeko/premium123/mono.m3u8';

  try {
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        'Referer': 'https://antenacentral.store/',
        'Origin': 'https://antenacentral.store/',
      }
    });

    if (!response.ok) {
      res.status(response.status).send('Failed to fetch stream');
      return;
    }

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    response.body.pipe(res);
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).send('Proxy error');
  }
}
