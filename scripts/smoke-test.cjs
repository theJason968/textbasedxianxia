const { chromium } = require("playwright");

async function runSmokeTest() {
  console.log("Launching browser");
  const browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_PATH ??
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);

  console.log("Opening app");
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });

  const openingTitle = await page.locator("h1").innerText();
  console.log(`Opening: ${openingTitle}`);
  const startingExamText = await page.locator("dd").nth(11).innerText();

  await page.getByRole("button", { name: "Spend a day refining a crude qi elixir" }).click();

  const prepInventory = await page.locator(".side-panel").innerText();
  const examTextAfterPrep = await page.locator("dd").nth(11).innerText();

  await page
    .getByRole("button", { name: "Leave for the Azure Cloud mountain gate now" })
    .click();

  await page
    .getByRole("button", { name: "Rush ahead before the crowd can react" })
    .click();
  console.log("Clicked reckless path");

  const recklessTitle = await page.locator("h1").innerText();
  const health = await page.locator("dd").nth(1).innerText();
  const spiritualSense = await page.locator("dd").nth(3).innerText();
  const startedQuestText = await page.locator(".quest-list").innerText();

  await page
    .getByRole("button", { name: "Force yourself toward the first trial platform" })
    .click();
  console.log("Reached first platform");

  const hiddenChoiceCount = await page
    .getByRole("button", { name: "Trace the hidden qi current in the carved words" })
    .count();

  await page
    .getByRole("button", { name: "Trace the hidden qi current in the carved words" })
    .click();
  console.log("Clicked hidden qi current");

  const hiddenTitle = await page.locator("h1").innerText();

  await page.getByRole("button", { name: "Place your palm on the tablet" }).click();
  await page
    .getByRole("button", { name: "Accept the tablet's first teaching" })
    .click();
  console.log("Accepted first teaching");

  const teachingTitle = await page.locator("h1").innerText();
  const sidePanel = await page.locator(".side-panel").innerText();

  await page.getByRole("button", { name: "Cultivate" }).click();
  await page.getByRole("button", { name: "Cultivate" }).click();
  console.log("Cultivated twice");

  const breakthroughEnabledBeforeTraining = await page
    .getByRole("button", { name: "Breakthrough" })
    .isEnabled();

  await page
    .getByRole("button", {
      name: "Train the Azure Cloud Breathing Method under the pine",
    })
    .click();

  const trainingTitle = await page.locator("h1").innerText();
  const insightAfterTraining = await page.locator("dd").nth(9).innerText();
  const breakthroughEnabledAfterTraining = await page
    .getByRole("button", { name: "Breakthrough" })
    .isEnabled();

  await page.getByRole("button", { name: "Breakthrough" }).click();
  console.log("Broke through");

  const realmAfterBreakthrough = await page.locator("dd").nth(0).innerText();
  const qiAfterBreakthrough = await page.locator("dd").nth(2).innerText();

  await page
    .getByRole("button", {
      name: "Stand and present your circulation to the elders",
    })
    .click();

  await page
    .getByRole("button", {
      name: "Follow the misty path toward the outer sect courtyard",
    })
    .click();

  const combatEnemy = await page.locator(".combat-panel h2").innerText();

  await page.getByRole("button", { name: "Focus qi into your strike" }).click();
  await page.getByRole("button", { name: "Focus qi into your strike" }).click();
  await page.getByRole("button", { name: "Strike with bare hands" }).click();

  const victoryTitle = await page.locator("h1").innerText();
  const postCombatSidePanel = await page.locator(".side-panel").innerText();

  await page
    .getByRole("button", { name: "Study the spirit core and steady your breath" })
    .click();

  const prepTitle = await page.locator("h1").innerText();
  const prepSidePanel = await page.locator(".side-panel").innerText();
  const spiritStones = await page.locator("dd").nth(10).innerText();
  const completedQuestText = await page.locator(".quest-list").innerText();

  await page.reload({ waitUntil: "domcontentloaded" });

  const reloadedTitle = await page.locator("h1").innerText();
  const reloadedRealm = await page.locator("dd").nth(0).innerText();
  const reloadedQuestText = await page.locator(".quest-list").innerText();
  const saveMessage = await page.locator(".save-message").innerText();

  await browser.close();

  const results = {
    openingTitle,
    startingExamText,
    hasCrudeElixir: prepInventory.includes("Crude Qi Elixir"),
    examTextAfterPrep,
    recklessTitle,
    health,
    spiritualSense,
    questStarted: startedQuestText.includes("Enter the Azure Cloud Sect"),
    hiddenChoiceCount,
    hiddenTitle,
    teachingTitle,
    hasToken: sidePanel.includes("Outer Disciple Token"),
    hasTechnique: sidePanel.includes("Azure Cloud Breathing Method"),
    breakthroughEnabledBeforeTraining,
    trainingTitle,
    insightAfterTraining,
    breakthroughEnabledAfterTraining,
    realmAfterBreakthrough,
    qiAfterBreakthrough,
    combatEnemy,
    victoryTitle,
    hasWolfCore: postCombatSidePanel.includes("Mist Wolf Core"),
    prepTitle,
    prepPreservedInsight: prepSidePanel.includes("Insight"),
    spiritStones,
    questCompleted: completedQuestText.toLowerCase().includes("completed"),
    reloadedTitle,
    reloadedRealm,
    reloadedQuestCompleted: reloadedQuestText.toLowerCase().includes("completed"),
    saveMessage,
  };

  console.log(JSON.stringify(results, null, 2));

  if (
    openingTitle !== "Three Days Before The Exam" ||
    startingExamText !== "3 days" ||
    !results.hasCrudeElixir ||
    examTextAfterPrep !== "2 days"
  ) {
    throw new Error("Pre-exam day system did not initialize or advance correctly.");
  }

  if (recklessTitle !== "A Reckless Ascent" || health !== "25/30") {
    throw new Error("Choice effects did not apply after reckless climb.");
  }

  if (!results.questStarted) {
    throw new Error("Quest did not start after entering the trial.");
  }

  if (spiritualSense !== "2" || hiddenChoiceCount !== 1) {
    throw new Error("Conditional Spiritual Sense choice did not unlock.");
  }

  if (!results.hasToken || !results.hasTechnique) {
    throw new Error("Reward item or technique did not appear.");
  }

  if (
    breakthroughEnabledBeforeTraining ||
    trainingTitle !== "Breath Beneath The Pine" ||
    insightAfterTraining !== "2" ||
    !breakthroughEnabledAfterTraining ||
    realmAfterBreakthrough !== "Mortal Middle" ||
    qiAfterBreakthrough !== "0/25"
  ) {
    throw new Error("Story-based cultivation and minor breakthrough did not work.");
  }

  if (
    combatEnemy !== "Mist Wolf" ||
    victoryTitle !== "First Hunt" ||
    !results.hasWolfCore
  ) {
    throw new Error("Combat encounter did not resolve with expected victory rewards.");
  }

  if (prepTitle !== "Preparing The First Bottleneck" || !results.prepPreservedInsight) {
    throw new Error("Post-combat breakthrough preparation scene did not resolve.");
  }

  if (spiritStones !== "3" || !results.questCompleted) {
    throw new Error("Quest did not complete with expected spirit stone reward.");
  }

  if (
    reloadedTitle !== prepTitle ||
    reloadedRealm !== realmAfterBreakthrough ||
    !results.reloadedQuestCompleted ||
    saveMessage !== "Loaded saved cultivation path."
  ) {
    throw new Error("Save/load did not preserve the current scene after refresh.");
  }
}

runSmokeTest()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
