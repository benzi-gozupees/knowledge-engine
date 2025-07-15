import puppeteer from 'puppeteer';
import type { Page } from 'puppeteer';
import * as cheerio from 'cheerio';

const MAX_PAGES = 15;
const MIN_TEXT_LENGTH = 10;

async function safeGoto(page: Page, url: string, attempts = 2): Promise<void> {

    for (let i = 0; i < attempts; i++) {
        try {
            await page.goto(url, { timeout: 120000 });
            await page.waitForSelector('body', { timeout: 60000 });
            return;
        } catch (e) {
            console.warn(`⚠️ Retry ${i + 1} failed for ${url}`);
            if (i === attempts - 1) throw e;
        }
    }
}

export async function scrapeWebsite(startUrl: string): Promise<string> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
    });

    const visited = new Set<string>();
    const toVisit = [startUrl];
    const baseDomain = new URL(startUrl).hostname;
    const collectedText: string[] = [];

    try {
        while (toVisit.length > 0 && visited.size < MAX_PAGES) {
            const currentUrl = toVisit.shift();
            if (!currentUrl || visited.has(currentUrl)) continue;
            visited.add(currentUrl);

            try {
                console.log(`🔍 Scraping: ${currentUrl}`);
                await safeGoto(page, currentUrl);

                const html = await page.content();
                const $ = cheerio.load(html);

                // Remove non-essential elements
                $('script, style, nav, footer, header, .menu, .navigation, .sidebar').remove();

                const bodyText = $('body').text();
                const altTexts = $('[alt]').map((_, el) => $(el).attr('alt')).get();
                const titleAttrs = $('[title]').map((_, el) => $(el).attr('title')).get();
                const ariaLabels = $('[aria-label]').map((_, el) => $(el).attr('aria-label')).get();

                const fullText = [bodyText, ...altTexts, ...titleAttrs, ...ariaLabels]
                    .join('\n')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (fullText && fullText.length >= MIN_TEXT_LENGTH) {
                    collectedText.push(fullText);
                }

                // Collect internal links
                const links = await page.$$eval('a[href]', anchors =>
                    anchors.map(a => (a as HTMLAnchorElement).href)
                );

                const priorityPatterns = [
                    /\/(home|index)$/i,
                    /\/about/i,
                    /\/contact/i,
                    /\/services/i,
                    /\/products/i,
                    /\/solutions/i,
                    /\/team/i,
                    /\/company/i,
                    /\/info/i
                ];

                const excludePatterns = [
                    /\/blog/i, /\/news/i, /\/press/i, /\/media/i, /\/events/i,
                    /\/careers/i, /\/jobs/i, /\/privacy/i, /\/terms/i,
                    /\/legal/i, /\/cookie/i, /\/search/i, /\/login/i,
                    /\/register/i, /\/cart/i, /\/checkout/i
                ];

                const priorityLinks: string[] = [];
                const regularLinks: string[] = [];

                for (const link of links) {
                    try {
                        const parsed = new URL(link);
                        if (
                            parsed.hostname === baseDomain &&
                            !visited.has(parsed.href) &&
                            !toVisit.includes(parsed.href) &&
                            !link.includes('#') &&
                            !link.match(/\.(pdf|jpg|png|gif|zip|doc|docx)$/i) &&
                            !excludePatterns.some(pattern => pattern.test(link))
                        ) {
                            if (priorityPatterns.some(pattern => pattern.test(link))) {
                                priorityLinks.push(link);
                            } else {
                                regularLinks.push(link);
                            }
                        }
                    } catch {
                        // Invalid URL; skip
                    }
                }

                toVisit.push(...priorityLinks, ...regularLinks);
                await new Promise(res => setTimeout(res, 1000)); // rate limit

            } catch (err: any) {
                console.warn(`❌ Failed to scrape ${currentUrl}: ${err.message}`);
            }
        }

        console.log(`\n✅ Total pages scraped: ${visited.size}`);
        return collectedText.join('\n\n----- PAGE BREAK -----\n\n');
    } finally {
        await page.close();
        await browser.close();
    }
}
