import puppeteer from 'puppeteer';

const MAX_PAGES = 3;

export async function scrapeWebsite(startUrl: string): Promise<string> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const visited = new Set<string>();
    const toVisit = [startUrl];
    const baseDomain = new URL(startUrl).hostname;
    const collectedText: string[] = [];

    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );

    try {
        while (toVisit.length > 0 && visited.size < MAX_PAGES) {
            const currentUrl = toVisit.shift();
            if (!currentUrl || visited.has(currentUrl)) continue;

            try {
                await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });

                const text = await page.$eval('body', el => el.innerText || '');
                if (text && text.length > 100) {
                    collectedText.push(`URL: ${currentUrl}\n\n${text}`);
                }

                visited.add(currentUrl);

                const links = await page.$$eval('a[href]', anchors =>
                    anchors
                        .map(a => a.getAttribute('href'))
                        .filter(href => href && !href.startsWith('javascript:'))
                        .map(href => new URL(href!, window.location.href).href)
                );

                for (const link of links) {
                    try {
                        const parsed = new URL(link);
                        if (
                            parsed.hostname === baseDomain &&
                            !visited.has(parsed.href) &&
                            !toVisit.includes(parsed.href)
                        ) {
                            toVisit.push(parsed.href);
                        }
                    } catch {
                        // skip bad URLs
                    }
                }

            } catch (err: any) {
                console.warn(`Failed to scrape ${currentUrl}: ${err.message}`);
            }
        }

        return collectedText.join('\n\n----- PAGE BREAK -----\n\n');
    } finally {
        await page.close();
        await browser.close();
    }
}
