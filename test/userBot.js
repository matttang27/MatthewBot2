const puppeteer = require("puppeteer");

class UserBot {
  guildId;
  channelId;
  userId;
  
  constructor() {}

  async findAndClick(selector) {
    await this.page.waitForSelector(selector);
    await new Promise((r) => setTimeout(r, 1000));
    await this.page.click(selector);
    await new Promise((r) => setTimeout(r, 1000));
  }

  async getUserID() {
    await this.findAndClick('[aria-label="Set Status"]');

    let id = await this.page.evaluate(() => {
      let textElement = [...document.querySelectorAll("*")].find((element) =>
        element.textContent == ("Copy User ID")
      );
      if (textElement) {
        return textElement.children[0].id
      }
      return null;
      
      
    });

    if (id) {
      return parseInt(id.match(/\d/g).join(""));
    }
    return null;

    
  }

  async enableDeveloperMode() {
    // Navigate to User Settings
    await this.page.goto("https://discord.com/channels/@me");

    // Click the User Settings button
    await this.findAndClick('[aria-label="User Settings"]');

    await this.findAndClick('[aria-label="Advanced"]');

    // Check if Developer Mode is enabled
    const developerModeSelector = 'input[type="checkbox"]';
    const isDeveloperModeEnabled = await this.page.evaluate((selector) => {
      const checkbox = document.querySelector(selector);
      return checkbox && checkbox.checked;
    }, developerModeSelector);

    // Enable Developer Mode if not enabled
    if (!isDeveloperModeEnabled) {
      await this.page.click(developerModeSelector);
    }
    await new Promise((r) => setTimeout(r, 1000));

    await this.findAndClick('[aria-label="Close"]');

  }

  async login(username, password) {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
    const context = this.browser.defaultBrowserContext();
    await context.overridePermissions("https://discord.com", [
      "clipboard-read",
    ]);

    await this.page.goto("https://discord.com/login");
    // Wait for the email input to be visible
    await this.page.waitForSelector('input[name="email"]');

    // Type in the email
    await this.page.type('input[name="email"]', username); // replace with your email

    // Type in the password
    await this.page.type('input[name="password"]', password); // replace with your password

    // Click the login button
    await this.page.click('button[type="submit"]');

    await this.page.waitForFunction(
      'window.location.href === "https://discord.com/channels/@me"',
      { timeout: 0 } // Set timeout to 0 to wait indefinitely
    );

    let userId = await this.getUserID();
    if (!userId) {
      await this.enableDeveloperMode();
      userId = await this.getUserID();
    }

    this.userId = userId;

    await new Promise((r) => setTimeout(r, 1000));

    
    console.log("userBot login:", userId);
  }

  //sends a message
  async sendMessage(content, guildId=this.guildId, channelId=this.channelId) {
    console.log(guildId, channelId);
    if (this.page.url() != `https://discord.com/channels/${guildId}/${channelId}`) {
      await this.page.goto(`https://discord.com/channels/${guildId}/${channelId}`);
    }

    // Wait for the message input area to load
    await this.page.waitForSelector('div[role="textbox"]');

    await this.page.type('div[role="textbox"]', content);
    await this.page.keyboard.press("Enter");
  }

  async sendCommand(commandName, botName, guildId=this.guildId, channelId=this.channelId) {
    console.log(guildId, channelId);
    if (this.page.url() != `https://discord.com/channels/${guildId}/${channelId}`) {
      await this.page.goto(`https://discord.com/channels/${guildId}/${channelId}`);
    }

    // Wait for the message input area to load
    await this.page.waitForSelector('div[role="textbox"]');

    await this.page.type('div[role="textbox"]', "/" + commandName);
    await new Promise((r) => setTimeout(r, 1000));

    while (true) {
      let currentBotName = await this.page.evaluate(() => {
        return document.querySelector('div[aria-selected=true]').children[0].children[0].children[2].textContent;
      });

      if (currentBotName == botName) {
        break;
      } else {
        await this.page.keyboard.press("ArrowDown");
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    await this.page.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1000));
    await this.page.keyboard.press("Enter");

  }

  async clickButton(buttonName, message ,guildId=this.guildId, channelId=this.channelId) {
    //find what "row" the button is on (embeds count as rows too)


    await new Promise((r) => setTimeout(r, 1000));
    console.log(guildId, channelId);
    if (this.page.url() != `https://discord.com/channels/${guildId}/${channelId}`) {
      await this.page.goto(`https://discord.com/channels/${guildId}/${channelId}`);
    }
    
    await this.page.waitForSelector(`[id="message-accessories-${message.id}"]`)

    let button = await this.page.evaluateHandle((message,buttonName) => {
      let accs = document.getElementById(`message-accessories-${message.id}`)
      for (var i=0;i<accs.children.length; i++) {
        if (accs.children[i].className.startsWith("container")) {
          let buttons = document.getElementById(`message-accessories-${message.id}`).children[i].children[0].children[0];
          let found = Array.from(buttons.children).find(button => button.textContent == buttonName);
          if (found) {return found}
        }
        

      }
      return undefined
    }, message, buttonName);

    if (! button) {
      console.error("Button not found");
      return;
    }

    await button.click()

  }
}

module.exports = UserBot;
