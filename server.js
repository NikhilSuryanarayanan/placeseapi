const puppeteer = require('puppeteer');

async function scrapeGoogleSearchResults(query) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        // Navigate to Google
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

        // Wait for the search results to load
        await page.waitForSelector('div.g');

        // Extract search results
        const searchResults = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('div.g').forEach((result) => {
                const titleElement = result.querySelector('h3');
                const linkElement = result.querySelector('a');
                if (titleElement && linkElement) {
                    results.push({
                        title: titleElement.innerText,
                        url: linkElement.href
                    });
                }
            });
            return results;
        });

        return searchResults;
    } catch (error) {
        console.error('Error:', error);
        return [];
    } finally {
        await browser.close();
    }
}

// Example usage
const query = 'web designing companies in Bangalore';
scrapeGoogleSearchResults(query)
    .then((results) => {
        console.log('Search results:', results);
    })
    .catch((error) => {
        console.error('Error:', error);
    });

