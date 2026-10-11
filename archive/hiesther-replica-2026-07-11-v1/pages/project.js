(function () {
  "use strict";

  var root = document.getElementById("projectRoot");
  var siteData = window.SITE_DATA;
  var params = new URLSearchParams(location.search);
  var id = params.get("id") || "personal-os";
  var project = siteData && siteData.projects ? siteData.projects[id] : null;

  if (!project) {
    root.innerHTML = '<div class="project-error">项目档案不存在或尚未公开。</div>';
    document.title = "AkaGavin - Project not found";
    return;
  }

  document.title = "AkaGavin - " + project.title;
  root.innerHTML = "";

  var bar = document.createElement("nav");
  var label = document.createElement("span");
  var back = document.createElement("a");
  bar.className = "project-filebar";
  label.textContent = "public-work/" + id + ".md";
  back.href = "../index.html#works";
  back.textContent = "返回作品集";
  bar.append(label, back);

  var header = document.createElement("header");
  var command = document.createElement("p");
  var title = document.createElement("h1");
  var subtitle = document.createElement("h2");
  header.className = "project-header";
  command.textContent = "$ cat project.md";
  title.textContent = project.title;
  subtitle.textContent = project.subtitle;
  header.append(command, title, subtitle);

  var summary = document.createElement("p");
  summary.className = "project-summary";
  summary.textContent = project.summary;

  var facts = document.createElement("section");
  facts.className = "project-facts";
  project.facts.forEach(function (fact) {
    var item = document.createElement("article");
    item.className = "project-fact";
    item.textContent = fact;
    facts.appendChild(item);
  });

  var boundary = document.createElement("footer");
  boundary.className = "project-boundary";
  boundary.textContent = "公开边界：" + project.boundary;
  root.append(bar, header, summary, facts, boundary);
})();
