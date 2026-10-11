(function () {
  "use strict";

  var data = window.SITE_DATA;
  if (!data) return;

  var STORAGE_KEY = "akagavin_canvas_layout_v1";
  var WORLD_WIDTH = 3400;
  var WORLD_HEIGHT = 2100;
  var MIN_SCALE = 0.25;
  var MAX_SCALE = 1.8;
  var area = document.getElementById("canvasArea");
  var grid = area.querySelector(".canvas-grid");
  var transformNode = document.getElementById("canvasTransform");
  var cardsLayer = document.getElementById("cardsLayer");
  var connectionsSvg = document.getElementById("connectionsSvg");
  var layerList = document.getElementById("layerList");
  var minimap = document.getElementById("minimap");
  var minimapViewport = document.getElementById("minimapViewport");
  var zoomPct = document.getElementById("zoomPct");
  var connectButton = document.getElementById("connectModeBtn");
  var undoButton = document.getElementById("undoBtn");
  var undoCount = document.getElementById("undoCount");
  var templatePanel = document.getElementById("templatePanel");
  var imageInput = document.getElementById("imageInput");
  var toastNode = document.getElementById("canvasToast");
  var canvasApp = document.querySelector(".canvas-app");
  var layersToggle = document.getElementById("layersToggle");
  var layersBackdrop = document.getElementById("layersBackdrop");
  var view = { x: 18, y: 18, scale: 0.85 };
  var connections = data.canvas.connections.map(function (pair) { return pair.slice(); });
  var undoStack = [];
  var connectMode = false;
  var pendingImageZone = null;
  var selectedCardId = null;
  var toastTimer = null;

  function setLayersOpen(open) {
    var shouldOpen = Boolean(open) && window.matchMedia("(max-width: 767px)").matches;
    canvasApp.classList.toggle("layers-open", shouldOpen);
    layersToggle.setAttribute("aria-expanded", String(shouldOpen));
    layersToggle.title = shouldOpen ? "关闭图层" : "打开图层";
  }

  layersToggle.addEventListener("click", function () {
    setLayersOpen(!canvasApp.classList.contains("layers-open"));
  });

  layersBackdrop.addEventListener("click", function () {
    setLayersOpen(false);
  });

  var seedCards = [
    {
      id: "card-photo",
      label: "人物图",
      color: "blue",
      type: "image",
      x: 80,
      y: 160,
      width: 300,
      height: 430,
      classes: "image-card",
      html: '<img src="assets/akagavin-portrait.png" alt="AkaGavin 公开头像插画">'
    },
    {
      id: "card-profile",
      label: "个人信息",
      color: "yellow",
      type: "profile",
      x: 500,
      y: 180,
      width: 430,
      height: 390,
      html:
        '<div class="profile-layout">' +
          '<img src="assets/akagavin-portrait.png" alt="AkaGavin 公开头像插画">' +
          '<div><h2 data-editable>AkaGavin</h2><p class="profile-role" data-editable>B2B SaaS 经营者 / 决策系统实践者</p></div>' +
        '</div>' +
        '<p class="profile-principle" data-editable>把复杂问题转成可观察、可执行、可复盘的系统。</p>' +
        '<div class="tag-row"><span>Evidence first</span><span>Process first</span><span>Audit first</span></div>'
    },
    {
      id: "card-timeline",
      label: "经历时间线",
      color: "blue",
      type: "timeline",
      x: 1050,
      y: 160,
      width: 430,
      height: 500,
      html:
        '<h3 data-editable>经历时间线</h3>' +
        '<div class="timeline-list">' +
          '<div class="timeline-item"><span>长期</span><strong data-editable>本地经营与销售现场</strong><p data-editable>从真实客户预算、团队执行和现金流约束理解业务。</p></div>' +
          '<div class="timeline-item"><span>近年</span><strong data-editable>B2B SaaS 城市经营</strong><p data-editable>工作成为稳定现金流基座，也提供持续的现实校验。</p></div>' +
          '<div class="timeline-item"><span>当前</span><strong data-editable>决策系统与交易纪律</strong><p data-editable>先验证样本，再讨论规模；流程质量与结果分开评价。</p></div>' +
          '<div class="timeline-item"><span>现在</span><strong data-editable>多 Agent 工作流</strong><p data-editable>围绕真相源、只读边界、可审计交付持续构建。</p></div>' +
        '</div>'
    },
    {
      id: "card-narrative",
      label: "核心叙事",
      color: "yellow",
      type: "quote",
      x: 500,
      y: 690,
      width: 500,
      height: 300,
      classes: "quote-card",
      html:
        '<h3 data-editable>核心叙事</h3>' +
        '<blockquote data-editable>真正的个人竞争力，不是技能清单，而是把不确定问题拆成稳定系统的能力。</blockquote>' +
        '<div class="narrative-signature" data-editable>AkaGavin</div>'
    },
    {
      id: "card-skills",
      label: "能力地图",
      color: "blue",
      type: "skills",
      x: 1080,
      y: 980,
      width: 500,
      height: 260,
      html:
        '<h3 data-editable>能力地图</h3>' +
        '<div class="tag-row"><span>B2B SaaS</span><span>城市经营</span><span>销售系统</span><span>市场结构</span><span>交易纪律</span><span>Agent 治理</span><span>可视化报告</span><span>根因诊断</span></div>'
    },
    {
      id: "card-trading",
      label: "Trading-System",
      color: "pink",
      type: "project",
      x: 1660,
      y: 1030,
      width: 455,
      height: 330,
      classes: "project-card",
      html:
        '<small>MARKET SYSTEM</small><h2 data-editable>Trading-System</h2>' +
        '<p data-editable>把证据采集、风险门禁、正式分析、报告交付与复盘组织成可追溯工作流。</p>' +
        '<div class="project-facts"><span data-editable>规则先于观点</span><span data-editable>证据失败才允许重采</span><span data-editable>流程错误不能被结果洗白</span></div>'
    },
    {
      id: "card-technical",
      label: "Technical expert",
      color: "blue",
      type: "project",
      x: 1650,
      y: 260,
      width: 500,
      height: 350,
      classes: "project-card dark-card",
      html:
        '<small>AGENT ENGINEERING</small><h2 data-editable>Technical expert</h2>' +
        '<p data-editable>从诊断、方案取舍、审批、实现到验证，形成可以复用的技术问题闭环。</p>' +
        '<div class="project-facts"><span data-editable>先诊断后开方</span><span data-editable>修复根因，不隐藏症状</span><span data-editable>问题解决后沉淀为知识资产</span></div>'
    },
    {
      id: "card-principles",
      label: "决策原则",
      color: "blue",
      type: "project",
      x: 2220,
      y: 270,
      width: 430,
      height: 380,
      classes: "project-card",
      html:
        '<small>DECISION DOCTRINE</small><h2 data-editable>决策原则</h2>' +
        '<div class="project-facts"><span data-editable>事实、推断、假设、未知分层</span><span data-editable>看不懂就不做</span><span data-editable>先验证样本，再扩大规模</span><span data-editable>能计算的，不交给感觉</span><span data-editable>真实数据源默认只读</span></div>'
    },
    {
      id: "card-values",
      label: "价值观",
      color: "yellow",
      type: "values",
      x: 2730,
      y: 130,
      width: 370,
      height: 355,
      html:
        '<h3 data-editable>My Values</h3>' +
        '<div class="values-list"><p data-editable>正直、守信、不欺骗、不伤害他人</p><p data-editable>过程主权高于结果控制</p><p data-editable>自我批评服务于诊断和迭代</p><p data-editable>拒绝用确定语气掩盖未知</p></div>'
    },
    {
      id: "card-visual",
      label: "可视工作流",
      color: "yellow",
      type: "project",
      x: 2270,
      y: 930,
      width: 430,
      height: 300,
      classes: "project-card",
      html:
        '<small>VISUAL SYSTEM</small><h2 data-editable>Visual Workflow</h2>' +
        '<p data-editable>只消费最小状态元数据，用离线 HTML 报告呈现跨工作流变化。</p>' +
        '<div class="project-facts"><span data-editable>报告不是事实源</span><span data-editable>跨工作流默认只读</span></div>'
    },
    {
      id: "card-health",
      label: "健康监控",
      color: "blue",
      type: "project",
      x: 2780,
      y: 930,
      width: 390,
      height: 300,
      classes: "project-card",
      html:
        '<small>GOVERNANCE</small><h2 data-editable>Agent Health Monitor</h2>' +
        '<p data-editable>检查路径、编码、配置、运行探针、回滚证据和输出可用性。</p>' +
        '<div class="project-facts"><span data-editable>健康度不等于业务质量</span><span data-editable>监控器不直接修复源工作流</span></div>'
    },
    {
      id: "card-sticky-1",
      label: "便签：主权",
      color: "yellow",
      type: "sticky",
      x: 80,
      y: 720,
      width: 300,
      height: 190,
      classes: "sticky-card",
      html: '<div data-editable>过程主权<br>不是控制结果<br>而是控制决策质量</div>'
    },
    {
      id: "card-sticky-2",
      label: "便签：验证",
      color: "blue",
      type: "sticky",
      x: 2850,
      y: 560,
      width: 300,
      height: 190,
      classes: "sticky-card blue-sticky",
      html: '<div data-editable>先验证前提<br>再讨论结论<br>未知就保留未知</div>'
    }
  ];

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toastNode.textContent = message;
    toastNode.classList.add("visible");
    toastTimer = window.setTimeout(function () {
      toastNode.classList.remove("visible");
    }, 1800);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyTransform() {
    transformNode.style.transform =
      "translate3d(" + view.x + "px," + view.y + "px,0) scale(" + view.scale + ")";
    zoomPct.textContent = Math.round(view.scale * 100) + "%";
    var gridSize = 22 * view.scale;
    grid.style.backgroundSize = gridSize + "px " + gridSize + "px";
    grid.style.backgroundPosition = view.x % gridSize + "px " + view.y % gridSize + "px";
    updateMinimap();
  }

  function getCard(id) {
    return document.getElementById(id);
  }

  function getCardData(card) {
    return {
      id: card.id,
      label: card.dataset.label,
      color: card.dataset.color,
      type: card.dataset.type,
      x: card.offsetLeft,
      y: card.offsetTop,
      width: card.offsetWidth,
      height: card.offsetHeight,
      classes: Array.from(card.classList).filter(function (name) { return name !== "card" && name !== "selected" && name !== "connect-source" && name !== "hidden-card"; }).join(" "),
      hidden: card.classList.contains("hidden-card"),
      html: card.querySelector(".card-content").innerHTML
    };
  }

  function serializeState() {
    return {
      version: 1,
      view: { x: view.x, y: view.y, scale: view.scale },
      connections: connections.map(function (pair) { return pair.slice(); }),
      cards: Array.from(cardsLayer.querySelectorAll(".card")).map(getCardData)
    };
  }

  function pushUndo() {
    undoStack.push(JSON.stringify(serializeState()));
    if (undoStack.length > 30) undoStack.shift();
    updateUndoUI();
  }

  function updateUndoUI() {
    undoButton.disabled = undoStack.length === 0;
    undoCount.hidden = undoStack.length === 0;
    undoCount.textContent = String(undoStack.length);
  }

  function restoreState(state) {
    cardsLayer.innerHTML = "";
    layerList.innerHTML = "";
    connections = Array.isArray(state.connections) ? state.connections.map(function (pair) { return pair.slice(); }) : [];
    state.cards.forEach(function (definition) {
      createCard(definition, false);
    });
    view = {
      x: Number(state.view && state.view.x) || 0,
      y: Number(state.view && state.view.y) || 0,
      scale: clamp(Number(state.view && state.view.scale) || 0.85, MIN_SCALE, MAX_SCALE)
    };
    applyTransform();
    updateConnections();
    updateMinimapDots();
  }

  function performUndo() {
    if (!undoStack.length) return;
    var snapshot = undoStack.pop();
    try {
      restoreState(JSON.parse(snapshot));
      showToast("已撤销上一步操作");
    } catch (error) {
      showToast("撤销失败，快照无法读取");
    }
    updateUndoUI();
  }

  function createCard(definition, selectCard) {
    var card = document.createElement("article");
    card.id = definition.id;
    card.className = "card" + (definition.classes ? " " + definition.classes : "");
    card.dataset.label = definition.label;
    card.dataset.color = definition.color || "blue";
    card.dataset.type = definition.type || "basic";
    card.style.left = Number(definition.x) + "px";
    card.style.top = Number(definition.y) + "px";
    card.style.width = Number(definition.width || 330) + "px";
    card.style.height = Number(definition.height || 230) + "px";
    if (definition.hidden) card.classList.add("hidden-card");

    var header = document.createElement("div");
    var grip = document.createElement("span");
    var remove = document.createElement("button");
    var content = document.createElement("div");
    var resize = document.createElement("div");
    header.className = "card-header";
    grip.className = "card-grip";
    grip.textContent = "::::";
    remove.className = "card-delete";
    remove.type = "button";
    remove.setAttribute("aria-label", "删除卡片");
    remove.textContent = "×";
    content.className = "card-content";
    content.innerHTML = definition.html;
    resize.className = "resize-handle";
    resize.setAttribute("aria-hidden", "true");
    header.append(grip, remove);
    card.append(header, content, resize);
    cardsLayer.appendChild(card);
    bindCard(card);
    createLayerItem(card);

    if (selectCard) {
      selectedCardId = card.id;
      setSelectedCard(card.id);
      centerCard(card);
    }
    return card;
  }

  function bindCard(card) {
    var header = card.querySelector(".card-header");
    var remove = card.querySelector(".card-delete");
    var resize = card.querySelector(".resize-handle");
    bindCardDrag(card, header);
    bindCardResize(card, resize);
    bindEditable(card);
    bindImageZone(card);

    remove.addEventListener("click", function (event) {
      event.stopPropagation();
      pushUndo();
      deleteCard(card.id);
    });

    card.addEventListener("pointerdown", function () {
      if (!connectMode) setSelectedCard(card.id);
    });
  }

  function bindCardDrag(card, handle) {
    handle.addEventListener("pointerdown", function (event) {
      if (connectMode || event.button !== 0) return;
      event.preventDefault();
      pushUndo();
      var startX = event.clientX;
      var startY = event.clientY;
      var originX = card.offsetLeft;
      var originY = card.offsetTop;
      handle.setPointerCapture(event.pointerId);

      function move(moveEvent) {
        card.style.left = originX + (moveEvent.clientX - startX) / view.scale + "px";
        card.style.top = originY + (moveEvent.clientY - startY) / view.scale + "px";
        updateConnections();
        updateMinimapDots();
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

  function bindCardResize(card, handle) {
    handle.addEventListener("pointerdown", function (event) {
      if (connectMode || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      pushUndo();
      var startX = event.clientX;
      var startY = event.clientY;
      var startWidth = card.offsetWidth;
      var startHeight = card.offsetHeight;
      handle.setPointerCapture(event.pointerId);

      function move(moveEvent) {
        card.style.width = Math.max(210, startWidth + (moveEvent.clientX - startX) / view.scale) + "px";
        card.style.height = Math.max(130, startHeight + (moveEvent.clientY - startY) / view.scale) + "px";
        updateConnections();
        updateMinimapDots();
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

  function bindEditable(card) {
    card.querySelectorAll("[data-editable]").forEach(function (element) {
      element.addEventListener("dblclick", function (event) {
        if (connectMode) return;
        event.stopPropagation();
        pushUndo();
        element.setAttribute("contenteditable", "plaintext-only");
        element.focus();
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      });

      element.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          element.blur();
        }
      });

      element.addEventListener("blur", function () {
        element.removeAttribute("contenteditable");
      });
    });
  }

  function createLayerItem(card) {
    var item = document.createElement("div");
    var color = document.createElement("span");
    var name = document.createElement("span");
    var eye = document.createElement("button");
    var remove = document.createElement("button");
    item.className = "layer-item" + (card.classList.contains("hidden-card") ? " hidden-layer" : "");
    item.dataset.cardId = card.id;
    color.className = "layer-color " + card.dataset.color;
    name.className = "layer-name";
    name.textContent = card.dataset.label;
    eye.className = "layer-eye";
    eye.type = "button";
    eye.title = "显示或隐藏";
    eye.textContent = card.classList.contains("hidden-card") ? "○" : "●";
    remove.className = "layer-delete";
    remove.type = "button";
    remove.title = "删除";
    remove.textContent = "×";
    item.append(color, name, eye, remove);

    item.addEventListener("click", function (event) {
      if (event.target.closest("button")) return;
      setSelectedCard(card.id);
      centerCard(card);
    });

    name.addEventListener("dblclick", function (event) {
      event.stopPropagation();
      pushUndo();
      name.setAttribute("contenteditable", "plaintext-only");
      name.focus();
    });
    name.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        name.blur();
      }
      if (event.key === "Escape") name.blur();
    });
    name.addEventListener("blur", function () {
      name.removeAttribute("contenteditable");
      var nextName = name.textContent.trim() || "未命名卡片";
      name.textContent = nextName;
      card.dataset.label = nextName;
    });

    eye.addEventListener("click", function (event) {
      event.stopPropagation();
      pushUndo();
      var hidden = card.classList.toggle("hidden-card");
      item.classList.toggle("hidden-layer", hidden);
      eye.textContent = hidden ? "○" : "●";
      updateConnections();
      updateMinimapDots();
    });

    remove.addEventListener("click", function (event) {
      event.stopPropagation();
      pushUndo();
      deleteCard(card.id);
    });

    layerList.appendChild(item);
  }

  function setSelectedCard(id) {
    selectedCardId = id;
    cardsLayer.querySelectorAll(".card").forEach(function (card) {
      card.classList.toggle("selected", card.id === id);
    });
    layerList.querySelectorAll(".layer-item").forEach(function (item) {
      item.classList.toggle("active", item.dataset.cardId === id);
    });
  }

  function deleteCard(id) {
    var card = getCard(id);
    if (card) card.remove();
    var item = layerList.querySelector('[data-card-id="' + id + '"]');
    if (item) item.remove();
    connections = connections.filter(function (pair) {
      return pair[0] !== id && pair[1] !== id;
    });
    if (selectedCardId === id) selectedCardId = null;
    updateConnections();
    updateMinimapDots();
    showToast("卡片已删除，可使用撤销恢复");
  }

  function centerCard(card) {
    if (!card || card.classList.contains("hidden-card")) return;
    view.x = area.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2) * view.scale;
    view.y = area.clientHeight / 2 - (card.offsetTop + card.offsetHeight / 2) * view.scale;
    applyTransform();
  }

  function getEdgePoint(card, targetCenter) {
    var center = {
      x: card.offsetLeft + card.offsetWidth / 2,
      y: card.offsetTop + card.offsetHeight / 2
    };
    var dx = targetCenter.x - center.x;
    var dy = targetCenter.y - center.y;
    var halfWidth = card.offsetWidth / 2;
    var halfHeight = card.offsetHeight / 2;
    var scale = Math.min(Math.abs(halfWidth / (dx || 0.001)), Math.abs(halfHeight / (dy || 0.001)));
    return { x: center.x + dx * scale, y: center.y + dy * scale };
  }

  function updateConnections() {
    connectionsSvg.innerHTML = "";
    connections.forEach(function (pair, index) {
      var fromCard = getCard(pair[0]);
      var toCard = getCard(pair[1]);
      if (!fromCard || !toCard || fromCard.classList.contains("hidden-card") || toCard.classList.contains("hidden-card")) return;
      var fromCenter = { x: fromCard.offsetLeft + fromCard.offsetWidth / 2, y: fromCard.offsetTop + fromCard.offsetHeight / 2 };
      var toCenter = { x: toCard.offsetLeft + toCard.offsetWidth / 2, y: toCard.offsetTop + toCard.offsetHeight / 2 };
      var from = getEdgePoint(fromCard, toCenter);
      var to = getEdgePoint(toCard, fromCenter);
      var distance = Math.abs(to.x - from.x);
      var bend = Math.max(60, distance * 0.42);
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M " + from.x + " " + from.y + " C " + (from.x + bend) + " " + from.y + ", " + (to.x - bend) + " " + to.y + ", " + to.x + " " + to.y);
      path.setAttribute("class", "connection-path" + (index % 3 === 1 ? " accent" : ""));
      connectionsSvg.appendChild(path);
    });
  }

  function createTemporaryConnection(fromCard, clientX, clientY) {
    updateConnections();
    var areaRect = area.getBoundingClientRect();
    var target = {
      x: (clientX - areaRect.left - view.x) / view.scale,
      y: (clientY - areaRect.top - view.y) / view.scale
    };
    var fromCenter = { x: fromCard.offsetLeft + fromCard.offsetWidth / 2, y: fromCard.offsetTop + fromCard.offsetHeight / 2 };
    var from = getEdgePoint(fromCard, target);
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M " + from.x + " " + from.y + " C " + (from.x + 90) + " " + from.y + ", " + (target.x - 90) + " " + target.y + ", " + target.x + " " + target.y);
    path.setAttribute("class", "temporary-connection");
    connectionsSvg.appendChild(path);
  }

  function enableConnectMode(enabled) {
    connectMode = enabled;
    connectButton.classList.toggle("active", enabled);
    connectButton.textContent = enabled ? "完成连线" : "⌘ 连线";
    area.style.cursor = enabled ? "crosshair" : "grab";
    cardsLayer.querySelectorAll(".card").forEach(function (card) {
      card.classList.remove("connect-source");
    });
    updateConnections();
    showToast(enabled ? "从一张卡拖到另一张卡" : "已退出连线模式");
  }

  cardsLayer.addEventListener("pointerdown", function (event) {
    if (!connectMode || event.button !== 0 || event.target.closest("button")) return;
    var fromCard = event.target.closest(".card");
    if (!fromCard) return;
    event.preventDefault();
    fromCard.classList.add("connect-source");

    function move(moveEvent) {
      createTemporaryConnection(fromCard, moveEvent.clientX, moveEvent.clientY);
    }

    function end(endEvent) {
      fromCard.classList.remove("connect-source");
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", end);
      var target = document.elementFromPoint(endEvent.clientX, endEvent.clientY);
      var toCard = target && target.closest(".card");
      if (toCard && toCard !== fromCard) {
        var exists = connections.some(function (pair) {
          return (pair[0] === fromCard.id && pair[1] === toCard.id) || (pair[1] === fromCard.id && pair[0] === toCard.id);
        });
        if (!exists) {
          pushUndo();
          connections.push([fromCard.id, toCard.id]);
          showToast("卡片已连接");
        }
      }
      updateConnections();
    }

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", end);
  });

  connectButton.addEventListener("click", function () {
    enableConnectMode(!connectMode);
  });

  var activePointers = new Map();
  var panStart = null;
  var pinchStart = null;

  area.addEventListener("pointerdown", function (event) {
    if (event.target.closest(".card") || connectMode) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    area.setPointerCapture(event.pointerId);
    area.classList.add("panning");
    if (activePointers.size === 1) {
      panStart = { pointerX: event.clientX, pointerY: event.clientY, viewX: view.x, viewY: view.y };
    }
    if (activePointers.size === 2) {
      var points = Array.from(activePointers.values());
      pinchStart = {
        distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
        scale: view.scale,
        centerX: (points[0].x + points[1].x) / 2,
        centerY: (points[0].y + points[1].y) / 2,
        viewX: view.x,
        viewY: view.y
      };
    }
  });

  area.addEventListener("pointermove", function (event) {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size === 1 && panStart) {
      view.x = panStart.viewX + event.clientX - panStart.pointerX;
      view.y = panStart.viewY + event.clientY - panStart.pointerY;
      applyTransform();
    }
    if (activePointers.size === 2 && pinchStart) {
      var points = Array.from(activePointers.values());
      var distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      var nextScale = clamp(pinchStart.scale * distance / Math.max(1, pinchStart.distance), MIN_SCALE, MAX_SCALE);
      var rect = area.getBoundingClientRect();
      var centerX = (points[0].x + points[1].x) / 2 - rect.left;
      var centerY = (points[0].y + points[1].y) / 2 - rect.top;
      var worldX = (pinchStart.centerX - rect.left - pinchStart.viewX) / pinchStart.scale;
      var worldY = (pinchStart.centerY - rect.top - pinchStart.viewY) / pinchStart.scale;
      view.scale = nextScale;
      view.x = centerX - worldX * nextScale;
      view.y = centerY - worldY * nextScale;
      applyTransform();
    }
  });

  function releasePointer(event) {
    activePointers.delete(event.pointerId);
    if (!activePointers.size) {
      area.classList.remove("panning");
      panStart = null;
      pinchStart = null;
    } else if (activePointers.size === 1) {
      var point = Array.from(activePointers.values())[0];
      panStart = { pointerX: point.x, pointerY: point.y, viewX: view.x, viewY: view.y };
      pinchStart = null;
    }
  }

  area.addEventListener("pointerup", releasePointer);
  area.addEventListener("pointercancel", releasePointer);

  function zoomAt(clientX, clientY, nextScale) {
    var rect = area.getBoundingClientRect();
    var localX = clientX - rect.left;
    var localY = clientY - rect.top;
    var worldX = (localX - view.x) / view.scale;
    var worldY = (localY - view.y) / view.scale;
    view.scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    view.x = localX - worldX * view.scale;
    view.y = localY - worldY * view.scale;
    applyTransform();
  }

  area.addEventListener("wheel", function (event) {
    event.preventDefault();
    var factor = Math.exp(-event.deltaY * 0.0014);
    zoomAt(event.clientX, event.clientY, view.scale * factor);
  }, { passive: false });

  document.getElementById("zoomIn").addEventListener("click", function () {
    var rect = area.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, view.scale * 1.15);
  });

  document.getElementById("zoomOut").addEventListener("click", function () {
    var rect = area.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, view.scale / 1.15);
  });

  function fitToView() {
    var cards = Array.from(cardsLayer.querySelectorAll(".card:not(.hidden-card)"));
    if (!cards.length) return;
    var minX = Math.min.apply(null, cards.map(function (card) { return card.offsetLeft; }));
    var minY = Math.min.apply(null, cards.map(function (card) { return card.offsetTop; }));
    var maxX = Math.max.apply(null, cards.map(function (card) { return card.offsetLeft + card.offsetWidth; }));
    var maxY = Math.max.apply(null, cards.map(function (card) { return card.offsetTop + card.offsetHeight; }));
    var contentWidth = maxX - minX;
    var contentHeight = maxY - minY;
    view.scale = clamp(Math.min((area.clientWidth - 80) / contentWidth, (area.clientHeight - 80) / contentHeight), MIN_SCALE, 1.15);
    view.x = (area.clientWidth - contentWidth * view.scale) / 2 - minX * view.scale;
    view.y = (area.clientHeight - contentHeight * view.scale) / 2 - minY * view.scale;
    applyTransform();
  }

  document.getElementById("zoomFit").addEventListener("click", fitToView);

  function updateMinimapDots() {
    minimap.querySelectorAll(".minimap-dot").forEach(function (dot) { dot.remove(); });
    var miniScaleX = minimap.clientWidth / WORLD_WIDTH;
    var miniScaleY = minimap.clientHeight / WORLD_HEIGHT;
    cardsLayer.querySelectorAll(".card:not(.hidden-card)").forEach(function (card) {
      var dot = document.createElement("span");
      dot.className = "minimap-dot " + card.dataset.color;
      dot.style.left = card.offsetLeft * miniScaleX + "px";
      dot.style.top = card.offsetTop * miniScaleY + "px";
      dot.style.width = Math.max(5, card.offsetWidth * miniScaleX) + "px";
      dot.style.height = Math.max(4, card.offsetHeight * miniScaleY) + "px";
      minimap.appendChild(dot);
    });
  }

  function updateMinimap() {
    var miniScaleX = minimap.clientWidth / WORLD_WIDTH;
    var miniScaleY = minimap.clientHeight / WORLD_HEIGHT;
    var worldLeft = -view.x / view.scale;
    var worldTop = -view.y / view.scale;
    minimapViewport.style.left = worldLeft * miniScaleX + "px";
    minimapViewport.style.top = worldTop * miniScaleY + "px";
    minimapViewport.style.width = area.clientWidth / view.scale * miniScaleX + "px";
    minimapViewport.style.height = area.clientHeight / view.scale * miniScaleY + "px";
  }

  minimap.addEventListener("click", function (event) {
    var rect = minimap.getBoundingClientRect();
    var worldX = (event.clientX - rect.left) / rect.width * WORLD_WIDTH;
    var worldY = (event.clientY - rect.top) / rect.height * WORLD_HEIGHT;
    view.x = area.clientWidth / 2 - worldX * view.scale;
    view.y = area.clientHeight / 2 - worldY * view.scale;
    applyTransform();
  });

  function templateDefinition(template) {
    var centerX = (area.clientWidth / 2 - view.x) / view.scale;
    var centerY = (area.clientHeight / 2 - view.y) / view.scale;
    var id = "card-custom-" + Date.now();
    var base = {
      id: id,
      label: "新建卡片",
      color: "blue",
      type: template,
      x: centerX - 165,
      y: centerY - 115,
      width: 330,
      height: 230,
      classes: "",
      html: '<h3 data-editable>新建卡片</h3><p data-editable>双击文字即可编辑内容。</p>'
    };

    if (template === "quote") {
      base.label = "引用卡";
      base.classes = "quote-card";
      base.html = '<h3 data-editable>引用</h3><blockquote data-editable>把值得保留的判断放在这里。</blockquote>';
    }
    if (template === "image") {
      base.label = "图片卡";
      base.classes = "image-card";
      base.html = '<button type="button" class="image-upload-zone">点击或拖入图片</button>';
    }
    if (template === "sticky") {
      base.label = "便利贴";
      base.color = "yellow";
      base.width = 290;
      base.height = 190;
      base.classes = "sticky-card";
      base.html = '<div data-editable>双击编辑这张便利贴</div>';
    }
    if (template === "dark") {
      base.label = "深色卡";
      base.classes = "project-card dark-card";
      base.html = '<small>PUBLIC NOTE</small><h2 data-editable>深色卡片</h2><p data-editable>适合放置需要强调的系统结论。</p>';
    }
    if (template === "link") {
      base.label = "链接卡";
      base.classes = "link-card";
      base.html = '<h3 data-editable>公开链接</h3><p data-editable>写下链接说明。</p><a href="#" data-editable>打开链接 ↗</a>';
    }
    return base;
  }

  function showTemplatePanel() {
    templatePanel.hidden = false;
  }

  function hideTemplatePanel() {
    templatePanel.hidden = true;
  }

  document.getElementById("toolbarAddCard").addEventListener("click", showTemplatePanel);
  document.getElementById("layerAddCard").addEventListener("click", showTemplatePanel);
  templatePanel.addEventListener("click", function (event) {
    var button = event.target.closest("[data-template]");
    if (!button) return;
    pushUndo();
    createCard(templateDefinition(button.dataset.template), true);
    updateConnections();
    updateMinimapDots();
    hideTemplatePanel();
    showToast("新卡片已创建");
  });

  document.addEventListener("pointerdown", function (event) {
    if (!templatePanel.hidden && !event.target.closest("#templatePanel, #toolbarAddCard, #layerAddCard")) {
      hideTemplatePanel();
    }
  });

  function bindImageZone(card) {
    var zone = card.querySelector(".image-upload-zone");
    if (!zone) return;
    zone.addEventListener("click", function () {
      pendingImageZone = zone;
      imageInput.click();
    });
    zone.addEventListener("dragover", function (event) {
      event.preventDefault();
      zone.classList.add("dragging");
    });
    zone.addEventListener("dragleave", function () {
      zone.classList.remove("dragging");
    });
    zone.addEventListener("drop", function (event) {
      event.preventDefault();
      zone.classList.remove("dragging");
      var file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) handleImageFile(file, zone);
    });
  }

  function handleImageFile(file, zone) {
    if (!file.type.startsWith("image/")) {
      showToast("请选择图片文件");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      showToast("图片请控制在 6MB 以内");
      return;
    }
    pushUndo();
    var reader = new FileReader();
    reader.onload = function () {
      zone.innerHTML = "";
      var image = document.createElement("img");
      image.src = String(reader.result);
      image.alt = "用户添加的画布图片";
      zone.appendChild(image);
      showToast("图片已加入卡片");
    };
    reader.onerror = function () {
      showToast("图片读取失败");
    };
    reader.readAsDataURL(file);
  }

  imageInput.addEventListener("change", function () {
    var file = imageInput.files && imageInput.files[0];
    if (file && pendingImageZone) handleImageFile(file, pendingImageZone);
    imageInput.value = "";
  });

  function saveLayout() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
      showToast("布局已保存在当前浏览器");
    } catch (error) {
      showToast("保存失败，可能是图片过大或存储不可用");
    }
  }

  function restoreSavedLayout() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var state = JSON.parse(raw);
      if (!state || state.version !== 1 || !Array.isArray(state.cards)) return false;
      restoreState(state);
      showToast("已恢复上次保存的布局");
      return true;
    } catch (error) {
      showToast("保存的布局无法读取，已使用默认布局");
      return false;
    }
  }

  document.getElementById("saveLayout").addEventListener("click", saveLayout);
  undoButton.addEventListener("click", performUndo);
  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !document.activeElement.isContentEditable) {
      event.preventDefault();
      performUndo();
    }
    if (event.key === "Escape" && canvasApp.classList.contains("layers-open")) {
      setLayersOpen(false);
    } else if (event.key === "Escape" && connectMode) {
      enableConnectMode(false);
    }
  });

  function initialize() {
    seedCards.forEach(function (definition) {
      createCard(definition, false);
    });
    applyTransform();
    updateConnections();
    updateMinimapDots();
    restoreSavedLayout();
    updateUndoUI();
  }

  window.addEventListener("resize", function () {
    if (!window.matchMedia("(max-width: 767px)").matches) setLayersOpen(false);
    updateMinimapDots();
    applyTransform();
  });

  initialize();
})();
