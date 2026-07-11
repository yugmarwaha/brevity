const test = require("node:test");
const assert = require("node:assert/strict");

const { classifyIntent } = require("../src/intent-classifier");

test("classifies definition prompts as short", () => {
  assert.equal(classifyIntent("  What is photosynthesis? "), "short");
  assert.equal(classifyIntent("meaning of entropy"), "short");
  assert.equal(classifyIntent("Define gravity"), "short");
});

test("classifies objective fact prompts as short", () => {
  assert.equal(classifyIntent("Who is the CEO of Microsoft?"), "short");
  assert.equal(classifyIntent("When did World War 2 end?"), "short");
  assert.equal(classifyIntent("How many continents are there?"), "short");
  assert.equal(classifyIntent("What year was NASA founded?"), "short");
});

test("classifies factual yes/no prompts as short", () => {
  assert.equal(classifyIntent("Is Mount Everest taller than K2?"), "short");
  assert.equal(classifyIntent("Did Apollo 11 land in 1969?"), "short");
  assert.equal(classifyIntent("Is Tokyo in Japan?"), "short");
});

test("does not classify subjective yes/no prompts as short", () => {
  assert.equal(classifyIntent("Is nuclear power safe?"), "normal");
  assert.equal(classifyIntent("Should I learn Rust?"), "normal");
  assert.equal(classifyIntent("Is this a good career choice?"), "normal");
});

test("keeps normal explanatory questions as normal", () => {
  assert.equal(classifyIntent("How does photosynthesis work?"), "normal");
  assert.equal(classifyIntent("Why is the sky blue?"), "normal");
  assert.equal(
    classifyIntent("Can you explain the tradeoffs of monoliths vs microservices?"),
    "normal"
  );
});
