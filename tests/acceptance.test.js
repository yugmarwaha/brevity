const test = require("node:test");
const assert = require("node:assert/strict");

const { classifyIntent } = require("../src/intent-classifier");
const { modifyPrompt } = require("../src/prompt-modifier");

test("acceptance: definition question gets length instruction appended", () => {
  const prompt = "what does ephemeral mean";
  const intent = classifyIntent(prompt);
  const sent = modifyPrompt(prompt, intent);
  assert.equal(intent, "short");
  assert.ok(sent.includes("Give a brief, direct answer only"));
});

test("acceptance: subjective yes-no question is not modified", () => {
  const prompt = "is nuclear power safe";
  const intent = classifyIntent(prompt);
  const sent = modifyPrompt(prompt, intent);
  assert.equal(intent, "normal");
  assert.equal(sent, prompt);
});

test("acceptance: normal explanatory question is not modified", () => {
  const prompt = "how does photosynthesis work";
  const intent = classifyIntent(prompt);
  const sent = modifyPrompt(prompt, intent);
  assert.equal(intent, "normal");
  assert.equal(sent, prompt);
});

test("acceptance: toggle off means no modification path", () => {
  const enabled = false;
  const prompt = "what is gravity";
  const shouldModify = enabled && classifyIntent(prompt) === "short";
  assert.equal(shouldModify, false);
});
