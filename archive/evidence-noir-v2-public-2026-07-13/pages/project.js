(function () {
  "use strict";

  var root = document.getElementById("projectRoot");
  var siteData = window.SITE_DATA;
  var atlas = window.EVIDENCE_ATLAS;
  var params = new URLSearchParams(location.search);
  var id = params.get("id") || "personal-os";
  var project = siteData && siteData.projects ? siteData.projects[id] : null;

  if (!project || !atlas) {
    root.innerHTML = '<div class="project-error">项目档案不存在或证据数据尚未加载。</div>';
    document.title = "AkaGavin — Dossier not found";
    return;
  }

  var evidenceIds = atlas.projectEvidence[id] || [];
  var evidenceById = new Map(atlas.records.map(function (record) { return [record.id, record]; }));
  var capabilityById = new Map(atlas.capabilities.map(function (capability) { return [capability.id, capability]; }));
  var records = evidenceIds.map(function (evidenceId) { return evidenceById.get(evidenceId); }).filter(Boolean);
  var capabilityIds = Array.from(new Set(records.flatMap(function (record) { return record.capabilityIds; })));
  var capabilities = capabilityIds.map(function (capabilityId) { return capabilityById.get(capabilityId); }).filter(Boolean);
  var sourceClasses = Array.from(new Set(records.map(function (record) { return record.sourceClass; })));
  var sections = [];

  document.title = "AkaGavin — " + project.title;
  document.getElementById("dossierCode").textContent = "FILE / " + id.toUpperCase();
  root.textContent = "";

  function node(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function sectionHeading(index, title, description) {
    var header = node("header", "section-heading");
    header.append(
      node("span", "section-index", String(index).padStart(2, "0") + " / DOSSIER"),
      node("h2", "", title),
      node("p", "", description)
    );
    return header;
  }

  var hero = node("section", "dossier-hero");
  hero.id = "overview";
  var heroCopy = node("div", "dossier-hero-copy");
  heroCopy.append(
    node("p", "dossier-command", "PUBLIC FILE / " + id.toUpperCase()),
    node("h1", "", project.title),
    node("h2", "", project.subtitle),
    node("p", "dossier-summary", project.summary)
  );
  var heroImage = node("div", "dossier-hero-image");
  var image = document.createElement("img");
  image.src = "../assets/akagavin-editorial.jpg";
  image.alt = "";
  image.width = 1600;
  image.height = 2400;
  heroImage.append(image, node("span", "dossier-meta", "STILL / AG-01 / PUBLIC"));
  hero.append(heroCopy, heroImage);

  var stats = node("section", "dossier-stats");
  [
    [String(records.length).padStart(2, "0"), "PUBLIC EVIDENCE"],
    [String(capabilities.length).padStart(2, "0"), "CAPABILITY LINKS"],
    [String(sourceClasses.length).padStart(2, "0"), "SOURCE CLASSES"],
    ["READ", "PUBLIC BOUNDARY"]
  ].forEach(function (item) {
    var stat = node("article", "dossier-stat");
    stat.append(node("strong", "", item[0]), node("span", "", item[1]));
    stats.appendChild(stat);
  });

  var contractSection = node("section", "dossier-section light");
  contractSection.id = "contract";
  contractSection.appendChild(sectionHeading(1, "先说明项目为何存在，再讨论它证明什么。", "责任、问题、原则与边界构成项目合同；没有这个合同，产物很容易被过度解释。"));
  var contractList = node("div", "contract-list");
  [
    ["WHY", "为什么建立", project.why],
    ["PROBLEM", "解决什么问题", project.problem],
    ["ROLE", "AkaGavin 的职责", project.role]
  ].forEach(function (item, index) {
    var row = node("article", "contract-row");
    row.append(node("span", "", String(index + 1).padStart(2, "0") + " / " + item[0]), node("h3", "", item[1]), node("p", "", item[2]));
    contractList.appendChild(row);
  });
  [["PRINCIPLES", "关键设计原则", project.principles], ["PROVES", "它证明的能力", project.proves]].forEach(function (item, index) {
    var row = node("article", "contract-row");
    var list = node("ul", "");
    item[2].forEach(function (entry) { list.appendChild(node("li", "", entry)); });
    row.append(node("span", "", String(index + 4).padStart(2, "0") + " / " + item[0]), node("h3", "", item[1]), list);
    contractList.appendChild(row);
  });
  contractSection.appendChild(contractList);

  var recordsSection = node("section", "dossier-section");
  recordsSection.id = "records";
  recordsSection.appendChild(sectionHeading(2, "结论不算证据。过程、产物和验证必须同时出现。", "每条记录展示背景、动作、产物、验证与沉淀，并保留来源等级。"));
  var sourceLegend = node("div", "source-legend");
  var sourceDescriptions = {
    Artifact: "可复核产物",
    Contract: "治理与运行合同",
    Profile: "稳定画像自述",
    Delivered: "已验证公开交付"
  };
  sourceClasses.forEach(function (sourceClass) {
    var badge = node("span", "source-badge");
    badge.append(node("b", "", sourceClass), document.createTextNode(sourceDescriptions[sourceClass] || sourceClass));
    sourceLegend.appendChild(badge);
  });
  recordsSection.appendChild(sourceLegend);
  var recordList = node("div", "evidence-records");

  records.forEach(function (record) {
    var article = node("article", "evidence-record");
    var meta = node("div", "record-meta");
    meta.append(node("span", "evidence-id", record.id), node("span", "evidence-date", record.date), node("span", "source-chip", record.sourceClass));
    var context = node("div", "record-context");
    context.append(node("h3", "", record.title), node("p", "", record.context));
    var details = node("div", "evidence-detail-grid");
    [
      ["ACTION", "做了什么", record.action],
      ["ARTIFACT", "形成什么", record.artifact],
      ["VERIFY", "如何验证", record.verification],
      ["LESSON", "沉淀什么", record.lesson]
    ].forEach(function (detail) {
      var block = node("section", "evidence-detail");
      block.append(node("small", "", detail[0]), node("h4", "", detail[1]), node("p", "", detail[2]));
      details.appendChild(block);
    });
    var tags = node("div", "evidence-tags");
    record.capabilityIds.forEach(function (capabilityId) {
      var capability = capabilityById.get(capabilityId);
      if (capability) tags.appendChild(node("span", "", capability.label));
    });
    article.append(meta, context, details, tags);
    recordList.appendChild(article);
  });
  recordsSection.appendChild(recordList);

  var capabilitySection = node("section", "dossier-section light");
  capabilitySection.id = "capabilities";
  capabilitySection.appendChild(sectionHeading(3, "能力必须说明定义、使用条件、方法和边界。", "这里仅展示与本项目证据直接关联的能力，不使用无法证明的自我评价。"));
  var capabilityList = node("div", "capability-list");
  capabilities.forEach(function (capability) {
    var relevantIds = capability.evidenceRefs.filter(function (evidenceId) { return evidenceIds.includes(evidenceId); });
    var row = node("article", "capability-row");
    var copy = node("div", "capability-copy");
    copy.append(
      node("p", "", capability.definition),
      node("p", "", "方法：" + capability.method),
      node("p", "", "边界：" + capability.boundary)
    );
    row.append(
      node("span", "capability-cluster", capability.cluster),
      node("h3", "", capability.label),
      copy,
      node("span", "capability-proof", (relevantIds.length || capability.evidenceRefs.length) + " LINKS")
    );
    capabilityList.appendChild(row);
  });
  capabilitySection.appendChild(capabilityList);

  var boundarySection = node("section", "dossier-section boundary-section");
  boundarySection.id = "boundary";
  var boundaryCopy = node("div", "boundary-copy");
  boundaryCopy.append(
    node("h2", "", "公开能力证据，不公开私人状态。"),
    node("p", "", project.boundary),
    node("p", "", atlas.meta.privateBoundary)
  );
  var back = node("a", "", "返回全部公开档案 ↑");
  back.href = "../index.html#proof";
  boundaryCopy.appendChild(back);
  boundarySection.append(node("span", "boundary-label", "04 / PUBLIC BOUNDARY"), boundaryCopy);

  root.append(hero, stats, contractSection, recordsSection, capabilitySection, boundarySection);
  sections = [hero, contractSection, recordsSection, capabilitySection, boundarySection];

  if ("IntersectionObserver" in window) {
    var navLinks = Array.from(document.querySelectorAll(".dossier-rail a"));
    var visibility = new Map();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visibility.set(entry.target, entry.intersectionRatio); });
      var current = sections.reduce(function (best, section) {
        var ratio = visibility.get(section) || 0;
        return ratio > best.ratio ? { id: section.id, ratio: ratio } : best;
      }, { id: "overview", ratio: 0 });
      navLinks.forEach(function (link) { link.classList.toggle("active", link.getAttribute("href") === "#" + current.id); });
    }, { threshold: [0.08, 0.2, 0.4, 0.6] });
    sections.forEach(function (section) { observer.observe(section); });
  }
})();
