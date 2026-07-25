import fs from 'fs';
import path from 'path';

const BASE_DIR = './data/diaries';
const OUTPUT_XML = './rss.xml';
const SITE_URL = 'https://raiku.example.com'; // 必要に応じて変更

function generateRSS() {
  if (!fs.existsSync(BASE_DIR)) {
    console.log('No diaries directory found.');
    return;
  }

  let items = [];
  const years = fs.readdirSync(BASE_DIR);

  for (const year of years) {
    const yearPath = path.join(BASE_DIR, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;

    const months = fs.readdirSync(yearPath);
    for (const monthFile of months) {
      if (!monthFile.endsWith('.json')) continue;
      const monthPath = path.join(yearPath, monthFile);
      
      try {
        const monthData = JSON.parse(fs.readFileSync(monthPath, 'utf8'));
        // monthData is assumed to be an array or object mapping date strings to content
        if (Array.isArray(monthData)) {
          for (const entry of monthData) {
            if (entry.date && entry.content) {
              items.push({
                date: entry.date,
                title: `${entry.date} の日誌`,
                content: entry.content,
                link: `${SITE_URL}/#${entry.date}`
              });
            }
          }
        } else if (typeof monthData === 'object' && monthData !== null) {
          // If stored as { "2026-10-25": "content", ... }
          for (const [date, content] of Object.entries(monthData)) {
            items.push({
              date: date,
              title: `${date} の日誌`,
              content: content,
              link: `${SITE_URL}/#${date}`
            });
          }
        }
      } catch (e) {
        // skip invalid json
      }
    }
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Take top 50 latest entries for RSS
  const latestItems = items.slice(0, 50);

  const rssItemsXml = latestItems.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid>${item.link}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description><![CDATA[${item.content.substring(0, 150)}...]]></description>
    </item>
  `).join('');

  const rssRss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>来Q — 日誌</title>
  <link>${SITE_URL}</link>
  <description>2016年から続く、日々の記録。</description>
  <language>ja</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${rssItemsXml}
</channel>
</rss>`;

  fs.writeFileSync(OUTPUT_XML, rssRss, 'utf8');
  console.log(`Generated ${OUTPUT_XML} with ${latestItems.length} items.`);
}

generateRSS();
