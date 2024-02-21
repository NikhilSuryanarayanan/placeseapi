const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Route for scraping Google search results
app.post('/scrape', async (req, res) => {
    const query = req.body.query;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const searchResults = await scrapeGoogleSearchResults(query);
        const filename = `search_results_${Date.now()}.xlsx`;
        await writeToFile(searchResults, filename);
        res.json({ filename });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to scrape Google search results
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
        throw new Error('Failed to scrape Google search results');
    } finally {
        await browser.close();
    }
}

// Function to write search results to an Excel file
async function writeToFile(searchResults, filename) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Search Results');

    // Add headers
    sheet.addRow(['Title', 'URL']);

    // Add data rows
    searchResults.forEach(result => {
        sheet.addRow([result.title, result.url]);
    });

    // Write to file
    await workbook.xlsx.writeFile(filename);
    console.log(`Search results written to ${filename}`);
}

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
