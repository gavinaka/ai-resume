(function () {
  "use strict";

  var siteData = window.SITE_DATA;
  var atlas = window.EVIDENCE_ATLAS;
  if (!siteData || !atlas) return;

  var WORLD_WIDTH = 2600;
  var WORLD_HEIGHT = 1800;
  var viewport = document.getElementById("roomViewport");
  var world = document.getElementById("roomWorld");
  var grid = viewport.querySelector(".room-grid");
  var nodeLayer = document.getElementById("nodeLayer");
  var connectionLayer = document.getElementById("connectionLayer");
  var inspector = document.getElementById("evidenceInspector");
  var inspectorContent = document.getElementById("inspectorContent");
  var cameraOutput = document.getElementById("cameraOutput");
  var zoomOutput = document.getElementById("zoomOutput");
  var statusOutput = document.createElement("span");
  var nodes = new Map();
  var lineElements = [];
  var pointers = new Map();
  var interaction = { mode: "idle" };
  var camera = { x: 0, y: 0, scale: 0.62 };
  var lastViewport = { width: 0, height: 0 };
  var selectedId = null;
  var previousFocus = null;
  var renderFrame = 0;
  var connectionFrame = 0;
  var resizeFrame = 0;
  var embedded = window.self !== window.top;
  var nodeSizeObserver = "ResizeObserver" in window ? new ResizeObserver(function () {
    refreshNodeMetrics();
  }) : null;

  statusOutput.className = "sr-only";
  statusOutput.setAttribute("aria-live", "polite");
  document.body.appendChild(statusOutput);

  function createNode(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function announce(message) {
    statusOutput.textContent = "";
    requestAnimationFrame(function () { statusOutput.textContent = message; });
  }

  function evidenceCount(projectId) {
    return (atlas.projectEvidence[projectId] || []).length;
  }

  function buildNodeDefinitions() {
    var definitions = [
      { id: "portrait", kind: "portrait", x: 90, y: 590, title: "AkaGavin", label: "IDENTITY STILL", summary: "公开肖像。人物是整套证据系统的责任主体。" },
      { id: "identity", kind: "identity", x: 510, y: 650, title: "AkaGavin", label: "PUBLIC IDENTITY", summary: "系统经营者与决策系统实践者。用现实约束校验判断，用工程方法固定可复用流程。" },
      { id: "principles", kind: "principle", x: 1040, y: 240, title: "12 条决策原则", label: "DECISION DOCTRINE", summary: "压力环境中的动作协议：前提、权限、风险、验证与回滚。" },
      { id: "timeline", kind: "default", x: 1030, y: 680, title: "5 个形成阶段", label: "EXPERIENCE ARC", summary: "现实反馈、经营责任、市场系统、Agent 工程与公开表达。" },
      { id: "operate", kind: "cluster", x: 500, y: 1210, title: "经营与增长", label: "OPERATE & GROW", summary: "客户约束、执行节奏、现金流排序与结构复盘。" },
      { id: "decide", kind: "cluster", x: 1040, y: 1210, title: "研究与决策", label: "RESEARCH & DECIDE", summary: "来源、假设、反证、置信度、风险门禁与样本验证。" },
      { id: "govern", kind: "cluster", x: 1580, y: 1210, title: "构建与治理", label: "BUILD & GOVERN", summary: "职责、真相源、状态机、失败关闭与恢复路径。" }
    ];

    var projectPositions = {
      "akagavin-hub": [500, 240],
      "research-ledger": [80, 170],
      "b2b-operator": [80, 1210],
      "trading-system": [1510, 180],
      "human-layer": [1510, 680],
      "technical-expert": [1970, 450],
      "agent-health": [2260, 140],
      "event-alert": [2260, 640],
      "visual-workflow": [1970, 900],
      "decision-interface": [2260, 1120],
      "personal-os": [1900, 1450]
    };

    Object.keys(projectPositions).forEach(function (projectId) {
      var project = siteData.projects[projectId];
      var position = projectPositions[projectId];
      definitions.push({
        id: projectId,
        kind: "project",
        x: position[0],
        y: position[1],
        title: project.title,
        label: "PUBLIC DOSSIER",
        summary: project.canvasLine,
        inspectorSummary: project.summary,
        projectId: projectId
      });
    });
    return definitions;
  }

  var connections = [
    ["portrait", "identity"], ["identity", "principles"], ["identity", "timeline"],
    ["identity", "akagavin-hub"], ["identity", "human-layer"], ["identity", "operate"],
    ["identity", "decide"], ["identity", "govern"], ["operate", "b2b-operator"],
    ["decide", "research-ledger"], ["decide", "trading-system"], ["govern", "technical-expert"],
    ["principles", "trading-system"], ["principles", "technical-expert"], ["principles", "human-layer"],
    ["technical-expert", "agent-health"], ["technical-expert", "event-alert"],
    ["technical-expert", "visual-workflow"], ["visual-workflow", "decision-interface"],
    ["agent-health", "decision-interface"], ["operate", "personal-os"],
    ["decide", "personal-os"], ["govern", "personal-os"]
  ];

  function renderNodes() {
    buildNodeDefinitions().forEach(function (definition, index) {
      var card = createNode("div", "evidence-node type-" + definition.kind);
      card.tabIndex = 0;
      card.dataset.nodeId = definition.id;
      card.setAttribute("role", "button");
      card.setAttribute("aria-controls", "evidenceInspector");
      card.setAttribute("aria-expanded", "false");

      if (definition.kind === "portrait") {
        var image = document.createElement("img");
        image.src = "assets/akagavin-portrait.jpg";
        image.fetchPriority = "high";
        image.alt = "AkaGavin 人像";
        image.draggable = false;
        var portraitLabel = createNode("div", "portrait-label");
        portraitLabel.append(createNode("span", "", "AG / STILL 02"), createNode("span", "", "PUBLIC"));
        card.append(image, portraitLabel);
      } else {
        var top = createNode("div", "node-topline");
        top.append(createNode("b", "", String(index + 1).padStart(2, "0")), createNode("span", "", definition.label));
        var footer = createNode("div", "node-footer");
        footer.append(
          createNode("span", "", definition.projectId ? "EVIDENCE" : "RELATIONS"),
          createNode("strong", "", definition.projectId ? String(evidenceCount(definition.projectId)).padStart(2, "0") : "OPEN")
        );
        card.append(top, createNode("h2", "", definition.title), createNode("p", "", definition.summary), footer);
      }

      definition.element = card;
      definition.width = 300;
      definition.height = 220;
      nodes.set(definition.id, definition);
      positionNode(definition);
      nodeLayer.appendChild(card);
      if (nodeSizeObserver) nodeSizeObserver.observe(card);
      card.addEventListener("pointerdown", beginNodePointer);
      card.addEventListener("keydown", handleNodeKeydown);
    });

    refreshNodeMetrics();
    document.getElementById("nodeCount").textContent = String(nodes.size).padStart(2, "0");
  }

  function refreshNodeMetrics() {
    nodes.forEach(function (definition) {
      definition.width = definition.element.offsetWidth;
      definition.height = definition.element.offsetHeight;
    });
    scheduleConnections();
  }

  function positionNode(node) {
    node.element.style.transform = "translate3d(" + node.x + "px," + node.y + "px,0)";
  }

  function renderConnections() {
    connectionLayer.textContent = "";
    lineElements = connections.map(function (pair) {
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.classList.add("connection-line");
      path.dataset.from = pair[0];
      path.dataset.to = pair[1];
      connectionLayer.appendChild(path);
      return path;
    });
    updateConnections();
  }

  function updateConnections() {
    lineElements.forEach(function (path) {
      var from = nodes.get(path.dataset.from);
      var to = nodes.get(path.dataset.to);
      var x1 = from.x + from.width / 2;
      var y1 = from.y + from.height / 2;
      var x2 = to.x + to.width / 2;
      var y2 = to.y + to.height / 2;
      var curve = Math.max(80, Math.abs(x2 - x1) * 0.42);
      var control1 = x1 + (x2 >= x1 ? curve : -curve);
      var control2 = x2 - (x2 >= x1 ? curve : -curve);
      path.setAttribute("d", "M " + x1 + " " + y1 + " C " + control1 + " " + y1 + ", " + control2 + " " + y2 + ", " + x2 + " " + y2);
    });
    connectionFrame = 0;
  }

  function scheduleConnections() {
    if (!connectionFrame) connectionFrame = requestAnimationFrame(updateConnections);
  }

  function scheduleCameraRender() {
    if (renderFrame) return;
    renderFrame = requestAnimationFrame(function () {
      world.style.transform = "translate3d(" + camera.x + "px," + camera.y + "px,0) scale(" + camera.scale + ")";
      grid.style.backgroundPosition = camera.x + "px " + camera.y + "px";
      grid.style.backgroundSize = 38 * camera.scale + "px " + 38 * camera.scale + "px";
      zoomOutput.textContent = Math.round(camera.scale * 100) + "%";
      cameraOutput.textContent = "X " + String(Math.round(-camera.x / camera.scale)).padStart(4, "0") + " / Y " + String(Math.round(-camera.y / camera.scale)).padStart(4, "0");
      renderFrame = 0;
    });
  }

  function clampScale(value) {
    return Math.min(1.35, Math.max(0.3, value));
  }

  function zoomAt(clientX, clientY, nextScale) {
    var rect = viewport.getBoundingClientRect();
    var localX = clientX - rect.left;
    var localY = clientY - rect.top;
    var worldX = (localX - camera.x) / camera.scale;
    var worldY = (localY - camera.y) / camera.scale;
    camera.scale = clampScale(nextScale);
    camera.x = localX - worldX * camera.scale;
    camera.y = localY - worldY * camera.scale;
    scheduleCameraRender();
  }

  function resetView() {
    var width = viewport.clientWidth;
    var height = viewport.clientHeight;
    if (width < 760) {
      camera.scale = 0.55;
      camera.x = width / 2 - 700 * camera.scale;
      camera.y = height / 2 - 780 * camera.scale;
    } else if (embedded) {
      camera.scale = clampScale(Math.min(0.66, width / 1900, height / 1200));
      camera.x = width / 2 - 1120 * camera.scale;
      camera.y = height / 2 - 820 * camera.scale;
    } else {
      camera.scale = clampScale(Math.min(width / 2440, height / 1640) * 0.94);
      camera.x = (width - WORLD_WIDTH * camera.scale) / 2;
      camera.y = (height - WORLD_HEIGHT * camera.scale) / 2;
    }
    lastViewport = { width: width, height: height };
    scheduleCameraRender();
    announce("镜头已重置");
  }

  function preserveCameraOnResize() {
    var width = viewport.clientWidth;
    var height = viewport.clientHeight;
    if (!lastViewport.width || !lastViewport.height) {
      resetView();
      return;
    }
    var worldCenterX = (lastViewport.width / 2 - camera.x) / camera.scale;
    var worldCenterY = (lastViewport.height / 2 - camera.y) / camera.scale;
    camera.x = width / 2 - worldCenterX * camera.scale;
    camera.y = height / 2 - worldCenterY * camera.scale;
    lastViewport = { width: width, height: height };
    scheduleCameraRender();
  }

  function scheduleResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(function () {
      preserveCameraOnResize();
      resizeFrame = 0;
    });
  }

  function setViewportMode(mode) {
    viewport.classList.toggle("is-panning", mode === "pan" || mode === "pinch");
    viewport.classList.toggle("is-dragging", mode === "drag");
  }

  function cancelDragVisual() {
    if (interaction.mode === "drag" && interaction.node) {
      interaction.node.element.classList.remove("is-dragging");
    }
  }

  function startPinch() {
    if (pointers.size < 2) return;
    cancelDragVisual();
    var points = Array.from(pointers.values()).slice(0, 2);
    var centerX = (points[0].x + points[1].x) / 2;
    var centerY = (points[0].y + points[1].y) / 2;
    var rect = viewport.getBoundingClientRect();
    var localX = centerX - rect.left;
    var localY = centerY - rect.top;
    interaction = {
      mode: "pinch",
      distance: Math.max(1, Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)),
      scale: camera.scale,
      worldX: (localX - camera.x) / camera.scale,
      worldY: (localY - camera.y) / camera.scale
    };
    setViewportMode("pinch");
  }

  function beginNodePointer(event) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.stopPropagation();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      startPinch();
      return;
    }
    var card = event.currentTarget;
    var definition = nodes.get(card.dataset.nodeId);
    interaction = {
      mode: "drag",
      pointerId: event.pointerId,
      node: definition,
      startX: event.clientX,
      startY: event.clientY,
      nodeX: definition.x,
      nodeY: definition.y,
      moved: false
    };
    card.setPointerCapture(event.pointerId);
    card.classList.add("is-dragging");
    setViewportMode("drag");
  }

  function beginViewportPointer(event) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    if (pointers.size >= 2) {
      startPinch();
      return;
    }
    interaction = {
      mode: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cameraX: camera.x,
      cameraY: camera.y
    };
    setViewportMode("pan");
  }

  function movePointer(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (interaction.mode === "pinch" && pointers.size >= 2) {
      var points = Array.from(pointers.values()).slice(0, 2);
      var distance = Math.max(1, Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y));
      var centerX = (points[0].x + points[1].x) / 2;
      var centerY = (points[0].y + points[1].y) / 2;
      var rect = viewport.getBoundingClientRect();
      var localX = centerX - rect.left;
      var localY = centerY - rect.top;
      camera.scale = clampScale(interaction.scale * (distance / interaction.distance));
      camera.x = localX - interaction.worldX * camera.scale;
      camera.y = localY - interaction.worldY * camera.scale;
      scheduleCameraRender();
      return;
    }

    if (interaction.mode === "drag" && interaction.pointerId === event.pointerId) {
      var dx = (event.clientX - interaction.startX) / camera.scale;
      var dy = (event.clientY - interaction.startY) / camera.scale;
      if (Math.abs(dx) + Math.abs(dy) > 4) interaction.moved = true;
      interaction.node.x = Math.max(0, Math.min(WORLD_WIDTH - interaction.node.width, interaction.nodeX + dx));
      interaction.node.y = Math.max(0, Math.min(WORLD_HEIGHT - interaction.node.height, interaction.nodeY + dy));
      positionNode(interaction.node);
      scheduleConnections();
      return;
    }

    if (interaction.mode === "pan" && interaction.pointerId === event.pointerId) {
      camera.x = interaction.cameraX + event.clientX - interaction.startX;
      camera.y = interaction.cameraY + event.clientY - interaction.startY;
      scheduleCameraRender();
    }
  }

  function finishPointer(event, canceled) {
    pointers.delete(event.pointerId);

    if (interaction.mode === "drag" && interaction.pointerId === event.pointerId) {
      var selectedNode = interaction.node;
      var shouldSelect = !canceled && !interaction.moved;
      selectedNode.element.classList.remove("is-dragging");
      interaction = { mode: "idle" };
      setViewportMode("idle");
      if (shouldSelect) selectNode(selectedNode.id);
      return;
    }

    if (interaction.mode === "pan" && interaction.pointerId === event.pointerId) {
      interaction = { mode: "idle" };
      setViewportMode("idle");
      return;
    }

    if (interaction.mode === "pinch" && pointers.size < 2) {
      interaction = { mode: "idle" };
      setViewportMode("idle");
    }
  }

  function handleNodeKeydown(event) {
    var definition = nodes.get(event.currentTarget.dataset.nodeId);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(definition.id);
      return;
    }
    var delta = event.shiftKey ? 60 : 20;
    var moved = true;
    if (event.key === "ArrowLeft") definition.x -= delta;
    else if (event.key === "ArrowRight") definition.x += delta;
    else if (event.key === "ArrowUp") definition.y -= delta;
    else if (event.key === "ArrowDown") definition.y += delta;
    else moved = false;
    if (!moved) return;
    event.preventDefault();
    definition.x = Math.max(0, Math.min(WORLD_WIDTH - definition.width, definition.x));
    definition.y = Math.max(0, Math.min(WORLD_HEIGHT - definition.height, definition.y));
    positionNode(definition);
    scheduleConnections();
    announce(definition.title + " 已移动");
  }

  function relatedIds(id) {
    var related = new Set([id]);
    connections.forEach(function (pair) {
      if (pair[0] === id) related.add(pair[1]);
      if (pair[1] === id) related.add(pair[0]);
    });
    return related;
  }

  function selectNode(id) {
    selectedId = id;
    var selectedNode = nodes.get(id);
    var related = relatedIds(id);
    previousFocus = selectedNode.element;
    nodes.forEach(function (definition, nodeId) {
      var active = nodeId === id;
      definition.element.classList.toggle("is-selected", active);
      definition.element.classList.toggle("is-muted", !related.has(nodeId));
      definition.element.setAttribute("aria-expanded", String(active));
    });
    lineElements.forEach(function (line) {
      var active = line.dataset.from === id || line.dataset.to === id;
      line.classList.toggle("is-related", active);
      line.classList.toggle("is-muted", !active);
    });
    renderInspector(selectedNode);
    inspector.classList.add("is-open");
    inspector.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () { inspector.focus({ preventScroll: true }); });
  }

  function clearSelection(restoreFocus) {
    selectedId = null;
    nodes.forEach(function (definition) {
      definition.element.classList.remove("is-selected", "is-muted");
      definition.element.setAttribute("aria-expanded", "false");
    });
    lineElements.forEach(function (line) { line.classList.remove("is-related", "is-muted"); });
    inspector.classList.remove("is-open");
    inspector.setAttribute("aria-hidden", "true");
    if (restoreFocus && previousFocus && document.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
  }

  function renderInspector(definition) {
    inspectorContent.textContent = "";
    inspectorContent.append(
      createNode("p", "inspector-kicker", definition.label + " / " + definition.id.toUpperCase()),
      createNode("h2", "", definition.title),
      createNode("p", "inspector-summary", definition.inspectorSummary || definition.summary)
    );

    var stats = createNode("div", "inspector-stats");
    var list = createNode("ul", "inspector-list");
    var link = null;

    if (definition.projectId) {
      var project = siteData.projects[definition.projectId];
      var projectEvidence = atlas.projectEvidence[definition.projectId] || [];
      [[projectEvidence.length, "EVIDENCE"], [project.protocol.sequence.length, "OPERATING STEPS"]].forEach(function (item) {
        var stat = createNode("div", "inspector-stat");
        stat.append(createNode("strong", "", String(item[0]).padStart(2, "0")), createNode("span", "", item[1]));
        stats.appendChild(stat);
      });
      [
        "启动：" + project.protocol.trigger,
        "停止：" + project.protocol.stop[0],
        "取舍：" + project.protocol.tradeoff
      ].forEach(function (item) { list.appendChild(createNode("li", "", item)); });
      link = createNode("a", "inspector-link");
      link.href = "pages/project.html?id=" + encodeURIComponent(definition.projectId);
      link.target = "_top";
      link.append(createNode("span", "", "OPEN FULL DOSSIER"), createNode("span", "", "↗"));
    } else if (definition.id === "principles") {
      [[atlas.principles.length, "PRINCIPLES"], [new Set(atlas.principles.flatMap(function (principle) { return principle.evidenceRefs; })).size, "EVIDENCE LINKS"]].forEach(function (item) {
        var stat = createNode("div", "inspector-stat");
        stat.append(createNode("strong", "", String(item[0]).padStart(2, "0")), createNode("span", "", item[1]));
        stats.appendChild(stat);
      });
      atlas.principles.slice(0, 6).forEach(function (principle) { list.appendChild(createNode("li", "", principle.label + "：" + principle.rule)); });
    } else if (["operate", "decide", "govern"].includes(definition.id)) {
      var clusterMap = { operate: "OPERATE & GROW", decide: "RESEARCH & DECIDE", govern: "BUILD & GOVERN" };
      var capabilities = atlas.capabilities.filter(function (item) { return item.cluster === clusterMap[definition.id]; });
      var clusterStat = createNode("div", "inspector-stat");
      clusterStat.append(createNode("strong", "", String(capabilities.length).padStart(2, "0")), createNode("span", "", "CAPABILITIES"));
      stats.appendChild(clusterStat);
      capabilities.forEach(function (capability) { list.appendChild(createNode("li", "", capability.label + "：" + capability.definition)); });
    } else if (definition.id === "timeline") {
      var timelineStat = createNode("div", "inspector-stat");
      timelineStat.append(createNode("strong", "", String(atlas.stages.length).padStart(2, "0")), createNode("span", "", "STAGES"));
      stats.appendChild(timelineStat);
      atlas.stages.forEach(function (stage) { list.appendChild(createNode("li", "", stage.period + " / " + stage.label + "：" + stage.thesis)); });
    } else {
      var identityStat = createNode("div", "inspector-stat");
      identityStat.append(createNode("strong", "", "42"), createNode("span", "", "PUBLIC RECORDS"));
      stats.appendChild(identityStat);
      siteData.profile.facts.slice(0, 5).forEach(function (fact) { list.appendChild(createNode("li", "", fact[0] + "：" + fact[1])); });
    }

    inspectorContent.append(stats, list);
    if (link) inspectorContent.appendChild(link);
  }

  viewport.addEventListener("pointerdown", beginViewportPointer);
  viewport.addEventListener("pointermove", movePointer);
  viewport.addEventListener("pointerup", function (event) { finishPointer(event, false); });
  viewport.addEventListener("pointercancel", function (event) { finishPointer(event, true); });
  viewport.addEventListener("wheel", function (event) {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, camera.scale * Math.exp(-event.deltaY * 0.0012));
  }, { passive: false });

  document.getElementById("zoomIn").addEventListener("click", function () {
    var rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, camera.scale * 1.18);
  });
  document.getElementById("zoomOut").addEventListener("click", function () {
    var rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, camera.scale / 1.18);
  });
  document.getElementById("resetView").addEventListener("click", resetView);
  document.getElementById("inspectorClose").addEventListener("click", function () { clearSelection(true); });
  document.getElementById("roomHelp").addEventListener("click", function (event) {
    var panel = document.getElementById("roomHelpPanel");
    var expanded = event.currentTarget.getAttribute("aria-pressed") === "true";
    event.currentTarget.setAttribute("aria-pressed", String(!expanded));
    panel.hidden = expanded;
  });

  window.addEventListener("resize", scheduleResize, { passive: true });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && selectedId) {
      event.preventDefault();
      clearSelection(true);
      return;
    }
    if (event.target.closest(".evidence-node")) return;
    var rect = viewport.getBoundingClientRect();
    if (event.key === "0") {
      event.preventDefault();
      resetView();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, camera.scale * 1.15);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, camera.scale / 1.15);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault(); camera.x += 80; scheduleCameraRender();
    } else if (event.key === "ArrowRight") {
      event.preventDefault(); camera.x -= 80; scheduleCameraRender();
    } else if (event.key === "ArrowUp") {
      event.preventDefault(); camera.y += 80; scheduleCameraRender();
    } else if (event.key === "ArrowDown") {
      event.preventDefault(); camera.y -= 80; scheduleCameraRender();
    }
  });

  renderNodes();
  renderConnections();
  resetView();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshNodeMetrics);
})();
