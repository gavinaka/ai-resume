"use strict";

const fs = require("fs");
const path = require("path");

const playwrightPath = process.env.PLAYWRIGHT_PATH || "playwright";
const { chromium } = require(playwrightPath);

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:4175";
const outputDir = path.resolve(process.env.QA_OUTPUT_DIR || "archive/qa-industrial-v3-2026-07-13/final");
fs.mkdirSync(outputDir, { recursive: true });

const results = [];
const failures = [];

function record(name, passed, details) {
  const result = { name, passed, details };
  results.push(result);
  if (!passed) failures.push(result);
}

function safeName(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function inspectPage(page, label) {
  const report = await page.evaluate(() => {
    const external = performance.getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => {
        try {
          return new URL(url).origin !== location.origin;
        } catch (_error) {
          return true;
        }
      });

    const overflowing = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (style.overflowX === "auto" || style.overflowX === "scroll") return false;
        return element.scrollWidth > element.clientWidth + 2 && element.clientWidth > 20;
      })
      .slice(0, 12)
      .map((element) => ({
        tag: element.tagName,
        className: String(element.className || "").slice(0, 80),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth
      }));

    return {
      title: document.title,
      lang: document.documentElement.lang,
      bodyOverflow: document.documentElement.scrollWidth - innerWidth,
      external,
      overflowing,
      fonts: document.fonts.status,
      activeElement: document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName)
    };
  });

  record(`${label}: no horizontal page overflow`, report.bodyOverflow <= 2, report.bodyOverflow);
  record(`${label}: no external runtime requests`, report.external.length === 0, report.external);
  record(`${label}: fonts loaded`, report.fonts === "loaded", report.fonts);
  record(`${label}: Chinese document language`, report.lang === "zh-CN", report.lang);
  return report;
}

async function screenshot(page, name, options = {}) {
  await page.screenshot({
    path: path.join(outputDir, `${safeName(name)}.png`),
    fullPage: options.fullPage !== false,
    animations: "disabled"
  });
}

async function openTrackedPage(context, route, label) {
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  record(`${label}: HTTP 200`, Boolean(response) && response.status() === 200, response && response.status());
  record(`${label}: no page errors`, pageErrors.length === 0, pageErrors);
  record(`${label}: no console errors`, consoleErrors.length === 0, consoleErrors);
  return { page, pageErrors, consoleErrors };
}

