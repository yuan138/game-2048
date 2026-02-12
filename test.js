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

    await page.goto('file:///workspace/2048-game/index.html');
    await page.waitForTimeout(1000);

    // 测试初始状态
    const title = await page.title();
    console.log('Page title:', title);

    const tiles = await page.$$('.tile');
    console.log('Initial tiles:', tiles.length);

    // 测试键盘移动
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const tilesAfterMove = await page.$$('.tile');
    console.log('Tiles after move:', tilesAfterMove.length);

    // 检查方块位置是否正确
    if (tilesAfterMove.length > 0) {
        const firstTile = tilesAfterMove[0];
        const transform = await firstTile.evaluate(el => el.style.transform);
        console.log('First tile transform:', transform);
    }

    if (errors.length > 0) {
        console.log('Errors found:', errors);
    } else {
        console.log('No errors detected');
    }

    await browser.close();
    process.exit(errors.length > 0 ? 1 : 0);
})();
