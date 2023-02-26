const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const { Client, MessageMedia } = require('whatsapp-web.js');
const client = new Client();

const phoneNumber = process.env.YOUR_PHONE_NUMBER;

// I'm using an alternative website so i don't have to login on Instagram
const instagramURL = 'https://imginn.org';
const instagramProfile = 'foni.monki';

const instagramProfileURL = `${instagramURL}/${instagramProfile}/`;

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  const number_details = await client.getNumberId(phoneNumber); // get mobile number details

  if (number_details) {
    const imagesFromInsta = await getImagesInstagram();

    const mediasFromInsta = Promise.all(
      imagesFromInsta.map((img) => MessageMedia.fromUrl(img, { unsafeMime: true })),
    );

    // For my experience when you try to send more than 50 at a time you get an error
    // You can try with different amounts
    (await mediasFromInsta).slice(101, 150).forEach(async (media, index) => {
      await client.sendMessage(number_details._serialized, media, { sendMediaAsSticker: true }); // send message

      console.log(`Sent sticker ${index + 1}`);
    });
  } else {
    console.log(final_number, 'Mobile number is not registered');
  }
});

client.initialize();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 2000);
    });
  });
}

const getImagesInstagram = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(instagramProfileURL, {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForTimeout(5000);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  await autoScroll(page);

  await page.screenshot({ path: 'screenshot.png', fullPage: true });

  console.log('Screenshot saved');

  const srcImagesArray = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.item .img img'), (e) => e.src),
  );

  console.log({ srcImagesArray });

  await browser.close();

  return srcImagesArray;
};
