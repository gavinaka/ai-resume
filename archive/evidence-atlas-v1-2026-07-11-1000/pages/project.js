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
    document.title = "AkaGavin - Project not found";
    return;
  }

  var evidenceIds = atlas.projectEvidence[id] || [];
  var evidenceById = new Map(atlas.records.map(function (record) { return [record.id, record]; }));
  var capabilityById = new Map(atlas.capabilities.map(function (capability) { return [capability.id, capability]; }));
  var records = evidenceIds.map(function (evidenceId) { return evidenceById.get(evidenceId); }).filter(Boolean);
  var capabilityIds = Array.from(new Set(records.flatMap(function (record) { return record.capabilityIds; })));
  var capabilities = capabilityIds.map(function (capabilityId) { return capabilityById.get(capabilityId); }).filter(Boolean);
  var sourceClasses = Array.from(new Set(records.map(function (record) { return record.sourceClass; })));

  document.title = "AkaGavin - " + project.title;
  root.innerHTML = "";

  function node(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  var bar = node("nav", "project-filebar");
  var label = node("span", "", "public-work/" + id + ".md");
  var back = node("a", "", "返回作品集");
  back.href = "../index.html#works";
  bar.append(label, back);

  var header = node("header", "project-header");
  header.append(
    node("p", "project-command", "$ cat evidence-dossier.md"),
    node("h1", "", project.title),
    node("h2", "", project.subtitle)
  );

  var summary = node("p", "project-summary", project.summary);

  var metrics = node("section", "project-metrics");
  [
    [String(records.length).padStart(2, "0"), "PUBLIC EVIDENCE"],
    [String(capabilities.length).padStart(2, "0"), "CAPABILITY LINKS"],
    [String(sourceClasses.length).padStart(2, "0"), "SOURCE CLASSES"],
    ["READ", "PUBLIC BOUNDARY"]
  ].forEach(function (item) {
    var metric = node("article", "project-metric");
    metric.append(node("strong", "", item[0]), node("span", "", item[1]));
    metrics.appendChild(metric);
  });

  var sourceLegend = node("div", "source-legend");
  var sourceDescriptions = {
    Artifact: "代码、测试、架构记录或可复核产物",
    Contract: "明确的治理与运行合同",
    Profile: "稳定画像自述，不等同独立审计",
    Delivered: "已完成并通过验证的公开产品"
  };
  sourceClasses.forEach(function (sourceClass) {
    var badge = node("span", "source-badge source-" + sourceClass.toLowerCase());
    badge.title = sourceDescriptions[sourceClass] || sourceClass;
    badge.append(node("b", "", sourceClass), document.createTextNode(sourceDescriptions[sourceClass] || ""));
    sourceLegend.appendChild(badge);
  });

  var facts = node("section", "project-facts");
  project.facts.forEach(function (fact) {
    facts.appendChild(node("article", "project-fact", fact));
  });

  function createTextSection(index, labelText, headingText, bodyText) {
    var section = node("article", "project-section");
    section.append(
      node("span", "project-section-label", String(index).padStart(2, "0") + " / " + labelText),
      node("h3", "", headingText),
      node("p", "", bodyText)
    );
    return section;
  }

  function createListSection(index, labelText, headingText, items) {
    var section = node("article", "project-section");
    var list = node("ul", "");
    items.forEach(function (item) { list.appendChild(node("li", "", item)); });
    section.append(
      node("span", "project-section-label", String(index).padStart(2, "0") + " / " + labelText),
      node("h3", "", headingText),
      list
    );
    return section;
  }

  var contractHeading = node("header", "dossier-heading");
  contractHeading.append(node("span", "", "01"), node("div", "", "项目合同"), node("p", "", "先说明项目为什么存在、本人承担什么责任，以及证据不能证明什么。"));
  var contract = node("section", "project-evidence");
  contract.append(
    createTextSection(1, "WHY", "为什么建立", project.why),
    createTextSection(2, "PROBLEM", "解决什么问题", project.problem),
    createTextSection(3, "ROLE", "AkaGavin 的职责", project.role),
    createListSection(4, "PRINCIPLES", "关键设计原则", project.principles),
    createListSection(5, "PROVES", "它证明的能力", project.proves)
  );

  var recordsHeading = node("header", "dossier-heading");
  recordsHeading.append(node("span", "", "02"), node("div", "", "证据记录"), node("p", "", "每条记录同时展示背景、动作、产物、验证和沉淀，不把结论当作证据。"));
  var recordList = node("section", "evidence-records");
  records.forEach(function (record) {
    var article = node("article", "evidence-record");
    var top = node("div", "evidence-record-top");
    top.append(
      node("span", "evidence-id", record.id),
      node("span", "evidence-date", record.date),
      node("span", "source-chip source-" + record.sourceClass.toLowerCase(), record.sourceClass)
    );
    var context = node("p", "evidence-context", record.context);
    var grid = node("div", "evidence-detail-grid");
    [
      ["ACTION", "做了什么", record.action],
      ["ARTIFACT", "形成什么", record.artifact],
      ["VERIFY", "如何验证", record.verification],
      ["LESSON", "沉淀什么", record.lesson]
    ].forEach(function (detail) {
      var block = node("section", "evidence-detail");
      block.append(node("small", "", detail[0]), node("h4", "", detail[1]), node("p", "", detail[2]));
      grid.appendChild(block);
    });
    var tags = node("div", "evidence-tags");
    record.capabilityIds.forEach(function (capabilityId) {
      var capability = capabilityById.get(capabilityId);
      if (capability) tags.appendChild(node("span", "", capability.label));
    });
    article.append(top, node("h3", "", record.title), context, grid, tags);
    recordList.appendChild(article);
  });

  var capabilityHeading = node("header", "dossier-heading");
  capabilityHeading.append(node("span", "", "03"), node("div", "", "能力映射"), node("p", "", "能力不仅有名称，还包括使用条件、方法、边界与对应证据。"));
  var capabilityGrid = node("section", "capability-dossiers");
  capabilities.forEach(function (capability) {
    var card = node("article", "capability-dossier");
    var relevantIds = capability.evidenceRefs.filter(function (evidenceId) { return evidenceIds.includes(evidenceId); });
    card.append(
      node("small", "", capability.cluster),
      node("h3", "", capability.label),
      node("p", "capability-definition", capability.definition),
      node("p", "", "方法：" + capability.method),
      node("p", "", "触发：" + capability.trigger),
      node("p", "capability-boundary", "边界：" + capability.boundary),
      node("span", "capability-proof", (relevantIds.length || capability.evidenceRefs.length) + " 条关联证据")
    );
    capabilityGrid.appendChild(card);
  });

  var boundary = node("footer", "project-boundary");
  boundary.append(node("strong", "", "公开边界"), document.createTextNode(project.boundary), node("small", "", atlas.meta.privateBoundary));

  root.append(
    bar, header, summary, metrics, sourceLegend, facts,
    contractHeading, contract,
    recordsHeading, recordList,
    capabilityHeading, capabilityGrid,
    boundary
  );
})();