async function auditHome(browser, viewport, label) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const tracked = await openTrackedPage(context, "/", `${label} home`);
  const page = tracked.page;
  await page.locator("#heroTitle").waitFor();
  await inspectPage(page, `${label} home`);

  const hero = await page.locator(".hero-image img").evaluate((image) => ({
    currentSrc: image.currentSrc,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight
  }));
  const expectsMobileImage = viewport.width <= 640;
  record(
    `${label} home: responsive portrait source`,
    expectsMobileImage ? hero.currentSrc.includes("-960.jpg") : hero.currentSrc.endsWith("/akagavin-editorial.jpg"),
    hero
  );
  await screenshot(page, `${label}-home-hero`, { fullPage: false });

  await page.locator(".enter-control").click();
  await page.waitForTimeout(900);
  const manifestoComposition = await page.evaluate(() => {
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const section = document.querySelector("#manifesto").getBoundingClientRect();
    const heading = document.querySelector("#manifesto h2").getBoundingClientRect();
    const portrait = document.querySelector(".manifesto-portrait").getBoundingClientRect();
    const principles = document.querySelector("#principleReel");
    const capabilities = document.querySelector("#capabilityClusters");
    return {
      headerBottom: header.bottom,
      sectionTop: section.top,
      headingTop: heading.top,
      headingBottom: heading.bottom,
      portraitWidth: portrait.width,
      portraitHeight: portrait.height,
      portraitRatio: portrait.height / portrait.width,
      principlesScrollable: principles.scrollWidth > principles.clientWidth + 8,
      capabilitiesScrollable: capabilities.scrollWidth > capabilities.clientWidth + 8,
      systemsHeight: document.querySelector("#systems").getBoundingClientRect().height,
      capabilityHeight: document.querySelector(".capability-sequence").getBoundingClientRect().height
    };
  });
  record(
    `${label} home: scene cut has no previous-scene residue`,
    Math.abs(manifestoComposition.sectionTop) <= 2,
    manifestoComposition
  );
  record(
    `${label} home: second-scene thesis clears fixed header`,
    manifestoComposition.headingTop >= manifestoComposition.headerBottom + 12 && manifestoComposition.headingBottom <= viewport.height,
    manifestoComposition
  );
  record(
    `${label} home: portrait keeps editorial frame`,
    viewport.width > 820 || (
      manifestoComposition.portraitRatio >= 1.2 &&
      manifestoComposition.portraitRatio <= 1.3 &&
      manifestoComposition.portraitHeight <= Math.min(viewport.height * 0.64, 520) + 4
    ),
    manifestoComposition
  );
  record(
    `${label} home: mobile dense sections use horizontal reels`,
    viewport.width > 820 || (manifestoComposition.principlesScrollable && manifestoComposition.capabilitiesScrollable),
    manifestoComposition
  );
  record(
    `${label} home: mobile section heights remain editorially bounded`,
    viewport.width > 820 || (manifestoComposition.systemsHeight <= 1200 && manifestoComposition.capabilityHeight <= 1600),
    manifestoComposition
  );
  await screenshot(page, `${label}-home-manifesto`, { fullPage: false });

  const navigationTargets = ["systems", "proof", "contact", "identity", "proof"];
  await page.evaluate((targets) => {
    targets.forEach((target) => document.querySelector(`[data-target="${target}"]`).click());
  }, navigationTargets);
  await page.waitForTimeout(900);
  const hash = await page.evaluate(() => location.hash);
  record(`${label} home: rapid navigation keeps latest intent`, hash === "#proof", hash);

  const chapterState = await page.locator(".scene-rail [data-target=proof]").getAttribute("aria-current");
  record(`${label} home: active chapter announced`, chapterState === "page", chapterState);

  const navigationComposition = await page.evaluate(() => {
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const proof = document.querySelector("#proof").getBoundingClientRect();
    const count = document.querySelector(".proof-count").getBoundingClientRect();
    const rail = document.querySelector(".scene-rail");
    const railRect = rail.getBoundingClientRect();
    return {
      headerBottom: header.bottom,
      proofTop: proof.top,
      countRight: count.right,
      railLeft: railRect.left,
      railHidden: rail.classList.contains("rail-hidden")
    };
  });
  record(
    `${label} home: chapter target aligns without scene bleed`,
    Math.abs(navigationComposition.proofTop) <= 2,
    navigationComposition
  );
  record(
    `${label} home: desktop proof count clears chapter rail`,
    viewport.width <= 1180 || navigationComposition.countRight <= navigationComposition.railLeft - 8,
    navigationComposition
  );
  record(
    `${label} home: mobile chapter rail yields to reading`,
    viewport.width > 1180 || navigationComposition.railHidden,
    navigationComposition
  );

  await page.locator("#proof").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const rows = await page.locator(".project-row").count();
  const rowLines = await page.locator(".project-row").evaluateAll((elements) => elements.map((element) => element.innerText.trim()));
  record(`${label} home: all public dossiers rendered`, rows === 11, rows);
  record(`${label} home: dossier rows are unique`, new Set(rowLines).size === rowLines.length, rowLines.length);
  await screenshot(page, `${label}-home-proof`, { fullPage: false });

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await screenshot(page, `${label}-home-closing`, { fullPage: false });
  await context.close();
}

async function auditProject(browser, viewport, label) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const tracked = await openTrackedPage(context, "/pages/project.html?id=technical-expert", `${label} project`);
  const page = tracked.page;
  await page.locator("#protocol").waitFor();
  await inspectPage(page, `${label} project`);

  const structure = await page.evaluate(() => ({
    navItems: document.querySelectorAll(".dossier-rail a").length,
    protocolBlocks: document.querySelectorAll(".protocol-block").length,
    protocolItems: document.querySelectorAll(".protocol-block li").length,
    evidenceRecords: document.querySelectorAll("#records .evidence-record").length,
    title: document.querySelector("h1") && document.querySelector("h1").textContent.trim()
  }));
  record(`${label} project: six-part evidence architecture`, structure.navItems === 6, structure);
  record(`${label} project: four protocol dimensions`, structure.protocolBlocks === 4, structure);
  record(`${label} project: protocol is operationally granular`, structure.protocolItems >= 13, structure.protocolItems);

  await screenshot(page, `${label}-project-hero`, { fullPage: false });
  await page.locator("#protocol").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await screenshot(page, `${label}-project-protocol`, { fullPage: false });
  await page.locator("#boundary").scrollIntoViewIfNeeded();
  await screenshot(page, `${label}-project-boundary`, { fullPage: false });
  await context.close();
}

