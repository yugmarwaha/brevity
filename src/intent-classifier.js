function normalizeInput(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const SUBJECTIVE_CUE =
  /\b(safe|unsafe|good|bad|better|best|worse|worth|ethical|moral|right|wrong|recommend|opinion|prefer|like|love|hate|easy|hard|difficult|should i|should we|pros|cons|tradeoffs?|strategy|approach|way to|advice)\b/;

function hasSubjectiveCue(text) {
  return SUBJECTIVE_CUE.test(text);
}

function isDefinitionQuestion(text) {
  if (hasSubjectiveCue(text)) {
    return false;
  }
  return (
    /^(what is|what's)\s+.+/.test(text) ||
    /^(meaning of|define)\s+.+/.test(text) ||
    /^what does\s+.+\s+mean\b/.test(text)
  );
}

function isObjectiveFactQuestion(text) {
  if (hasSubjectiveCue(text)) {
    return false;
  }
  return (
    /^(who is|who was|who were|who did)\s+.+/.test(text) ||
    /^(when did|when was|when were|when is)\s+.+/.test(text) ||
    /^how many\s+.+/.test(text) ||
    /^how much\s+.+/.test(text) ||
    /^what (year|date)\s+.+/.test(text)
  );
}

function isFactualYesNoQuestion(text) {
  const yesNoStart = /^(is|are|was|were|do|does|did|can|could|has|have|had)\b/;
  if (!yesNoStart.test(text)) {
    return false;
  }

  if (hasSubjectiveCue(text)) {
    return false;
  }

  const factualCue =
    /\b\d{3,4}\b|\bthan\b|\b(year|date|population|capital|distance|height|weight|age|born|died|founded|invented|occur|happen|located)\b/;
  if (factualCue.test(text)) {
    return true;
  }

  // Location relation questions are typically factual/verifiable.
  if (/^is\s+.+\s+in\s+.+/.test(text)) {
    return true;
  }

  return false;
}

function classifyIntent(text) {
  const normalized = normalizeInput(text);
  if (!normalized) {
    return "normal";
  }

  if (isDefinitionQuestion(normalized)) {
    return "short";
  }

  if (isObjectiveFactQuestion(normalized)) {
    return "short";
  }

  if (isFactualYesNoQuestion(normalized)) {
    return "short";
  }

  return "normal";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { classifyIntent };
}

globalThis.ConciseAI = globalThis.ConciseAI || {};
globalThis.ConciseAI.classifyIntent = classifyIntent;
