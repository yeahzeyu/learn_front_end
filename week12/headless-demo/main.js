<<<<<<< HEAD
const pupeteer = require('puppeteer');
=======
const puppeteer = require('puppeteer');
>>>>>>> f07df0877b41b0d2e96d776344f6fa6b1ef926b0

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/main.html');
    const imgs = await page.$$('a');
<<<<<<< HEAD
    console.log(img);
})
=======
    console.log(img)
})();
>>>>>>> f07df0877b41b0d2e96d776344f6fa6b1ef926b0