async function auditCanvas(browser, viewport, label) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce", hasTouch: true });
  const tracked = await openTrackedPage(context, "/infinite-canvas.html", `${label} canvas`);
  const page = tracked.page;
  await page.locator(".evidence-node").first().waitFor();
  await page.waitForTimeout(150);
  await inspectPage(page, `${label} canvas`);

  const initial = await page.evaluate(() => ({
    nodes: document.querySelectorAll(".evidence-node").length,
    paths: document.querySelectorAll("#connectionLayer path").length,
    zoom: document.querySelector("#zoomOutput").textContent,
    transform: document.querySelector("#roomWorld").style.transform
  }));
  record(`${label} canvas: evidence graph complete`, initial.nodes === 18 && initial.paths === 23, initial);
  await screenshot(page, `${label}-canvas-initial`, { fullPage: false });

  const target = page.locator('[data-node-id="technical-expert"]');
  await target.click();
  await page.waitForTimeout(50);
  const openState = await page.evaluate(() => ({
    focus: document.activeElement.id,
    hidden: document.querySelector("#evidenceInspector").getAttribute("aria-hidden"),
    expanded: document.querySelector('[data-node-id="technical-expert"]').getAttribute("aria-expanded")
  }));
  record(`${label} canvas: inspector receives focus`, openState.focus === "evidenceInspector" && openState.hidden === "false", openState);
  await screenshot(page, `${label}-canvas-inspector`, { fullPage: false });
  await page.locator("#inspectorClose").click();
  const restoredFocus = await page.evaluate(() => document.activeElement && document.activeElement.dataset.nodeId);
  record(`${label} canvas: close restores originating node focus`, restoredFocus === "technical-expert", restoredFocus);

  const beforeDrag = await target.boundingBox();
  if (beforeDrag) {
    await page.mouse.move(beforeDrag.x + beforeDrag.width / 2, beforeDrag.y + beforeDrag.height / 2);
    await page.mouse.down();
    await page.mouse.move(beforeDrag.x + beforeDrag.width / 2 + 70, beforeDrag.y + beforeDrag.height / 2 + 45, { steps: 10 });
    await page.mouse.up();
  }
  const afterDrag = await target.boundingBox();
  record(
    `${label} canvas: node drag changes position without duplication`,
    Boolean(beforeDrag && afterDrag) && Math.abs(afterDrag.x - beforeDrag.x) > 30 && (await page.locator('[data-node-id="technical-expert"]').count()) === 1,
    { beforeDrag, afterDrag }
  );

  const viewportLocator = page.locator("#roomViewport");
  const viewportBox = await viewportLocator.boundingBox();
  if (viewportBox) {
    await page.mouse.move(viewportBox.x + viewportBox.width * 0.4, viewportBox.y + viewportBox.height * 0.5);
    await page.mouse.wheel(0, -420);
    await page.waitForTimeout(100);
  }
  const zoomAfterWheel = await page.locator("#zoomOutput").textContent();
  record(`${label} canvas: wheel changes zoom`, zoomAfterWheel !== initial.zoom, { before: initial.zoom, after: zoomAfterWheel });

  const centerBefore = await page.evaluate(() => {
    const transform = getComputedStyle(document.querySelector("#roomWorld")).transform;
    return { transform, width: innerWidth, height: innerHeight };
  });
  await page.setViewportSize({ width: viewport.width + 80, height: viewport.height + 40 });
  await page.waitForTimeout(120);
  const centerAfter = await page.evaluate(() => ({
    transform: getComputedStyle(document.querySelector("#roomWorld")).transform,
    width: innerWidth,
    height: innerHeight
  }));
  record(`${label} canvas: resize preserves a valid camera transform`, centerBefore.transform !== "none" && centerAfter.transform !== "none", { centerBefore, centerAfter });

  const endpointError = await page.evaluate(() => {
    const world = document.querySelector("#roomWorld");
    const scaleMatch = world.style.transform.match(/scale\(([^)]+)\)/);
    const scale = scaleMatch ? Number(scaleMatch[1]) : 1;
    let max = 0;
    document.querySelectorAll("#connectionLayer path").forEach((path) => {
      const from = document.querySelector(`[data-node-id="${path.dataset.from}"]`);
      const to = document.querySelector(`[data-node-id="${path.dataset.to}"]`);
      if (!from || !to) return;
      const pathLength = path.getTotalLength();
      const start = path.getPointAtLength(0);
      const end = path.getPointAtLength(pathLength);
      const fromTransform = new DOMMatrixReadOnly(getComputedStyle(from).transform);
      const toTransform = new DOMMatrixReadOnly(getComputedStyle(to).transform);
      const fromCenter = { x: fromTransform.m41 + from.offsetWidth / 2, y: fromTransform.m42 + from.offsetHeight / 2 };
      const toCenter = { x: toTransform.m41 + to.offsetWidth / 2, y: toTransform.m42 + to.offsetHeight / 2 };
      const startError = Math.hypot(start.x - fromCenter.x, start.y - fromCenter.y);
      const endError = Math.hypot(end.x - toCenter.x, end.y - toCenter.y);
      max = Math.max(max, startError, endError);
    });
    return { max, scale };
  });
  record(`${label} canvas: connections track measured node geometry`, endpointError.max <= 1, endpointError);

  const frameStats = await page.evaluate(async () => {
    const samples = [];
    let last = performance.now();
    await new Promise((resolve) => {
      let frames = 0;
      function step(now) {
        samples.push(now - last);
        last = now;
        frames += 1;
        if (frames >= 60) resolve();
        else requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    samples.sort((a, b) => a - b);
    return { p95: samples[Math.floor(samples.length * 0.95)], max: samples[samples.length - 1] };
  });
  record(`${label} canvas: animation frame pacing remains responsive`, frameStats.p95 < 35, frameStats);
  await context.close();
}

async function auditStaticFiles(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const notFound = await openTrackedPage(context, "/404.html", "404 page");
  await inspectPage(notFound.page, "404 page");
  await screenshot(notFound.page, "404-page", { fullPage: false });

  const unknownResponse = await notFound.page.goto(`${baseUrl}/route-that-does-not-exist`, { waitUntil: "networkidle" });
  record("unknown route is not a false success locally", Boolean(unknownResponse) && unknownResponse.status() === 404, unknownResponse && unknownResponse.status());

  const robots = await context.request.get(`${baseUrl}/robots.txt`);
  const robotsText = await robots.text();
  record("robots.txt is valid and points to sitemap", robots.ok() && /Sitemap:\s+https:\/\/akagavin-evidence-noir\.pages\.dev\/sitemap\.xml/.test(robotsText), robotsText);

  const sitemap = await context.request.get(`${baseUrl}/sitemap.xml`);
  const sitemapText = await sitemap.text();
  record("sitemap contains every public dossier", sitemap.ok() && (sitemapText.match(/<loc>/g) || []).length === 13, (sitemapText.match(/<loc>/g) || []).length);
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    await auditHome(browser, { width: 2560, height: 1080 }, "wide");
    await auditHome(browser, { width: 390, height: 844 }, "mobile");
    await auditProject(browser, { width: 1440, height: 900 }, "desktop");
    await auditProject(browser, { width: 360, height: 800 }, "mobile");
    await auditCanvas(browser, { width: 1440, height: 900 }, "desktop");
    await auditCanvas(browser, { width: 390, height: 844 }, "mobile");
    await auditStaticFiles(browser);
  } finally {
    await browser.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    checks: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
    failures,
    results
  };
  fs.writeFileSync(path.join(outputDir, "qa-report.json"), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify({ checks: report.checks, passed: report.passed, failed: report.failed, failures }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
