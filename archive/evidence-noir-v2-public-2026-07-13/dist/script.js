(function () {
  "use strict";

  var siteData = window.SITE_DATA;
  var atlas = window.EVIDENCE_ATLAS;
  if (!siteData || !atlas) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var statusRegion = document.getElementById("statusRegion");
  var curtain = document.getElementById("sceneCurtain");
  var focusLight = document.getElementById("focusLight");
  var siteHeader = document.getElementById("siteHeader");
  var railProgress = document.getElementById("railProgress");
  var sceneButtons = Array.from(document.querySelectorAll(".scene-rail button[data-target]"));
  var sceneOrder = ["identity", "systems", "proof", "contact"];
  var sceneSections = Array.from(document.querySelectorAll("[data-scene]"));
  var currentScene = "identity";
  var curtainBusy = false;
  var pointerX = -500;
  var pointerY = -500;
  var pointerFrame = 0;

  function createNode(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function announce(message) {
    statusRegion.textContent = "";
    requestAnimationFrame(function () {
      statusRegion.textContent = message;
    });
  }

  function renderIdentityFacts() {
    var container = document.getElementById("identityFacts");
    siteData.profile.facts.slice(0, 6).forEach(function (fact, index) {
      var row = createNode("article", "identity-fact");
      row.append(
        createNode("small", "", String(index + 1).padStart(2, "0") + " / " + fact[0]),
        createNode("p", "", fact[1])
      );
      container.appendChild(row);
    });
  }

  function renderPrinciples() {
    var reel = document.getElementById("principleReel");
    atlas.principles.slice(0, 4).forEach(function (principle, index) {
      var card = createNode("article", "principle-card reveal");
      card.tabIndex = 0;
      card.append(
        createNode("span", "principle-index", "P/" + String(index + 1).padStart(2, "0")),
        createNode("h3", "", principle.label),
        createNode("p", "", principle.rule),
        createNode("small", "", principle.evidenceRefs.length + " EVIDENCE LINKS")
      );
      reel.appendChild(card);
    });
  }

  function getProjectOrder() {
    var result = [];
    var seen = new Set();
    siteData.workGroups.forEach(function (group) {
      group.projects.forEach(function (item) {
        if (!seen.has(item.id) && siteData.projects[item.id]) {
          seen.add(item.id);
          result.push({ id: item.id, group: group.title, project: siteData.projects[item.id] });
        }
      });
    });
    return result;
  }

  function renderProjects() {
    var reel = document.getElementById("projectReel");
    var projects = getProjectOrder();
    document.getElementById("projectCount").textContent = String(projects.length).padStart(2, "0");

    projects.forEach(function (entry, index) {
      var evidenceCount = (atlas.projectEvidence[entry.id] || []).length;
      var link = createNode("a", "project-row reveal");
      link.href = "pages/project.html?id=" + encodeURIComponent(entry.id);
      link.setAttribute("aria-label", "查看 " + entry.project.title + " 项目档案");

      var meta = createNode("span", "project-meta");
      meta.append(
        createNode("span", "", String(evidenceCount).padStart(2, "0") + " RECORDS"),
        document.createElement("br"),
        document.createTextNode("OPEN DOSSIER ↗")
      );

      link.append(
        createNode("span", "project-index", String(index + 1).padStart(2, "0")),
        createNode("h3", "", entry.project.title),
        createNode("p", "", entry.project.summary),
        meta
      );
      reel.appendChild(link);
    });
  }

  function renderCapabilities() {
    var container = document.getElementById("capabilityClusters");
    var clusterOrder = ["OPERATE & GROW", "RESEARCH & DECIDE", "BUILD & GOVERN"];

    clusterOrder.forEach(function (clusterName, clusterIndex) {
      var cluster = createNode("article", "capability-cluster reveal");
      var header = createNode("header", "cluster-head");
      header.append(
        createNode("h3", "", clusterName),
        createNode("span", "cluster-index", "0" + (clusterIndex + 1) + " / 03")
      );
      cluster.appendChild(header);

      atlas.capabilities.filter(function (capability) {
        return capability.cluster === clusterName;
      }).forEach(function (capability, index) {
        var item = createNode("div", "capability-item");
        item.append(
          createNode("span", "", String(index + 1).padStart(2, "0")),
          createNode("strong", "", capability.label),
          createNode("p", "", capability.definition)
        );
        cluster.appendChild(item);
      });
      container.appendChild(cluster);
    });
  }

  function renderStaticData() {
    renderIdentityFacts();
    renderPrinciples();
    renderProjects();
    renderCapabilities();
    document.getElementById("privateBoundary").textContent = atlas.meta.privateBoundary;
  }

  function setActiveScene(scene) {
    if (sceneOrder.indexOf(scene) < 0) return;
    currentScene = scene;
    sceneButtons.forEach(function (button) {
      button.classList.toggle("active", button.dataset.target === scene);
    });
    document.body.dataset.scene = scene;
  }

  function cutTo(targetId) {
    var target = document.getElementById(targetId);
    if (!target || curtainBusy) return;
    curtainBusy = true;
    document.body.classList.add("is-transitioning");
    curtain.classList.remove("in");
    void curtain.offsetWidth;
    curtain.classList.add("in");

    window.setTimeout(function () {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      history.replaceState(null, "", "#" + targetId);
      announce("已进入" + targetId + "章节");
    }, reducedMotion ? 0 : 350);

    window.setTimeout(function () {
      curtain.classList.remove("in");
      document.body.classList.remove("is-transitioning");
      curtainBusy = false;
    }, reducedMotion ? 10 : 800);
  }

  document.addEventListener("click", function (event) {
    var control = event.target.closest("[data-target]");
    if (!control) return;
    var targetId = control.dataset.target;
    if (!document.getElementById(targetId)) return;
    event.preventDefault();
    cutTo(targetId);
  });

  function initRevealObserver() {
    var revealItems = Array.from(document.querySelectorAll(".reveal"));
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

    revealItems.forEach(function (item, index) {
      item.style.transitionDelay = Math.min(index % 4, 3) * 80 + "ms";
      observer.observe(item);
    });
  }

  function initSceneObserver() {
    if (!("IntersectionObserver" in window)) return;
    var sceneVisibility = new Map();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        sceneVisibility.set(entry.target, entry.intersectionRatio);
      });
      var winner = sceneSections.reduce(function (best, section) {
        var ratio = sceneVisibility.get(section) || 0;
        return ratio > best.ratio ? { scene: section.dataset.scene, ratio: ratio } : best;
      }, { scene: currentScene, ratio: 0 });
      if (winner.ratio > 0) setActiveScene(winner.scene);
    }, { threshold: [0.08, 0.2, 0.4, 0.6] });

    sceneSections.forEach(function (section) { observer.observe(section); });
  }

  function updateClock() {
    var now = new Date();
    document.getElementById("localClock").textContent =
      String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  }

  function updateScrollState() {
    var maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    var progress = Math.min(window.scrollY / maxScroll, 1);
    railProgress.style.height = progress * 100 + "%";
    siteHeader.classList.toggle("scrolled", window.scrollY > 40);

    var frame = Math.floor(progress * 23);
    var second = Math.floor(progress * 59);
    var timecode = document.querySelector(".hero-timecode");
    if (timecode) timecode.textContent = "TC 00:00:" + String(second).padStart(2, "0") + ":" + String(frame).padStart(2, "0");
  }

  function initPointerLight() {
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
    document.body.classList.add("has-pointer");
    window.addEventListener("pointermove", function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(function () {
        focusLight.style.transform = "translate3d(" + (pointerX - 160) + "px," + (pointerY - 160) + "px,0)";
        pointerFrame = 0;
      });
    }, { passive: true });
  }

  function normalizeInitialHash() {
    var legacy = { home: "identity", works: "proof", system: "systems" };
    var hash = location.hash.replace("#", "");
    var target = legacy[hash] || hash;
    if (target && target !== "identity" && document.getElementById(target)) {
      requestAnimationFrame(function () {
        document.getElementById(target).scrollIntoView({ block: "start" });
      });
    }
  }

  renderStaticData();
  initRevealObserver();
  initSceneObserver();
  initPointerLight();
  normalizeInitialHash();
  updateClock();
  updateScrollState();
  window.setInterval(updateClock, 30000);
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState, { passive: true });
})();
