// pages/api/proxy-image.js
import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'];

    // Set proper headers to allow cross-origin access
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin to access

    return res.send(response.data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
}
