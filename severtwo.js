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
                const snippetElement = result.querySelector('div.s');
                if (titleElement && linkElement && snippetElement) {
                    const title = titleElement.innerText;
                    const url = linkElement.href;
                    const snippet = snippetElement.innerText;
                    const phoneRegex = /(?:\+?\d{1,3}[-\.\s]?)?\(?\d{3}\)?[-\.\s]?\d{3}[-\.\s]?\d{4}/g; // Phone number regex
                    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g; // Email regex
                    const phones = snippet.match(phoneRegex) || [];
                    const emails = snippet.match(emailRegex) || [];
                    results.push({ title, url, phones, emails });
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

