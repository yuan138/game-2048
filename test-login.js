const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    page.on('pageerror', err => errors.push(err.message));

    // 测试登录页面
    await page.goto('http://localhost:3001/login.html');
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log('Page title:', title);

    // 检查关键元素
    const loginForm = await page.$('#login-form');
    const registerForm = await page.$('#register-form');
    const logo = await page.$('.logo h1');

    console.log('Login form exists:', !!loginForm);
    console.log('Register form exists:', !!registerForm);
    console.log('Logo exists:', !!logo);

    if (errors.length > 0) {
        console.log('Errors found:', errors);
    } else {
        console.log('No errors detected');
    }

    await browser.close();
    process.exit(errors.length > 0 ? 1 : 0);
})();
