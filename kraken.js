process.setMaxListeners(0);
require('dotenv').config() // 0 for unlimited or a specific number higher than your current warning level
const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');
const proxyArr = require('./output.json')

function generateUserAgent() {
    const platform = ['Windows NT 10.0', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64'];
    const chromeVersion = ['Chrome/90', 'Chrome/89', 'Chrome/88', 'Chrome/87', 'Chrome/86'];
    const webkitVersion = 'AppleWebKit/537.36';
    const layoutEngine = '(KHTML, like Gecko)';
    const safariVersion = 'Safari/537.36';
    const platformChoice = platform[Math.floor(Math.random() * platform.length)];
    const chromeVersionChoice = chromeVersion[Math.floor(Math.random() * chromeVersion.length)];
    return `Mozilla/5.0 (${platformChoice}; Win64; x64) ${webkitVersion} ${layoutEngine} ${chromeVersionChoice} ${safariVersion}`;
}
let currentIndex = Number(process.env.start_index);
let endIndex = Number(process.env.end_index);
const ReleaseTheKraken = async () => {
    const proxy = proxyArr[currentIndex];
    if (currentIndex >= endIndex) {
        console.log('All proxies have been used.');
        clearInterval(interval);
        return;
    }
    try {
        console.log({ currentIndex, start: process.env.start_index, end: process.env.end_index })
        console.log('annoning proxy')
        const newProxyUrl = await proxyChain.anonymizeProxy(`http://${proxy}`);
        console.log('launching browser')
        const browser = await puppeteer.launch({
            headless: true,
            args: [`--proxy-server=${newProxyUrl}`, '--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: "/usr/bin/google-chrome-stable",  // Adjust this path
            // executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            ignoreHTTPSErrors: true,
        });
        console.log('navigating to page')
        const page = await browser.newPage();
        const userAgent = generateUserAgent()
        console.log('setting user agent...')
        await page.setUserAgent(userAgent); // Using the generated User-Agent here
        console.log('set user agent... going to page ')

        await page.goto(process.env.url, { timeout: 60000 }); // Increasing timeout to 60 seconds
        console.log(`#${currentIndex} BROWSER WATCHING STREAM.... MOVING TO NEXT BROWSER \n\n`);
        currentIndex++;
    } catch (error) {
        console.log(error);
        console.log(`Navigation FAILED with proxy: ${proxy}. Skipping to the next proxy.`);
        currentIndex++;
    }
};

// Function to generate a random number between min and max
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to initiate the next interval
function setRandomInterval(func, minInterval, maxInterval) {
    setTimeout(() => {
        func();
        setRandomInterval(func, minInterval, maxInterval);
    }, getRandomInt(minInterval, maxInterval));
}

// Define the minimum and maximum interval in milliseconds
const minInterval = 5000;  // 5 seconds
const maxInterval = 15000; // 15 seconds

// Set the initial random interval
setRandomInterval(ReleaseTheKraken, minInterval, maxInterval);