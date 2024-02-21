const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/scrape', async (req, res) => {
    const query = req.body.query;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const businessListings = await scrapeBusinessListings(query);
        const filename = `${query}.json`;
        await writeToFile(businessListings, filename);
        res.download(filename);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function scrapeBusinessListings(query) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        await page.goto(url);

        await page.waitForSelector('.business-listing');

        const businessListings = await page.evaluate(() => {
            const listings = [];
            document.querySelectorAll('.business-listing').forEach(listing => {
                const name = listing.querySelector('.name').innerText;
                const address = listing.querySelector('.address').innerText;
                const phone = listing.querySelector('.phone').innerText;
                const website = listing.querySelector('.website').href;
                listings.push({ name, address, phone, website });
            });
            return listings;
        });

        return businessListings;
    } catch (error) {
        throw new Error('Failed to scrape business listings');
    } finally {
        await browser.close();
    }
}

async function writeToFile(data, filename) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

