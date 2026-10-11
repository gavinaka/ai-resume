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
  var nodes = new Map();
  var lineElements = [];
  var renderFrame = 0;
  var connectionFrame = 0;
  var selectedId = null;
  var pan = null;
  var drag = null;
  var pointers = new Map();
  var pinch = null;
  var camera = { x: 0, y: 0, scale: 0.62 };

  function createNode(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function evidenceCount(projectId) {
    return (atlas.projectEvidence[projectId] || []).length;
  }

  function buildNodeDefinitions() {
    var definitions = [
      { id: "portrait", kind: "portrait", x: 90, y: 590, title: "AkaGavin", label: "IDENTITY STILL", summary: "公开肖像。人物不是装饰，而是整套证据系统的责任主体。" },
      { id: "identity", kind: "identity", x: 510, y: 650, title: "AkaGavin", label: "PUBLIC IDENTITY", summary: "系统经营者与决策系统实践者。用现实约束校验判断，用工程方法固化可复用流程。" },
      { id: "principles", kind: "principle", x: 1040, y: 240, title: "12 条决策原则", label: "DECISION DOCTRINE", summary: "把不确定性、风险边界、只读权限和验证要求写成压力下仍然有效的协议。" },
      { id: "timeline", kind: "default", x: 1030, y: 680, title: "5 个形成阶段", label: "EXPERIENCE ARC", summary: "从现实反馈、经营责任、市场系统到 Agent 工程与公开 OS。" },
      { id: "operate", kind: "cluster", x: 500, y: 1210, title: "经营与增长", label: "OPERATE & GROW", summary: "城市经营、客户约束、执行节奏、现金流与结构复盘。" },
      { id: "decide", kind: "cluster", x: 1040, y: 1210, title: "研究与决策", label: "RESEARCH & DECIDE", summary: "来源、事实、假设、情景、置信度、风险门禁与样本验证。" },
      { id: "govern", kind: "cluster", x: 1580, y: 1210, title: "构建与治理", label: "BUILD & GOVERN", summary: "职责、真相源、只读边界、状态机、失败关闭与回滚验证。" }
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
        summary: project.summary,
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
      var card = createNode("article", "evidence-node type-" + definition.kind);
      card.tabIndex = 0;
      card.dataset.nodeId = definition.id;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "查看 " + definition.title + " 档案");

      if (definition.kind === "portrait") {
        var image = document.createElement("img");
        image.src = "assets/akagavin-portrait.jpg";
        image.alt = "AkaGavin 人像";
        image.draggable = false;
        var portraitLabel = createNode("div", "portrait-label");
        portraitLabel.append(createNode("span", "", "AG / STILL 02"), createNode("span", "", "PUBLIC"));
        card.append(image, portraitLabel);
      } else {
        var top = createNode("div", "node-topline");
        top.append(
          createNode("b", "", String(index + 1).padStart(2, "0")),
          createNode("span", "", definition.label)
        );
        var footer = createNode("div", "node-footer");
        footer.append(
          createNode("span", "", definition.projectId ? "EVIDENCE" : "RELATIONS"),
          createNode("strong", "", definition.projectId ? String(evidenceCount(definition.projectId)).padStart(2, "0") : "OPEN")
        );
        card.append(top, createNode("h2", "", definition.title), createNode("p", "", definition.summary), footer);
      }

      definition.element = card;
      definition.width = definition.kind === "identity" ? 380 : definition.kind === "portrait" ? 330 : 300;
      definition.height = definition.kind === "portrait" ? 430 : definition.kind === "identity" ? 260 : 220;
      nodes.set(definition.id, definition);
      positionNode(definition);
      nodeLayer.appendChild(card);
      card.addEventListener("pointerdown", beginNodeDrag);
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectNode(definition.id);
        }
      });
    });
    document.getElementById("nodeCount").textContent = String(nodes.size).padStart(2, "0");
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
      scheduleCameraRender();
      return;
    }
    var fit = Math.min(width / 2440, height / 1640) * 0.94;
    camera.scale = clampScale(fit);
    camera.x = (width - WORLD_WIDTH * camera.scale) / 2;
    camera.y = (height - WORLD_HEIGHT * camera.scale) / 2;
    scheduleCameraRender();
  }

  function beginNodeDrag(event) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.stopPropagation();
    var card = event.currentTarget;
    var node = nodes.get(card.dataset.nodeId);
    drag = {
      pointerId: event.pointerId,
      node: node,
      startX: event.clientX,
      startY: event.clientY,
      nodeX: node.x,
      nodeY: node.y,
      moved: false
    };
    card.setPointerCapture(event.pointerId);
    card.classList.add("is-dragging");
    viewport.classList.add("is-dragging");
  }

  function moveNodeDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    var dx = (event.clientX - drag.startX) / camera.scale;
    var dy = (event.clientY - drag.startY) / camera.scale;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    drag.node.x = Math.max(0, Math.min(WORLD_WIDTH - drag.node.width, drag.nodeX + dx));
    drag.node.y = Math.max(0, Math.min(WORLD_HEIGHT - drag.node.height, drag.nodeY + dy));
    positionNode(drag.node);
    scheduleConnections();
  }

  function endNodeDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    var node = drag.node;
    var moved = drag.moved;
    node.element.classList.remove("is-dragging");
    viewport.classList.remove("is-dragging");
    drag = null;
    if (!moved) selectNode(node.id);
  }

  function beginPan(event) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      pan = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, cameraX: camera.x, cameraY: camera.y };
      viewport.classList.add("is-panning");
    } else if (pointers.size === 2) {
      var points = Array.from(pointers.values());
      pinch = {
        distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
        scale: camera.scale,
        centerX: (points[0].x + points[1].x) / 2,
        centerY: (points[0].y + points[1].y) / 2
      };
      pan = null;
    }
  }

  function movePan(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinch) {
      var points = Array.from(pointers.values());
      var distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      var centerX = (points[0].x + points[1].x) / 2;
      var centerY = (points[0].y + points[1].y) / 2;
      zoomAt(centerX, centerY, pinch.scale * (distance / Math.max(pinch.distance, 1)));
      return;
    }
    if (pan && pan.pointerId === event.pointerId) {
      camera.x = pan.cameraX + event.clientX - pan.startX;
      camera.y = pan.cameraY + event.clientY - pan.startY;
      scheduleCameraRender();
    }
  }

  function endPan(event) {
    pointers.delete(event.pointerId);
    if (pan && pan.pointerId === event.pointerId) pan = null;
    if (pointers.size < 2) pinch = null;
    viewport.classList.toggle("is-panning", pointers.size > 0);
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
    var related = relatedIds(id);
    nodes.forEach(function (node, nodeId) {
      node.element.classList.toggle("is-selected", nodeId === id);
      node.element.classList.toggle("is-muted", !related.has(nodeId));
    });
    lineElements.forEach(function (line) {
      var isRelated = line.dataset.from === id || line.dataset.to === id;
      line.classList.toggle("is-related", isRelated);
      line.classList.toggle("is-muted", !isRelated);
    });
    renderInspector(nodes.get(id));
    inspector.classList.add("is-open");
  }

  function clearSelection() {
    selectedId = null;
    nodes.forEach(function (node) {
      node.element.classList.remove("is-selected", "is-muted");
    });
    lineElements.forEach(function (line) {
      line.classList.remove("is-related", "is-muted");
    });
    inspector.classList.remove("is-open");
  }

  function renderInspector(node) {
    inspectorContent.textContent = "";
    inspectorContent.append(
      createNode("p", "inspector-kicker", node.label + " / " + node.id.toUpperCase()),
      createNode("h2", "", node.title),
      createNode("p", "inspector-summary", node.summary)
    );

    var stats = createNode("div", "inspector-stats");
    var list = createNode("ul", "inspector-list");
    var link = null;

    if (node.projectId) {
      var project = siteData.projects[node.projectId];
      var projectEvidence = atlas.projectEvidence[node.projectId] || [];
      [[projectEvidence.length, "EVIDENCE"], [project.proves.length, "PROOF CLAIMS"]].forEach(function (item) {
        var stat = createNode("div", "inspector-stat");
        stat.append(createNode("strong", "", String(item[0]).padStart(2, "0")), createNode("span", "", item[1]));
        stats.appendChild(stat);
      });
      project.proves.concat(project.principles).forEach(function (item) { list.appendChild(createNode("li", "", item)); });
      link = createNode("a", "inspector-link");
      link.href = "pages/project.html?id=" + encodeURIComponent(node.projectId);
      link.target = "_top";
      link.append(createNode("span", "", "OPEN FULL DOSSIER"), createNode("span", "", "↗"));
    } else if (node.id === "principles") {
      [[atlas.principles.length, "PRINCIPLES"], [new Set(atlas.principles.flatMap(function (p) { return p.evidenceRefs; })).size, "EVIDENCE LINKS"]].forEach(function (item) {
        var stat = createNode("div", "inspector-stat");
        stat.append(createNode("strong", "", String(item[0]).padStart(2, "0")), createNode("span", "", item[1]));
        stats.appendChild(stat);
      });
      atlas.principles.slice(0, 6).forEach(function (principle) { list.appendChild(createNode("li", "", principle.label + "：" + principle.rule)); });
    } else if (["operate", "decide", "govern"].includes(node.id)) {
      var clusterMap = { operate: "OPERATE & GROW", decide: "RESEARCH & DECIDE", govern: "BUILD & GOVERN" };
      var capabilities = atlas.capabilities.filter(function (item) { return item.cluster === clusterMap[node.id]; });
      var stat = createNode("div", "inspector-stat");
      stat.append(createNode("strong", "", String(capabilities.length).padStart(2, "0")), createNode("span", "", "CAPABILITIES"));
      stats.appendChild(stat);
      capabilities.forEach(function (capability) { list.appendChild(createNode("li", "", capability.label + "：" + capability.definition)); });
    } else if (node.id === "timeline") {
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

  viewport.addEventListener("pointerdown", beginPan);
  viewport.addEventListener("pointermove", function (event) {
    if (drag) moveNodeDrag(event);
    else movePan(event);
  });
  viewport.addEventListener("pointerup", function (event) {
    if (drag) endNodeDrag(event);
    endPan(event);
  });
  viewport.addEventListener("pointercancel", function (event) {
    if (drag) endNodeDrag(event);
    endPan(event);
  });
  viewport.addEventListener("wheel", function (event) {
    event.preventDefault();
    var factor = Math.exp(-event.deltaY * 0.0012);
    zoomAt(event.clientX, event.clientY, camera.scale * factor);
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
  document.getElementById("inspectorClose").addEventListener("click", clearSelection);
  document.getElementById("roomHelp").addEventListener("click", function (event) {
    var panel = document.getElementById("roomHelpPanel");
    var expanded = event.currentTarget.getAttribute("aria-pressed") === "true";
    event.currentTarget.setAttribute("aria-pressed", String(!expanded));
    panel.hidden = expanded;
  });
  window.addEventListener("resize", resetView, { passive: true });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") clearSelection();
    if (event.key === "0") resetView();
  });

  renderNodes();
  renderConnections();
  resetView();
})();
