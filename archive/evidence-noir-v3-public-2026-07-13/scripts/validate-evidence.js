"use strict";

const assert = require("assert");

global.window = {};
require("../evidence-data.js");
require("../site-data.js");

const atlas = window.EVIDENCE_ATLAS;
const site = window.SITE_DATA;
const recordIds = new Set(atlas.records.map(record => record.id));
const capabilityIds = new Set(atlas.capabilities.map(capability => capability.id));
const projectIds = new Set(Object.keys(site.projects));
const expectedSiteKeys = ["profile", "projects", "workGroups"];

assert.deepStrictEqual(Object.keys(site).sort(), expectedSiteKeys, "public site schema contains legacy or unknown top-level fields");

assert.strictEqual(recordIds.size, atlas.records.length, "evidence IDs must be unique");
assert.strictEqual(capabilityIds.size, atlas.capabilities.length, "capability IDs must be unique");
assert(atlas.records.length >= 42, "public evidence inventory regressed");
assert.strictEqual(atlas.capabilities.length, 24, "capability inventory must remain 24");
assert.strictEqual(atlas.principles.length, 12, "principle inventory must remain 12");
assert.strictEqual(atlas.stages.length, 5, "experience stage inventory must remain 5");
assert.strictEqual(atlas.stages.reduce((total, stage) => total + stage.events.length, 0), 20, "experience event inventory must remain 20");
assert.strictEqual(projectIds.size, 11, "public project inventory must remain 11");
assert(site.profile.facts.length >= 6, "public identity needs at least six distinct facts");

const groupedProjectIds = site.workGroups.flatMap(group => group.projects.map(project => project.id));
assert.strictEqual(new Set(groupedProjectIds).size, groupedProjectIds.length, "projects must appear in exactly one work group");
assert.deepStrictEqual(new Set(groupedProjectIds), projectIds, "work groups must cover every public project exactly once");

const presentationLines = [];
const protocolNarratives = [];

function characterBigrams(value) {
  const normalized = value.replace(/[\s，。；：、“”‘’（）/·—,.!:;()\-]/g, "");
  const result = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) result.add(normalized.slice(index, index + 2));
  return result;
}

function similarity(left, right) {
  const a = characterBigrams(left);
  const b = characterBigrams(right);
  let intersection = 0;
  a.forEach(value => { if (b.has(value)) intersection += 1; });
  return intersection / Math.max(1, a.size + b.size - intersection);
}

Object.entries(site.projects).forEach(([projectId, project]) => {
  ["title", "subtitle", "summary", "indexLine", "canvasLine", "why", "problem", "role", "boundary"].forEach(field => {
    assert(typeof project[field] === "string" && project[field].trim().length >= 6, `${projectId}.${field} is missing or too shallow`);
  });
  ["facts", "principles", "proves"].forEach(field => {
    assert(Array.isArray(project[field]) && project[field].length >= 3, `${projectId}.${field} needs at least three items`);
  });
  assert(project.protocol && typeof project.protocol === "object", `${projectId}.protocol is required`);
  assert(project.protocol.trigger.length >= 12, `${projectId}.protocol.trigger is too shallow`);
  assert(project.protocol.tradeoff.length >= 12, `${projectId}.protocol.tradeoff is too shallow`);
  assert(project.protocol.inputs.length >= 3, `${projectId}.protocol.inputs needs at least three items`);
  assert(project.protocol.sequence.length >= 4, `${projectId}.protocol.sequence needs at least four steps`);
  assert(project.protocol.stop.length >= 3, `${projectId}.protocol.stop needs at least three conditions`);
  assert(project.protocol.verification.length >= 3, `${projectId}.protocol.verification needs at least three checks`);

  const lines = [project.summary, project.indexLine, project.canvasLine];
  assert(similarity(lines[0], lines[1]) < 0.72, `${projectId} summary repeats its homepage index line`);
  assert(similarity(lines[0], lines[2]) < 0.72, `${projectId} summary repeats its canvas line`);
  assert(similarity(lines[1], lines[2]) < 0.72, `${projectId} homepage and canvas lines repeat each other`);
  lines.forEach(line => presentationLines.push({ projectId, line }));

  [project.protocol.trigger, project.protocol.tradeoff]
    .concat(project.protocol.inputs, project.protocol.sequence, project.protocol.stop, project.protocol.verification)
    .forEach(line => protocolNarratives.push({ projectId, line }));
});

assert.strictEqual(new Set(presentationLines.map(item => item.line)).size, presentationLines.length, "presentation lines must be unique");
const protocolExactDuplicates = protocolNarratives.filter((item, index, items) =>
  items.findIndex(candidate => candidate.line === item.line) !== index
);
assert.strictEqual(protocolExactDuplicates.length, 0, "project protocols contain repeated narrative lines");

atlas.records.forEach(record => {
  assert(projectIds.has(record.projectId), `unknown project on evidence ${record.id}`);
  assert(record.capabilityIds.length >= 2, `evidence ${record.id} needs at least two capability links`);
  record.capabilityIds.forEach(capabilityId => {
    assert(capabilityIds.has(capabilityId), `unknown capability ${capabilityId} on evidence ${record.id}`);
  });
});

atlas.capabilities.forEach(capability => {
  assert(capability.evidenceRefs.length >= 2, `capability ${capability.id} needs at least two evidence links`);
  capability.evidenceRefs.forEach(evidenceId => {
    assert(recordIds.has(evidenceId), `unknown evidence ${evidenceId} on capability ${capability.id}`);
  });
});

atlas.principles.forEach(principle => {
  assert(principle.evidenceRefs.length >= 2, `principle ${principle.id} needs at least two evidence links`);
  principle.evidenceRefs.forEach(evidenceId => {
    assert(recordIds.has(evidenceId), `unknown evidence ${evidenceId} on principle ${principle.id}`);
  });
});

Object.entries(atlas.projectEvidence).forEach(([projectId, evidenceIds]) => {
  assert(projectIds.has(projectId), `unknown project mapping ${projectId}`);
  assert(evidenceIds.length >= 3, `project ${projectId} needs at least three evidence records`);
  evidenceIds.forEach(evidenceId => {
    assert(recordIds.has(evidenceId), `unknown evidence ${evidenceId} on project ${projectId}`);
  });
});

const publicPayload = JSON.stringify({ site, atlas });
[
  /C:\\Users\\/i,
  /C:\/Users\//i,
  /(?<!\d)1[3-9]\d{9}(?!\d)/,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /sk-[a-z0-9]{20,}/i,
  /webhook_secret\s*[:=]/i,
  /access[_-]?token\s*[:=]/i
].forEach(pattern => assert(!pattern.test(publicPayload), `forbidden public pattern: ${pattern}`));

console.log(JSON.stringify({
  status: "PASS",
  records: atlas.records.length,
  capabilities: atlas.capabilities.length,
  principles: atlas.principles.length,
  stages: atlas.stages.length,
  events: atlas.stages.reduce((total, stage) => total + stage.events.length, 0),
  projects: Object.keys(atlas.projectEvidence).length,
  protocolSteps: Object.values(site.projects).reduce((total, project) => total + project.protocol.sequence.length, 0),
  legacyFields: Object.keys(site).filter(key => !expectedSiteKeys.includes(key)).length
}));
