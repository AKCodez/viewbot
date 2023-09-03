process.setMaxListeners(0);
require('dotenv').config() // 0 for unlimited or a specific number higher than your current warning level
const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');
const proxyArr = require('./output.json')
function generateRandomText(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}
function generateRandomTimeout() {
    // Generates a random number between 1 and 8 (inclusive) and multiplies it by 1000 to convert it to milliseconds
    return Math.floor(Math.random() * 8 + 1) * 1000;
}
 
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
let count = 0
let currentIndex = Number(process.env.start_index);
let endIndex = Number(process.env.end_index);
const ReleaseTheKraken = async () => {
    console.log({currentIndex})
    if (currentIndex >= endIndex) {
        console.log('All proxies have been used.');
        clearInterval(interval);
        return;
    }
    const proxy = proxyArr[currentIndex];
    const newProxyUrl = await proxyChain.anonymizeProxy(`http://${proxy}`);
    const browser = await puppeteer.launch({
        headless: "new",
        args: [`--proxy-server=${newProxyUrl}`, '--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: "/usr/bin/google-chrome-stable",  // Adjust this path
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    const userAgent = generateUserAgent()
    await page.setUserAgent(userAgent); // Using the generated User-Agent here
    try {
        await page.goto('https://www.twitch.tv/thiccsnorlex', { timeout: 60000 }); // Increasing timeout to 60 seconds
        // const randomTimeout = generateRandomTimeout();
        // console.log(`Random timeout generated: ${randomTimeout} milliseconds`); // Output will be a random number between 1000 and 8000
        // const timeout = setTimeout(async () => {
        //     const element = await page.$('input[type="search"]');
        //     if (element) {
        //         const boundingBox = await element.boundingBox();
        //         const x = boundingBox.x + boundingBox.width / 2;
        //         const y = boundingBox.y + boundingBox.height / 2;
        //         await page.mouse.move(x, y);
        //         await page.mouse.click(x, y);
        //     }
        //     const randomText = generateRandomText(8);
        //     await element.type(randomText); // Replace with your CSS selector and text
        // clearTimeout(timeout)
        // },randomTimeout)
        console.log(`#${count} BROWSER WATCHING STREAM.... MOVING TO NEXT BROWSER \n\n`);
    } catch (error) {
        console.error(error);
        count--
        console.log(`Navigation FAILED with proxy: ${proxy}. Skipping to the next proxy. reducing count to ${count}`);
    }
    currentIndex++;
    count++
};

// Launch a new browser every n seconds
const n = 5; // Change this value to your desired time in seconds
const interval = setInterval(ReleaseTheKraken, n * 1000);