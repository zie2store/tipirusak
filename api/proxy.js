const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Make the request to the IPTV stream with the correct headers
    const response = await axios.get('https://zekonew.newkso.ru/zeko/premium379/mono.m3u8', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        'Referer': 'https://cookiewebplay.xyz/',
        'Origin': 'https://cookiewebplay.xyz',
      },
      responseType: 'stream',
    });

    // Forward the stream to the client
    res.setHeader('Content-Type', 'application/x-mpegURL');
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
};
