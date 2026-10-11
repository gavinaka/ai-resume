(function () {
  "use strict";

  var data = window.SITE_DATA;
  var atlas = window.EVIDENCE_ATLAS;
  if (!data) return;

  var html = document.documentElement;
  var pillNav = document.getElementById("pillNav");
  var transitionOverlay = document.getElementById("transitionOverlay");
  var statusRegion = document.getElementById("statusRegion");
  var heroSection = document.getElementById("heroSection");
  var heroCta = document.getElementById("heroCta");
  var terminalLines = document.getElementById("terminalLines");
  var canvasFrame = document.getElementById("canvasFrame");
  var surface = document.getElementById("desktopSurface");
  var iconLayer = document.getElementById("desktopIcons");
  var windowLayer = document.getElementById("windowLayer");
  var exitScreen = document.getElementById("exitScreen");
  var backToTopButton = document.getElementById("backToTopButton");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tabs = ["home", "works", "system"];
  var typingDone = false;
  var launched = false;
  var looping = false;
  var canvasLoaded = false;
  var windowZ = 100;
  var windowCount = 0;
  var typingTimers = [];

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function announce(message) {
    statusRegion.textContent = "";
    requestAnimationFrame(function () {
      statusRegion.textContent = message;
    });
  }

  function currentTab() {
    var tab = location.hash.replace("#", "");
    return tabs.indexOf(tab) >= 0 ? tab : "home";
  }

  function applyScrollLock() {
    html.classList.toggle("scroll-locked", currentTab() === "home" && !launched);
  }

  function switchTab(tab) {
    tabs.forEach(function (name) {
      document.getElementById("page-" + name).classList.toggle("active", name === tab);
    });
    pillNav.querySelectorAll("button").forEach(function (button) {
      button.classList.toggle("active", button.dataset.tab === tab);
    });

    if (tab === "system" && !canvasLoaded) {
      canvasFrame.src = canvasFrame.dataset.src;
      canvasLoaded = true;
    }

    window.scrollTo(0, 0);
    requestAnimationFrame(function () {
      window.scrollTo(0, 0);
    });
    applyScrollLock();
    announce(tab === "home" ? "已进入主页" : tab === "works" ? "已进入作品集" : "已进入我的 OS");
  }

  pillNav.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-tab]");
    if (!button) return;
    location.hash = button.dataset.tab;
  });

  window.addEventListener("hashchange", function () {
    switchTab(currentTab());
  });

  function tickClock() {
    var now = new Date();
    document.getElementById("mbClock").textContent =
      String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  }

  tickClock();
  window.setInterval(tickClock, 30000);

  function renderTerminalLine(item, target) {
    var row = document.createElement("div");
    row.className = "term-line";

    if (item.type === "blank") {
      row.innerHTML = "&nbsp;";
    } else {
      var span = document.createElement("span");
      if (item.type === "cmd") {
        var prompt = document.createElement("span");
        prompt.className = "term-prompt";
        prompt.textContent = item.prompt;
        span.className = "term-cmd";
        span.textContent = item.text;
        row.append(prompt, span);
        if (item.cursor) {
          var cursor = document.createElement("span");
          cursor.className = "cursor";
          cursor.id = target === terminalLines ? "mainCursor" : "loopCursor";
          row.appendChild(cursor);
        }
      } else {
        span.className = item.type === "gold" ? "term-gold" : "term-output";
        span.textContent = (item.prefix || "") + item.text;
        row.appendChild(span);
      }
    }

    target.appendChild(row);
    return row;
  }

  function finishTyping() {
    if (typingDone) return;
    typingDone = true;
    heroCta.classList.add("visible");
    pillNav.classList.remove("hidden-during-intro");
    try {
      localStorage.setItem("akagavin_visited", "1");
    } catch (error) {
      // The site remains functional when local storage is unavailable.
    }
  }

  function skipTyping() {
    if (typingDone) return;
    typingTimers.forEach(window.clearTimeout);
    terminalLines.querySelectorAll(".term-line").forEach(function (line) {
      line.classList.add("visible");
    });
    finishTyping();
  }

  function buildTerminalIntro() {
    var returnVisitor = false;
    try {
      returnVisitor = Boolean(localStorage.getItem("akagavin_visited"));
    } catch (error) {
      returnVisitor = false;
    }

    var elapsed = 0;
    data.terminal.forEach(function (item) {
      var row = renderTerminalLine(item, terminalLines);
      if (returnVisitor || reducedMotion || currentTab() !== "home") {
        row.classList.add("visible");
        return;
      }

      elapsed += item.type === "blank" ? 100 : item.type === "cmd" ? 520 : 270;
      typingTimers.push(window.setTimeout(function () {
        row.classList.add("visible");
      }, elapsed));
    });

    if (returnVisitor || reducedMotion || currentTab() !== "home") {
      finishTyping();
      if (returnVisitor && currentTab() === "home") {
        window.setTimeout(launch, reducedMotion ? 120 : 700);
      }
      return;
    }

    typingTimers.push(window.setTimeout(finishTyping, elapsed + 450));
  }

  heroSection.addEventListener("click", function (event) {
    if (!typingDone && !event.target.closest("#heroCta")) skipTyping();
  });

  document.addEventListener("keydown", function (event) {
    if (!typingDone && event.key !== "Enter") skipTyping();
  });

  function launch() {
    if (launched || !typingDone || currentTab() !== "home") return;
    launched = true;
    heroCta.classList.remove("visible");
    heroCta.classList.add("hidden");

    var cursor = document.getElementById("mainCursor");
    if (cursor) cursor.remove();

    var launchLine = renderTerminalLine({ type: "output", prefix: "> ", text: "launching..." }, terminalLines);
    launchLine.classList.add("visible");

    var progressLine = document.createElement("div");
    progressLine.className = "term-line visible";
    var progressText = document.createElement("span");
    progressText.className = "term-prompt";
    progressText.textContent = "[............] 0%";
    progressLine.appendChild(progressText);
    terminalLines.appendChild(progressLine);

    if (reducedMotion) {
      progressText.textContent = "[############] 100%";
      beginZoom();
      return;
    }

    var progress = 0;
    var steps = 12;
    var interval = window.setInterval(function () {
      progress += 1;
      var filled = "#".repeat(progress);
      var empty = ".".repeat(steps - progress);
      progressText.textContent = "[" + filled + empty + "] " + Math.round((progress / steps) * 100) + "%";
      if (progress >= steps) {
        window.clearInterval(interval);
        beginZoom();
      }
    }, 72);
  }

  function beginZoom() {
    var wrapper = document.getElementById("macbookWrapper");
    var screen = document.getElementById("macbookScreen");
    var terminal = document.getElementById("terminal");
    var rect = screen.getBoundingClientRect();
    var scale = Math.max(window.innerWidth / rect.width, window.innerHeight / rect.height) * 1.06;
    var wrapperRect = wrapper.getBoundingClientRect();
    var screenCenterX = rect.left + rect.width / 2;
    var screenCenterY = rect.top + rect.height / 2;
    var wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
    var wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;
    var offsetX = screenCenterX - wrapperCenterX;
    var offsetY = screenCenterY - wrapperCenterY;
    var translateX = window.innerWidth / 2 - (wrapperCenterX + offsetX * scale);
    var translateY = window.innerHeight / 2 - (wrapperCenterY + offsetY * scale);
    var zoomTime = reducedMotion ? 20 : 1550;

    wrapper.classList.add("zoom-transition");
    terminal.classList.add("scale-through");
    requestAnimationFrame(function () {
      wrapper.style.transform = "translate(" + translateX + "px," + translateY + "px) scale(" + scale + ")";
    });

    window.setTimeout(function () {
      transitionOverlay.classList.add("active");
    }, reducedMotion ? 0 : 1080);

    window.setTimeout(function () {
      heroSection.hidden = true;
      applyScrollLock();
      window.scrollTo(0, 0);
      window.setTimeout(function () {
        transitionOverlay.classList.remove("active");
        announce("AkaGavin OS 已启动");
      }, reducedMotion ? 20 : 260);
    }, zoomTime);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !launched && !looping) launch();
  });
  heroCta.addEventListener("click", launch);
  document.getElementById("macbookBezel").addEventListener("click", function () {
    if (typingDone) launch();
  });
  document.getElementById("macbookBezel").addEventListener("keydown", function (event) {
    if ((event.key === "Enter" || event.key === " ") && typingDone) {
      event.preventDefault();
      launch();
    }
  });

  function renderWorks() {
    var root = document.getElementById("worksContent");
    var workflow = document.createElement("section");
    workflow.className = "workflow-screen";

    var heading = document.createElement("h1");
    heading.className = "workflow-headline";
    heading.textContent = data.profile.headline;
    var subtitle = document.createElement("p");
    subtitle.className = "workflow-subtitle";
    subtitle.textContent = data.profile.name + " / " + data.profile.role + " / Agent Governance";
    var columns = document.createElement("div");
    columns.className = "workflow-columns";
    var atlasSummary = document.createElement("div");
    atlasSummary.className = "atlas-summary";

    if (atlas) {
      [
        [atlas.records.length, "公开证据"],
        [atlas.capabilities.length, "能力档案"],
        [atlas.principles.length, "决策原则"],
        [atlas.stages.reduce(function (total, stage) { return total + stage.events.length; }, 0), "经历事件"]
      ].forEach(function (metric) {
        var block = document.createElement("div");
        var value = document.createElement("strong");
        var metricLabel = document.createElement("span");
        value.textContent = String(metric[0]).padStart(2, "0");
        metricLabel.textContent = metric[1];
        block.append(value, metricLabel);
        atlasSummary.appendChild(block);
      });
    }

    data.capabilities.forEach(function (group) {
      var column = document.createElement("article");
      var title = document.createElement("div");
      var line = document.createElement("div");
      title.className = "workflow-col-title";
      title.textContent = group.title;
      line.className = "workflow-col-line";
      column.append(title, line);

      group.items.forEach(function (item) {
        var row = document.createElement("div");
        var label = document.createElement("strong");
        var description = document.createElement("span");
        row.className = "workflow-item";
        label.textContent = item[0];
        description.textContent = item[1];
        row.append(label, description);
        if (atlas) {
          var capability = atlas.capabilities.find(function (entry) { return entry.label === item[0]; });
          if (capability) {
            var proof = document.createElement("small");
            proof.className = "workflow-proof";
            proof.textContent = capability.evidenceRefs.length + " EVIDENCE LINKS";
            row.appendChild(proof);
          }
        }
        column.appendChild(row);
      });
      columns.appendChild(column);
    });

    workflow.append(heading, subtitle, atlasSummary, columns);

    var index = document.createElement("section");
    index.className = "works-index";
    var command = document.createElement("p");
    command.className = "works-command";
    command.textContent = "ls public-work/";
    var indexHeading = document.createElement("h2");
    indexHeading.className = "works-heading";
    indexHeading.textContent = "作品集";
    var grid = document.createElement("div");
    grid.className = "works-grid";

    data.workGroups.forEach(function (group) {
      var card = document.createElement("article");
      card.className = "work-dim";
      var key = document.createElement("div");
      key.className = "dim-num";
      key.textContent = group.key;
      var title = document.createElement("h3");
      title.textContent = group.title;
      var description = document.createElement("p");
      description.className = "dim-description";
      description.textContent = group.description;
      var projects = document.createElement("div");
      projects.className = "dim-projects";

      group.projects.forEach(function (project) {
        var link = document.createElement("a");
        var projectLabel = document.createElement("span");
        var projectMeta = document.createElement("small");
        link.className = "dim-project";
        link.href = "pages/project.html?id=" + encodeURIComponent(project.id);
        link.target = "_blank";
        link.rel = "noopener";
        projectLabel.textContent = project.label;
        var projectEvidence = atlas && atlas.projectEvidence[project.id] ? atlas.projectEvidence[project.id] : [];
        var relatedCapabilities = atlas ? new Set(
          atlas.records.filter(function (record) { return projectEvidence.includes(record.id); })
            .flatMap(function (record) { return record.capabilityIds; })
        ).size : 0;
        projectMeta.textContent = projectEvidence.length + " 证据 / " + relatedCapabilities + " 能力";
        link.append(projectLabel, projectMeta);
        projects.appendChild(link);
      });

      card.append(key, title, description, projects);
      grid.appendChild(card);
    });

    var footer = document.createElement("p");
    footer.className = "works-footer";
    footer.textContent = data.profile.publicBoundary;
    index.append(command, indexHeading, grid, footer);
    root.append(workflow, index);
  }

  function renderDesktopIcons() {
    data.desktopIcons.forEach(function (item) {
      var button = document.createElement("button");
      var art = document.createElement("span");
      var label = document.createElement("span");
      button.type = "button";
      button.className = "desktop-icon";
      button.dataset.label = item.label;
      if (item.window) button.dataset.window = item.window;
      if (item.href) button.dataset.href = item.href;
      art.className = "desktop-icon-art " + item.kind;
      label.className = "desktop-icon-label";
      label.textContent = item.label;
      button.append(art, label);
      positionDesktopIcon(button, item);
      bindDesktopIcon(button);
      iconLayer.appendChild(button);
    });
  }

  function positionDesktopIcon(button, item) {
    var mobile = window.innerWidth <= 767;
    var cellX = mobile ? 72 : 90;
    var cellY = mobile ? 76 : 90;
    button.style.right = (mobile ? 8 : 24) + item.column * cellX + "px";
    button.style.top = (mobile ? 12 : 24) + item.row * cellY + "px";
  }

  function openFromElement(element) {
    if (element.dataset.window) openWindow(element.dataset.window);
    if (element.dataset.href) openIframeWindow(element.dataset.href, element.dataset.label || "Project");
  }

  function bindDesktopIcon(icon) {
    var moved = false;
    icon.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      moved = false;
      var startX = event.clientX;
      var startY = event.clientY;
      var rect = icon.getBoundingClientRect();
      var surfaceRect = surface.getBoundingClientRect();
      var originX = rect.left - surfaceRect.left;
      var originY = rect.top - surfaceRect.top;
      icon.style.right = "auto";
      icon.style.left = originX + "px";
      icon.style.top = originY + "px";
      icon.setPointerCapture(event.pointerId);

      function move(moveEvent) {
        var deltaX = moveEvent.clientX - startX;
        var deltaY = moveEvent.clientY - startY;
        if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) moved = true;
        icon.style.left = originX + deltaX + "px";
        icon.style.top = originY + deltaY + "px";
      }

      function end() {
        icon.removeEventListener("pointermove", move);
        icon.removeEventListener("pointerup", end);
        icon.removeEventListener("pointercancel", end);
      }

      icon.addEventListener("pointermove", move);
      icon.addEventListener("pointerup", end);
      icon.addEventListener("pointercancel", end);
    });

    icon.addEventListener("click", function () {
      if (moved) return;
      iconLayer.querySelectorAll(".desktop-icon").forEach(function (other) {
        other.classList.toggle("selected", other === icon);
      });
    });

    icon.addEventListener("dblclick", function () {
      if (!moved) openFromElement(icon);
    });

    icon.addEventListener("keydown", function (event) {
      if (event.key === "Enter") openFromElement(icon);
    });
  }

  function setActiveWindow(win) {
    windowLayer.querySelectorAll(".os-window").forEach(function (other) {
      other.classList.toggle("active-window", other === win);
    });
    win.style.zIndex = String(++windowZ);
  }

  function createWindowShell(id, title, width, height) {
    var win = document.createElement("section");
    win.className = "os-window";
    win.dataset.windowId = id;
    if (width) win.style.width = width + "px";
    if (height) win.style.height = height + "px";

    var bar = document.createElement("div");
    var traffic = document.createElement("div");
    var close = document.createElement("button");
    var minimize = document.createElement("button");
    var maximize = document.createElement("button");
    var titleNode = document.createElement("span");
    bar.className = "os-window-bar";
    traffic.className = "os-traffic";
    close.className = "os-close";
    minimize.className = "os-min";
    maximize.className = "os-max";
    close.type = minimize.type = maximize.type = "button";
    close.setAttribute("aria-label", "关闭窗口");
    minimize.setAttribute("aria-label", "最小化窗口");
    maximize.setAttribute("aria-label", "最大化窗口");
    titleNode.className = "os-window-title";
    titleNode.textContent = title;
    traffic.append(close, minimize, maximize);
    bar.append(traffic, titleNode);

    var body = document.createElement("div");
    body.className = "os-body";
    var resize = document.createElement("div");
    resize.className = "os-resize";
    resize.setAttribute("aria-hidden", "true");
    win.append(bar, body, resize);

    var isSmall = window.innerWidth <= 767;
    var offset = windowCount % 5;
    win.style.left = (isSmall ? 8 : 150 + offset * 36) + "px";
    win.style.top = (isSmall ? 46 + offset * 12 : 60 + offset * 34) + "px";
    windowCount += 1;

    close.addEventListener("click", function (event) {
      event.stopPropagation();
      win.remove();
      announce(title + " 已关闭");
    });

    minimize.addEventListener("click", function (event) {
      event.stopPropagation();
      var minimized = win.classList.toggle("minimized");
      body.hidden = minimized;
      resize.hidden = minimized;
      if (minimized) {
        win.dataset.previousHeight = win.style.height;
        win.style.height = "30px";
      } else {
        win.style.height = win.dataset.previousHeight || "";
      }
    });

    maximize.addEventListener("click", function (event) {
      event.stopPropagation();
      if (win.classList.toggle("maximized")) {
        win.dataset.restore = JSON.stringify({
          left: win.style.left,
          top: win.style.top,
          width: win.style.width,
          height: win.style.height
        });
        win.style.left = "8px";
        win.style.top = "8px";
        win.style.width = surface.clientWidth - 16 + "px";
        win.style.height = surface.clientHeight - 16 + "px";
      } else {
        var restore = JSON.parse(win.dataset.restore || "{}");
        win.style.left = restore.left || "150px";
        win.style.top = restore.top || "60px";
        win.style.width = restore.width || width + "px";
        win.style.height = restore.height || (height ? height + "px" : "");
      }
    });

    win.addEventListener("pointerdown", function () {
      setActiveWindow(win);
    });
    bindWindowDrag(win, bar);
    bindWindowResize(win, resize);
    windowLayer.appendChild(win);
    setActiveWindow(win);
    return { window: win, body: body, bar: bar };
  }

  function bindWindowDrag(win, bar) {
    bar.addEventListener("pointerdown", function (event) {
      if (event.target.closest("button") || win.classList.contains("maximized")) return;
      event.preventDefault();
      var startX = event.clientX;
      var startY = event.clientY;
      var originX = win.offsetLeft;
      var originY = win.offsetTop;
      bar.setPointerCapture(event.pointerId);

      function move(moveEvent) {
        var maxX = Math.max(0, surface.clientWidth - 90);
        var maxY = Math.max(0, surface.clientHeight - 40);
        win.style.left = Math.min(maxX, Math.max(-win.offsetWidth + 90, originX + moveEvent.clientX - startX)) + "px";
        win.style.top = Math.min(maxY, Math.max(0, originY + moveEvent.clientY - startY)) + "px";
      }

      function end() {
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", end);
        bar.removeEventListener("pointercancel", end);
      }

      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", end);
      bar.addEventListener("pointercancel", end);
    });
  }

  function bindWindowResize(win, handle) {
    handle.addEventListener("pointerdown", function (event) {
      if (win.classList.contains("maximized")) return;
      event.preventDefault();
      event.stopPropagation();
      var startX = event.clientX;
      var startY = event.clientY;
      var startWidth = win.offsetWidth;
      var startHeight = win.offsetHeight;
      handle.setPointerCapture(event.pointerId);

      function move(moveEvent) {
        win.style.width = Math.max(280, startWidth + moveEvent.clientX - startX) + "px";
        win.style.height = Math.max(200, startHeight + moveEvent.clientY - startY) + "px";
      }

      function end() {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
      }

      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    });
  }

  function renderWindowBody(body, definition) {
    var payload = definition.body;
    if (definition.type === "profile") {
      body.className += " os-profile";
      var image = document.createElement("img");
      image.src = "assets/akagavin-portrait.jpg";
      image.alt = "AkaGavin 公开肖像";
      var copy = document.createElement("div");
      var heading = document.createElement("h2");
      var role = document.createElement("p");
      heading.textContent = payload.title;
      role.className = "profile-role";
      role.textContent = payload.subtitle;
      copy.append(heading, role);
      payload.paragraphs.forEach(function (text) {
        var paragraph = document.createElement("p");
        paragraph.textContent = text;
        copy.appendChild(paragraph);
      });
      if (payload.facts && payload.facts.length) {
        var facts = document.createElement("dl");
        facts.className = "profile-facts";
        payload.facts.forEach(function (fact) {
          var wrapper = document.createElement("div");
          var term = document.createElement("dt");
          var detail = document.createElement("dd");
          term.textContent = fact[0];
          detail.textContent = fact[1];
          wrapper.append(term, detail);
          facts.appendChild(wrapper);
        });
        copy.appendChild(facts);
      }
      if (payload.traits && payload.traits.length) {
        var traitsHeading = document.createElement("h3");
        var traits = document.createElement("div");
        traitsHeading.className = "profile-section-title";
        traitsHeading.textContent = "Operating traits";
        traits.className = "profile-traits";
        payload.traits.forEach(function (trait) {
          var traitNode = document.createElement("span");
          traitNode.textContent = trait;
          traits.appendChild(traitNode);
        });
        copy.append(traitsHeading, traits);
      }
      var tags = document.createElement("div");
      tags.className = "profile-tags";
      payload.tags.forEach(function (tag) {
        var span = document.createElement("span");
        span.textContent = tag;
        tags.appendChild(span);
      });
      copy.appendChild(tags);
      body.append(image, copy);
    }

    if (definition.type === "document") {
      body.className += " document-window";
      var docHeading = document.createElement("h2");
      var intro = document.createElement("p");
      var list = document.createElement("ul");
      docHeading.textContent = payload.heading;
      intro.className = "document-intro";
      intro.textContent = payload.intro;
      list.className = "document-list";
      payload.items.forEach(function (item) {
        var li = document.createElement("li");
        var strong = document.createElement("strong");
        var span = document.createElement("span");
        strong.textContent = item[0];
        span.textContent = item[1];
        li.append(strong, span);
        list.appendChild(li);
      });
      body.append(docHeading, intro, list);
    }

    if (definition.type === "timeline-atlas") {
      body.className += " timeline-atlas-window";
      var timelineHeading = document.createElement("h2");
      var timelineIntro = document.createElement("p");
      var timelineStages = document.createElement("div");
      timelineHeading.textContent = payload.heading;
      timelineIntro.className = "atlas-window-intro";
      timelineIntro.textContent = payload.intro;
      timelineStages.className = "timeline-stages";
      atlas.stages.forEach(function (stage, stageIndex) {
        var stageNode = document.createElement("section");
        var stageTop = document.createElement("div");
        var stageNumber = document.createElement("span");
        var stageTitle = document.createElement("h3");
        var stagePeriod = document.createElement("small");
        var stageThesis = document.createElement("p");
        var eventList = document.createElement("div");
        stageNode.className = "timeline-stage";
        stageTop.className = "timeline-stage-top";
        stageNumber.textContent = String(stageIndex + 1).padStart(2, "0");
        stageTitle.textContent = stage.label;
        stagePeriod.textContent = stage.period;
        stageThesis.textContent = stage.thesis;
        eventList.className = "timeline-events";
        stageTop.append(stageNumber, stageTitle, stagePeriod);
        stage.events.forEach(function (eventItem) {
          var eventNode = document.createElement("article");
          var eventDate = document.createElement("span");
          var eventTitle = document.createElement("strong");
          var eventText = document.createElement("p");
          eventDate.textContent = eventItem[0];
          eventTitle.textContent = eventItem[1];
          eventText.textContent = eventItem[2];
          eventNode.append(eventDate, eventTitle, eventText);
          eventList.appendChild(eventNode);
        });
        stageNode.append(stageTop, stageThesis, eventList);
        timelineStages.appendChild(stageNode);
      });
      body.append(timelineHeading, timelineIntro, timelineStages);
    }

    if (definition.type === "capability-atlas") {
      body.className += " capability-atlas-window";
      var capabilityHeading = document.createElement("h2");
      var capabilityIntro = document.createElement("p");
      var capabilityGroups = document.createElement("div");
      capabilityHeading.textContent = payload.heading;
      capabilityIntro.className = "atlas-window-intro";
      capabilityIntro.textContent = payload.intro;
      capabilityGroups.className = "capability-atlas-groups";
      Array.from(new Set(atlas.capabilities.map(function (capability) { return capability.cluster; }))).forEach(function (cluster) {
        var groupNode = document.createElement("section");
        var groupHeading = document.createElement("h3");
        var groupGrid = document.createElement("div");
        groupHeading.textContent = cluster;
        groupGrid.className = "capability-atlas-grid";
        atlas.capabilities.filter(function (capability) { return capability.cluster === cluster; }).forEach(function (capability) {
          var card = document.createElement("article");
          var title = document.createElement("h4");
          var definitionText = document.createElement("p");
          var method = document.createElement("p");
          var boundary = document.createElement("p");
          var proof = document.createElement("span");
          title.textContent = capability.label;
          definitionText.textContent = capability.definition;
          method.textContent = "方法：" + capability.method;
          boundary.className = "atlas-card-boundary";
          boundary.textContent = "边界：" + capability.boundary;
          proof.textContent = capability.evidenceRefs.length + " EVIDENCE LINKS";
          card.append(title, definitionText, method, boundary, proof);
          groupGrid.appendChild(card);
        });
        groupNode.append(groupHeading, groupGrid);
        capabilityGroups.appendChild(groupNode);
      });
      body.append(capabilityHeading, capabilityIntro, capabilityGroups);
    }

    if (definition.type === "principles-atlas") {
      body.className += " principles-atlas-window";
      var principlesHeading = document.createElement("h2");
      var principlesIntro = document.createElement("p");
      var principlesGrid = document.createElement("div");
      principlesHeading.textContent = payload.heading;
      principlesIntro.className = "atlas-window-intro";
      principlesIntro.textContent = payload.intro;
      principlesGrid.className = "principles-atlas-grid";
      atlas.principles.forEach(function (principle, index) {
        var card = document.createElement("article");
        var number = document.createElement("span");
        var title = document.createElement("h3");
        var origin = document.createElement("small");
        var rule = document.createElement("p");
        var tradeoff = document.createElement("p");
        var failure = document.createElement("p");
        number.textContent = String(index + 1).padStart(2, "0");
        title.textContent = principle.label;
        origin.textContent = principle.origin;
        rule.textContent = principle.rule;
        tradeoff.textContent = "代价：" + principle.tradeoff;
        failure.className = "atlas-card-boundary";
        failure.textContent = "失效信号：" + principle.failureSignal;
        card.append(number, title, origin, rule, tradeoff, failure);
        principlesGrid.appendChild(card);
      });
      body.append(principlesHeading, principlesIntro, principlesGrid);
    }

    if (definition.type === "matrix") {
      body.className += " matrix-window";
      var matrixHeading = document.createElement("h2");
      var matrixIntro = document.createElement("p");
      var matrixGrid = document.createElement("div");
      matrixHeading.textContent = payload.heading;
      matrixIntro.className = "matrix-intro";
      matrixIntro.textContent = payload.intro;
      matrixGrid.className = "matrix-grid";
      payload.groups.forEach(function (group) {
        var groupNode = document.createElement("section");
        var groupHeading = document.createElement("h3");
        var groupList = document.createElement("ul");
        groupHeading.textContent = group.title;
        group.items.forEach(function (item) {
          var itemNode = document.createElement("li");
          itemNode.textContent = item;
          groupList.appendChild(itemNode);
        });
        groupNode.append(groupHeading, groupList);
        matrixGrid.appendChild(groupNode);
      });
      body.append(matrixHeading, matrixIntro, matrixGrid);
    }

    if (definition.type === "folder") {
      body.className += " folder-window";
      payload.entries.forEach(function (entry) {
        var button = document.createElement("button");
        var art = document.createElement("span");
        var label = document.createElement("span");
        button.type = "button";
        button.className = "folder-entry";
        button.dataset.label = entry.label;
        if (entry.href) button.dataset.href = entry.href;
        if (entry.window) button.dataset.window = entry.window;
        art.className = "folder-entry-art " + entry.kind;
        label.textContent = entry.label;
        button.append(art, label);
        button.addEventListener("dblclick", function () {
          openFromElement(button);
        });
        button.addEventListener("keydown", function (event) {
          if (event.key === "Enter") openFromElement(button);
        });
        body.appendChild(button);
      });
    }

    if (definition.type === "services") {
      body.className += " services-window";
      var servicesHeading = document.createElement("h2");
      var servicesSubtitle = document.createElement("p");
      var services = document.createElement("div");
      var contact = document.createElement("div");
      servicesHeading.textContent = payload.heading;
      servicesSubtitle.className = "services-subtitle";
      servicesSubtitle.textContent = payload.subtitle;
      services.className = "services-grid";
      payload.services.forEach(function (service) {
        var card = document.createElement("article");
        var icon = document.createElement("div");
        var heading = document.createElement("h3");
        var text = document.createElement("p");
        card.className = "service-card";
        icon.className = "service-icon";
        icon.textContent = service.icon;
        heading.textContent = service.title;
        text.textContent = service.text;
        card.append(icon, heading, text);
        services.appendChild(card);
      });
      contact.className = "services-contact";
      contact.textContent = payload.contact;
      body.append(servicesHeading, servicesSubtitle, services, contact);
    }

    if (definition.type === "chat") {
      body.className += " chat-window";
      var sidebar = document.createElement("aside");
      var avatar = document.createElement("img");
      var mic = document.createElement("span");
      var main = document.createElement("div");
      var tabsNode = document.createElement("div");
      var thread = document.createElement("div");
      var input = document.createElement("div");
      sidebar.className = "chat-sidebar";
      avatar.src = "assets/akagavin-portrait.jpg";
      avatar.alt = "Agent Console 头像";
      mic.textContent = "◎";
      sidebar.append(avatar, mic);
      main.className = "chat-main";
      tabsNode.className = "chat-tabs";
      ["对话", "交付", "审计", "接入"].forEach(function (tab, index) {
        var span = document.createElement("span");
        span.textContent = tab;
        if (index === 0) span.className = "active";
        tabsNode.appendChild(span);
      });
      thread.className = "chat-thread";
      payload.messages.forEach(function (message) {
        var bubble = document.createElement("div");
        bubble.className = "chat-message " + message.from;
        if (message.note) {
          var note = document.createElement("span");
          note.className = "chat-note";
          note.textContent = message.note;
          bubble.appendChild(note);
        }
        bubble.appendChild(document.createTextNode(message.text));
        thread.appendChild(bubble);
      });
      input.className = "chat-input";
      input.innerHTML = "<span>输入消息...</span><b>PUBLIC MODE</b>";
      main.append(tabsNode, thread, input);
      body.append(sidebar, main);
    }
  }

  function openWindow(id) {
    var definition = data.windows[id];
    if (!definition) return;
    var existing = windowLayer.querySelector('[data-window-id="' + id + '"]');
    if (existing) {
      setActiveWindow(existing);
      return;
    }
    var shell = createWindowShell(id, definition.title, definition.width, definition.height);
    renderWindowBody(shell.body, definition);
    announce(definition.title + " 已打开");
  }

  function openIframeWindow(url, title) {
    var id = "iframe:" + url;
    var existing = Array.from(windowLayer.querySelectorAll(".os-window")).find(function (win) {
      return win.dataset.windowId === id;
    });
    if (existing) {
      setActiveWindow(existing);
      return;
    }
    var shell = createWindowShell(id, title, Math.min(760, surface.clientWidth * 0.88), Math.min(570, surface.clientHeight * 0.76));
    var iframe = document.createElement("iframe");
    iframe.className = "iframe-window";
    iframe.src = url;
    iframe.title = title;
    shell.body.appendChild(iframe);
    announce(title + " 已打开");
  }

  document.querySelectorAll("[data-window]").forEach(function (button) {
    if (button.closest("#desktopIcons")) return;
    button.addEventListener("click", function () {
      openWindow(button.dataset.window);
    });
  });

  function buildWallpaperStars() {
    var layer = document.getElementById("wallpaperStars");
    for (var index = 0; index < 96; index += 1) {
      var star = document.createElement("span");
      star.className = "wp-star";
      star.textContent = "✦";
      star.style.left = ((index * 61 + 7) % 97) + "%";
      star.style.top = ((index * 37 + 3) % 96) + "%";
      star.style.setProperty("--size", 5 + ((index * 7) % 13) + "px");
      star.style.setProperty("--opacity", (0.34 + (index % 6) * 0.08).toFixed(2));
      star.style.setProperty("--duration", 2.3 + (index % 7) * 0.31 + "s");
      star.style.setProperty("--delay", (index % 9) * 0.22 + "s");
      layer.appendChild(star);
    }

    if (reducedMotion) return;
    var pointerX = -9999;
    var pointerY = -9999;
    var stars = Array.from(layer.children);
    surface.addEventListener("pointermove", function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
    });
    surface.addEventListener("pointerleave", function () {
      pointerX = -9999;
      pointerY = -9999;
    });

    function update() {
      stars.forEach(function (star) {
        var rect = star.getBoundingClientRect();
        var deltaX = rect.left + rect.width / 2 - pointerX;
        var deltaY = rect.top + rect.height / 2 - pointerY;
        var distance = Math.hypot(deltaX, deltaY);
        if (distance < 130) {
          var force = (1 - distance / 130) * 22;
          var angle = Math.atan2(deltaY, deltaX);
          var translateX = Math.cos(angle) * force;
          var translateY = Math.sin(angle) * force;
          var scale = 1 + (1 - distance / 130) * 0.38;
          star.style.setProperty("--push", "translate3d(" + translateX + "px," + translateY + "px,0) scale(" + scale + ")");
          star.classList.add("disturbed");
        } else {
          star.style.setProperty("--push", "translate3d(0,0,0) scale(1)");
          star.classList.remove("disturbed");
        }
      });
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  surface.addEventListener("click", function (event) {
    if (event.target.closest(".desktop-icon, .os-window, .desktop-menubar")) return;
    var star = document.createElement("span");
    star.className = "click-star";
    star.textContent = "✦";
    star.style.left = event.clientX + "px";
    star.style.top = event.clientY + "px";
    star.style.fontSize = 8 + Math.random() * 11 + "px";
    document.body.appendChild(star);
    window.setTimeout(function () {
      star.remove();
    }, 760);
  });

  function triggerLoop() {
    if (looping || !launched || currentTab() !== "home") return;
    looping = true;
    var loopTerminal = document.createElement("div");
    loopTerminal.className = "loop-terminal terminal";
    loopTerminal.style.background = "var(--blue)";
    var title = document.createElement("div");
    title.className = "terminal-titlebar";
    title.innerHTML = '<span class="terminal-dot red"></span><span class="terminal-dot yellow"></span><span class="terminal-dot green"></span><span class="terminal-title">akagavin@universe ~ zsh</span>';
    var lines = document.createElement("div");
    loopTerminal.append(title, lines);
    exitScreen.appendChild(loopTerminal);

    var completed = false;
    var loopTimers = [];
    var delay = 0;
    data.terminal.forEach(function (item) {
      var row = renderTerminalLine(item, lines);
      delay += item.type === "cmd" ? 260 : item.type === "blank" ? 70 : 150;
      loopTimers.push(window.setTimeout(function () {
        row.classList.add("visible");
      }, reducedMotion ? 0 : delay));
    });

    function finishLoopTyping() {
      completed = true;
      var hint = document.createElement("div");
      hint.className = "term-line visible";
      hint.style.marginTop = "12px";
      hint.style.textAlign = "center";
      hint.textContent = "press enter to launch";
      lines.appendChild(hint);
    }
    loopTimers.push(window.setTimeout(finishLoopTyping, reducedMotion ? 20 : delay + 320));

    function skipLoop() {
      loopTimers.forEach(window.clearTimeout);
      lines.querySelectorAll(".term-line").forEach(function (row) {
        row.classList.add("visible");
      });
      if (!completed) finishLoopTyping();
    }

    function loopLaunch() {
      if (!completed) {
        skipLoop();
        return;
      }
      var launchLine = renderTerminalLine({ type: "output", prefix: "> ", text: "launching..." }, lines);
      launchLine.classList.add("visible");
      transitionOverlay.classList.add("active");
      window.setTimeout(function () {
        loopTerminal.remove();
        window.scrollTo(0, 0);
        transitionOverlay.classList.remove("active");
        looping = false;
        document.removeEventListener("keydown", onLoopKey);
        exitScreen.removeEventListener("click", onLoopClick);
        announce("已回到 AkaGavin OS 桌面");
      }, reducedMotion ? 30 : 520);
    }

    function onLoopKey(event) {
      if (event.key === "Enter") loopLaunch();
      else if (!completed) skipLoop();
    }

    function onLoopClick() {
      if (!completed) skipLoop();
      else loopLaunch();
    }

    document.addEventListener("keydown", onLoopKey);
    exitScreen.addEventListener("click", onLoopClick);
  }

  backToTopButton.addEventListener("click", triggerLoop);
  document.addEventListener("wheel", function (event) {
    if (event.deltaY <= 0 || looping || currentTab() !== "home") return;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= maxScroll - 4) triggerLoop();
  }, { passive: true });

  window.addEventListener("resize", function () {
    data.desktopIcons.forEach(function (item, index) {
      var icon = iconLayer.children[index];
      if (icon && icon.style.right !== "auto") positionDesktopIcon(icon, item);
    });
  });

  renderWorks();
  renderDesktopIcons();
  buildWallpaperStars();
  buildTerminalIntro();
  switchTab(currentTab());
})();
