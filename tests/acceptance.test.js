const test = require("node:test");
const assert = require("node:assert/strict");

const { classifyIntent } = require("../src/intent-classifier");
const { modifyPrompt, SHORT_SUFFIX } = require("../src/prompt-modifier");
const intercept = require("../src/content-script");
const { siteConfig } = require("../src/site-config");

function fakeNode(matchesSelector) {
  return {
    closest(selector) {
      return matchesSelector(selector) ? this : null;
    },
    innerText: "",
  };
}

function fakeDocument(queryResult) {
  return {
    querySelector() {
      return queryResult;
    },
  };
}

test("acceptance: definition/objective-fact gets length instruction in outgoing prompt", () => {
  const cases = [
    "what does ephemeral mean",
    "What is photosynthesis?",
    "Who is the CEO of Microsoft?",
    "When did World War 2 end?",
    "How many continents are there?",
  ];

  for (const prompt of cases) {
    const sent = intercept.buildOutgoingPrompt(
      prompt,
      true,
      classifyIntent,
      modifyPrompt
    );
    assert.equal(classifyIntent(prompt), "short", prompt);
    assert.ok(sent.endsWith(SHORT_SUFFIX), prompt);
    assert.ok(sent.startsWith(prompt), prompt);
  }
});

test("acceptance: subjective yes-no is not modified", () => {
  const prompt = "is nuclear power safe";
  const sent = intercept.buildOutgoingPrompt(
    prompt,
    true,
    classifyIntent,
    modifyPrompt
  );
  assert.equal(classifyIntent(prompt), "normal");
  assert.equal(sent, prompt);
});

test("acceptance: normal explanatory question is not modified", () => {
  const prompt = "how does photosynthesis work";
  const sent = intercept.buildOutgoingPrompt(
    prompt,
    true,
    classifyIntent,
    modifyPrompt
  );
  assert.equal(classifyIntent(prompt), "normal");
  assert.equal(sent, prompt);
});

test("acceptance: toggle OFF never modifies even for short-answer prompts", () => {
  const prompt = "what is gravity";
  assert.equal(classifyIntent(prompt), "short");

  const sent = intercept.buildOutgoingPrompt(
    prompt,
    false,
    classifyIntent,
    modifyPrompt
  );
  assert.equal(sent, prompt);
  assert.equal(intercept.shouldModify(false), false);
  assert.equal(intercept.shouldModify(true), true);
});

test("acceptance: missing DOM selectors fail silently (no throw, no input)", () => {
  const chatgpt = siteConfig["chatgpt.com"];
  const claude = siteConfig["claude.ai"];

  assert.equal(
    intercept.findPrimaryInput(chatgpt.inputSelector, fakeDocument(null)),
    null
  );
  assert.equal(
    intercept.findPrimaryInput(claude.inputSelector, fakeDocument(null)),
    null
  );
  assert.equal(
    intercept.findComposerInput(null, chatgpt.inputSelector),
    null
  );
  assert.equal(
    intercept.findSendButton(fakeNode(() => false), chatgpt.sendButtonSelector),
    null
  );

  // Simulates content-script path when selectors miss: do nothing, don't throw.
  assert.doesNotThrow(() => {
    const input = intercept.findPrimaryInput(
      chatgpt.inputSelector,
      fakeDocument(null)
    );
    if (!input) {
      return;
    }
    throw new Error("should not modify when selector misses");
  });
});

test("acceptance: Enter only intercepts when target is inside the composer", () => {
  const chatgpt = siteConfig["chatgpt.com"];
  const selector = intercept.normalizeSelectors(chatgpt.inputSelector);

  const insideComposer = fakeNode((sel) => sel === selector);
  const outsideComposer = fakeNode(() => false);

  assert.equal(
    intercept.findComposerInput(insideComposer, chatgpt.inputSelector),
    insideComposer
  );
  assert.equal(
    intercept.findComposerInput(outsideComposer, chatgpt.inputSelector),
    null
  );

  // Unrelated Enter must not resolve to a page-wide fallback input.
  assert.equal(
    intercept.findComposerInput({ closest: () => null }, chatgpt.inputSelector),
    null
  );
});

test("acceptance: send-button path scopes input to the button's form", () => {
  const chatgpt = siteConfig["chatgpt.com"];
  const localInput = { id: "local" };
  const otherInput = { id: "other" };

  const form = {
    querySelector() {
      return localInput;
    },
  };

  const sendButton = {
    closest(sel) {
      return sel === "form" ? form : null;
    },
  };

  const found = intercept.findInputNearSendButton(
    sendButton,
    chatgpt.inputSelector,
    fakeDocument(otherInput)
  );
  assert.equal(found, localInput);

  // No local form match → fall back to document query.
  const orphanButton = {
    closest() {
      return null;
    },
    parentElement: null,
  };
  assert.equal(
    intercept.findInputNearSendButton(
      orphanButton,
      chatgpt.inputSelector,
      fakeDocument(otherInput)
    ),
    otherInput
  );
});

test("acceptance: textarea read/write uses value, not innerText", () => {
  const textarea = {
    tagName: "TEXTAREA",
    value: "what is gravity",
    innerText: "",
    setSelectionRange() {},
    events: [],
    dispatchEvent(event) {
      this.events.push(event.type);
      return true;
    },
  };

  assert.equal(intercept.readInputText(textarea), "what is gravity");
  intercept.writeInputText(textarea, "what is gravity\n\n(short)");
  assert.equal(textarea.value, "what is gravity\n\n(short)");
  assert.ok(textarea.events.includes("input"));
});

test("acceptance: IME composition Enter is ignored", () => {
  assert.equal(intercept.isSendEnter({ key: "Enter", isComposing: true }), false);
  assert.equal(intercept.isSendEnter({ key: "Enter", keyCode: 229 }), false);
  assert.equal(intercept.isSendEnter({ key: "Enter", shiftKey: true }), false);
  assert.equal(intercept.isSendEnter({ key: "Enter" }), true);
});

test("acceptance: SPA remount resilience via document-level delegation helpers", () => {
  // After a SPA remount the old input node is gone; delegation still finds the new one
  // via querySelector / closest on whatever is currently in the document.
  const chatgpt = siteConfig["chatgpt.com"];
  const oldInput = fakeNode(() => false);
  const newInput = fakeNode((sel) => {
    return sel === intercept.normalizeSelectors(chatgpt.inputSelector);
  });

  assert.equal(
    intercept.findComposerInput(oldInput, chatgpt.inputSelector),
    null
  );
  assert.equal(
    intercept.findComposerInput(newInput, chatgpt.inputSelector),
    newInput
  );
  assert.equal(
    intercept.findPrimaryInput(chatgpt.inputSelector, fakeDocument(newInput)),
    newInput
  );

  // Enter + send paths still recognized after "remount".
  assert.equal(intercept.isSendEnter({ key: "Enter" }), true);
  assert.equal(
    intercept.findSendButton(
      {
        closest(sel) {
          return sel.includes("send-button") || sel.includes("Send") ? this : null;
        },
      },
      chatgpt.sendButtonSelector
    ) !== null,
    true
  );
});

test("acceptance: host config resolves chatgpt.com and claude.ai", () => {
  assert.ok(intercept.getHostConfig(siteConfig, "chatgpt.com"));
  assert.ok(intercept.getHostConfig(siteConfig, "claude.ai"));
  assert.ok(intercept.getHostConfig(siteConfig, "www.chatgpt.com"));
  assert.equal(
    intercept.getHostConfig(siteConfig, "example.com"),
    siteConfig._default
  );
});
