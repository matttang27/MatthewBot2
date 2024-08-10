require("module-alias-jest/register");
const fs = require('fs');
const puppeteer = require("puppeteer");
(async () => {
    try {
        let userBots = require("@config/userBots.json");

        for (var i=0;i<userBots.bots.length;i++) {
            const browser = await puppeteer.launch({headless: false});
            userBots.bots[i]["endpoint"] = browser.wsEndpoint();
            console.log(`${userBots.bots[i].username}: ${userBots.bots[i]["endpoint"]}`);
        }

        fs.writeFile(require.resolve('@config/userBots.json'), JSON.stringify(userBots, null, 2), 'utf8', (err) => {
            if (err) {console.error(err)}
            else {console.log("All browsers have been opened and userBots.json has been updated.")}
        });
    } catch (err) {
        console.error(err)
    }
})();