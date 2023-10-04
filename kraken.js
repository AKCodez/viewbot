process.setMaxListeners(0);
require('dotenv').config() // 0 for unlimited or a specific number higher than your current warning level
const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');
const proxyArr = require('./output.json')
const rokuAgents = [];
const appleTvAgents = [];
const samsungTvAgents = [];
// Generate 100 Apple TV user agent strings with variations
for (let osVersion = 12; osVersion <= 13; osVersion++) {
    for (let subVersion = 0; subVersion < 50; subVersion++) {
        const build = Math.floor(Math.random() * 99999) + 10000;
        appleTvAgents.push(`AppleCoreMedia/1.0.0.${build} (Apple TV; U; CPU OS ${osVersion}_${subVersion} like Mac OS X; en_us)`);
    }
}
// Generate 100 Samsung TV user agent strings with variations
for (let tizenVersion = 4; tizenVersion <= 5; tizenVersion++) {
    for (let subVersion = 0; subVersion < 50; subVersion++) {
        const build = Math.floor(Math.random() * 99999) + 10000;
        samsungTvAgents.push(`Mozilla/5.0 (SMART-TV; LINUX; Tizen ${tizenVersion}.${subVersion}) AppleWebkit/537.36 (KHTML, like Gecko) Build/${build}`);
    }
}
// Generate 100 Roku user agent strings with variations
for (let model = 4640; model < 4660; model++) {
    for (let version = 7.0; version < 7.5; version += 0.1) {
        const roundedVersion = version.toFixed(1);
        const build = Math.floor(Math.random() * 99999) + 10000;
        rokuAgents.push(`Roku${model}X/DVP-${roundedVersion} (${build}.70E04154A)`);
    }
}
function generateUserAgent() {
    const platformTypes = [
        // 'desktop',
        // 'roku',
        //  'appleTV',
          'samsungTV'
        ];
    const platformChoiceType = platformTypes[Math.floor(Math.random() * platformTypes.length)];
    if (platformChoiceType === 'desktop') {
        // Existing logic for desktop user agents
        const platform = ['Windows NT 10.0', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64'];
        const chromeVersion = ['Chrome/90', 'Chrome/89', 'Chrome/88', 'Chrome/87', 'Chrome/86'];
        const webkitVersion = 'AppleWebKit/537.36';
        const layoutEngine = '(KHTML, like Gecko)';
        const safariVersion = 'Safari/537.36';
        const platformChoice = platform[Math.floor(Math.random() * platform.length)];
        const chromeVersionChoice = chromeVersion[Math.floor(Math.random() * chromeVersion.length)];
        return `Mozilla/5.0 (${platformChoice}; Win64; x64) ${webkitVersion} ${layoutEngine} ${chromeVersionChoice} ${safariVersion}`;
    } else if (platformChoiceType === 'roku') {
        return rokuAgents[Math.floor(Math.random() * rokuAgents.length)];
    } else if (platformChoiceType === 'appleTV') {
        return appleTvAgents[Math.floor(Math.random() * appleTvAgents.length)];
    } else if (platformChoiceType === 'samsungTV') {
        return samsungTvAgents[Math.floor(Math.random() * samsungTvAgents.length)];
    }
}

let currentIndex = Number(process.env.start_index);
let endIndex = Number(process.env.end_index);
const ReleaseTheKraken = async () => {
    const proxy = proxyArr[currentIndex];
    if (currentIndex >= endIndex) {
        console.log('All proxies have been used.');
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
        const userAgent = generateUserAgent();
        console.log('setting user agent to ...', userAgent)
        await page.setUserAgent(userAgent); // Using the generated User-Agent here
        console.log('set user agent... going to page ')
        await page.goto(process.env.url, { timeout: 60000 }); // Increasing timeout to 60 seconds
        console.log(`#${currentIndex} BROWSER WATCHING STREAM.... MOVING TO NEXT BROWSER \n\n`);
        // Wait for the "close-button" to appear and click it
        const closeButton = await page.waitForSelector('button.close-button[aria-label="Close"]', { timeout: 10000 });
        if (closeButton) {
            await closeButton.click();
        }
        currentIndex++;
        setTimeout(async () => {
            console.log(`Closing browser #${currentIndex} after 15 minutes.`);
            await browser.close();
        }, 900000);  // 15 minutes in milliseconds
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