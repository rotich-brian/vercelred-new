// pages/api/proxy-image.js
import axios from 'axios';
import sharp from 'sharp';

export default async function handler(req, res) {
  const { url, quality = 70 } = req.query; // Default quality to 70 if not provided

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Fetch the image from the provided URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    // Process the image (convert to WebP format with specified quality)
    const processedImage = await sharp(response.data)
      .webp({ quality: parseInt(quality) }) // Compress to WebP format with the specified quality
      .toBuffer();

    // Set proper headers for the response
    res.setHeader('Content-Type', 'image/webp'); // Serve as WebP
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin resource access
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin to access

    // Return the processed image
    return res.send(processedImage);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch and compress image' });
  }
}
