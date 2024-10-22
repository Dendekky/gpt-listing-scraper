// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
const { load } = require('cheerio');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const result = await scrapeItems();

  res.status(200).json({ result });
}
async function scrapeCollection() {
  const hrefs: string[] = [];
  const collectionUrl = `${process.env.BASE_URL}/${process.env.COLLECTION_PATH}/${process.env.QUERY_COLLECTION}`;
  try {
    const { data: collectionData } = await axios.get(collectionUrl);
    let $ = load(collectionData);
    const targetContent = $('div.row-content.row');
    // Find all img elements within targetContent
    targetContent.find('a:has(img)').each((index, element) => {
      const href = $(element).attr('href');
      if (href) {
        hrefs.push(href);
      }
    });
  } catch (error: any) {
    console.error('Error fetching the webpage:', error?.code);
  }
  return hrefs;
}

async function scrapeItems() {
  const imgHrefs = await scrapeCollection();
  const imgUrls: string[] = [];

  for (const href of imgHrefs) {
    const indexedUrl = `${process.env.BASE_URL}${href}`;
    try {
      // Fetch the HTML content of the webpage
      const { data } = await axios.get(indexedUrl);
      // Load the HTML into cheerio
      const $ = load(data);
      const targetContent = $('.picture-full-container');
      // Find all img elements within targetContent
      targetContent.find('img').each((index, element) => {
        const imgUrl = $(element).attr('src');
        if (imgUrl) {
          imgUrls.push(`${process.env.BASE_URL}${imgUrl}`);
        }
      });
    } catch (error: any) {
      console.error('Error fetching the webpage:', error?.code);
    }
  }
  const imagesDir = path.resolve(
    __dirname,
    `../../../data/${process.env.QUERY_COLLECTION}`
  );
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  // Download and save images
  const downloadPromises = imgUrls.map((url, index) => {
    const filepath = path.resolve(imagesDir, `image${index + 1}.jpg`);
    console.log(`Downloading image ${index + 1}...,`, filepath);
    return downloadImage(url, filepath);
  });

  await Promise.all(downloadPromises);

  return imgUrls;
}

async function downloadImage(url: string, filepath: string) {
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
