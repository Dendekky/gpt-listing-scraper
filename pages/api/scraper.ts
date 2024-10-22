// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from "axios";
const { load } = require('cheerio');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const result = await scrapeWebsite(process.env.SCRAPER_URL || '');

  console.log('result', result);

  res.status(200).json({result });
}

async function scrapeWebsite(url: string) {
  try {
    // Fetch the HTML content of the webpage
    const { data } = await axios.get(url);

    // Load the HTML into cheerio
    const $ = load(data);

    // Extract data (example: extract all the titles from a webpage)
    const links: { text?: string, href?: string, img?: string }[] = [];
    $('a').each((index, element) => {
      const text = $(element).text();
      const href = $(element).attr('href') || '';
      const img = $(element).find('img').attr('src') || '';
      links.push({ text, href, img });
    });

    // Output the extracted data
    console.log(links);
    return links;
  } catch (error) {
    console.error('Error fetching the webpage:', error);
  }
}
