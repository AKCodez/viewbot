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
    try {
    console.log({currentIndex, start: process.env.start_index, end: process.env.end_index})
    if (currentIndex >= endIndex) {
        console.log('All proxies have been used.');
        clearInterval(interval);
        return;
    }
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
        await page.goto('https://www.twitch.tv/thiccsnorlex', { timeout: 60000 }); // Increasing timeout to 60 seconds
        console.log(`#${currentIndex} BROWSER WATCHING STREAM.... MOVING TO NEXT BROWSER \n\n`);
        currentIndex++;
    } catch (error) {
        console.log(error);
        console.log(`Navigation FAILED with proxy: ${proxy}. Skipping to the next proxy.`);
        currentIndex++;
    }
};

// Launch a new browser every n seconds
const n = 5; // Change this value to your desired time in seconds
const interval = setInterval(ReleaseTheKraken, n * 1000);