const test = require("node:test");
const assert = require("node:assert/strict");

const { ConciseAISettings } = require("../src/settings");
const { classifyIntent } = require("../src/intent-classifier");
const { parseIntentLabel, classifyWithApi } = require("../src/api-classifier");
const { resolveIntent } = require("../src/classify-router");
const { siteConfig } = require("../src/site-config");
const intercept = require("../src/content-script");

test("settings default to regex mode", () => {
  const s = ConciseAISettings.normalize({});
  assert.equal(s.classifierMode, "regex");
  assert.equal(s.enabled, true);
  assert.equal(ConciseAISettings.usesApi(s), false);
});

test("settings enable API only when key present", () => {
  const s = ConciseAISettings.normalize({
    classifierMode: "api",
    apiKey: "sk-test",
    apiModel: "cheap-model",
  });
  assert.equal(s.classifierMode, "api");
  assert.equal(ConciseAISettings.usesApi(s), true);
});

test("pageSafeFromStorage never includes apiKey", () => {
  const safe = ConciseAISettings.pageSafeFromStorage({
    enabled: true,
    classifierMode: "api",
    apiKey: "sk-secret",
    apiBaseUrl: "https://api.openai.com/v1",
    apiModel: "x",
  });
  assert.equal(safe.classifierMode, "api");
  assert.equal(safe.enabled, true);
  assert.equal("apiKey" in safe, false);
  assert.equal("apiBaseUrl" in safe, false);
  assert.equal("apiModel" in safe, false);
  assert.equal(ConciseAISettings.wantsApiPrefetch(safe), true);
  assert.equal(
    ConciseAISettings.wantsApiPrefetch({ classifierMode: "regex" }),
    false
  );
});

test("parseIntentLabel accepts short/normal only", () => {
  assert.equal(parseIntentLabel("short"), "short");
  assert.equal(parseIntentLabel(' "NORMAL" '), "normal");
  assert.equal(parseIntentLabel("maybe short"), "normal");
});

test("resolveIntent uses regex when mode is regex", async () => {
  const intent = await resolveIntent("what is gravity", { classifierMode: "regex" }, {
    Settings: ConciseAISettings,
    classifyIntent,
    classifyWithApi: async () => {
      throw new Error("should not call api");
    },
  });
  assert.equal(intent, "short");
});

test("resolveIntent falls back to regex when API throws", async () => {
  const intent = await resolveIntent("what is gravity", {
    classifierMode: "api",
    apiKey: "sk-test",
    apiModel: "x",
  }, {
    Settings: ConciseAISettings,
    classifyIntent,
    classifyWithApi: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(intent, "short");
});

test("classifyWithApi posts OpenAI-compatible payload", async () => {
  let calledUrl = "";
  let body = null;
  const fakeFetch = async (url, options) => {
    calledUrl = url;
    body = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "short" } }],
      }),
    };
  };

  const intent = await classifyWithApi(
    "define entropy",
    {
      apiKey: "sk-test",
      apiBaseUrl: "https://api.groq.com/openai/v1",
      apiModel: "llama-cheap",
    },
    fakeFetch
  );

  assert.equal(intent, "short");
  assert.equal(calledUrl, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(body.model, "llama-cheap");
  assert.equal(body.temperature, 0);
});

test("unknown hosts fall back to _default site config", () => {
  assert.equal(
    intercept.getHostConfig(siteConfig, "example.com"),
    siteConfig._default
  );
  assert.ok(intercept.getHostConfig(siteConfig, "gemini.google.com"));
  assert.ok(intercept.getHostConfig(siteConfig, "www.perplexity.ai"));
});
