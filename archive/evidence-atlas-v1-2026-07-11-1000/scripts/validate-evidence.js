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

assert.strictEqual(recordIds.size, atlas.records.length, "evidence IDs must be unique");
assert.strictEqual(capabilityIds.size, atlas.capabilities.length, "capability IDs must be unique");
assert(atlas.records.length >= 42, "public evidence inventory regressed");
assert.strictEqual(atlas.capabilities.length, 24, "capability inventory must remain 24");
assert.strictEqual(atlas.principles.length, 12, "principle inventory must remain 12");
assert.strictEqual(atlas.stages.length, 5, "experience stage inventory must remain 5");
assert.strictEqual(atlas.stages.reduce((total, stage) => total + stage.events.length, 0), 20, "experience event inventory must remain 20");

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

const publicPayload = JSON.stringify(atlas);
[
  /C:\\Users\\/i,
  /C:\/Users\//i,
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
  projects: Object.keys(atlas.projectEvidence).length
}));
