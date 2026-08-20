const STOPWORDS = new Set(`
a an the and or but if while of to in on for from with by as at is are was were be been being
this that these those it its they them their you your we our i me my he she his her not no
can will would should could may might must do does did done have has had having
about into over after before than then so than also just more most other some any each
`.trim().split(/\s+/));

const TARGETS = {
  short: { sentences: 3, ratio: 0.22 },
  medium: { sentences: 6, ratio: 0.4 },
  long: { sentences: 10, ratio: 0.6 },
};

function splitSentences(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const matches = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return (matches || [cleaned]).map((sentence) => sentence.trim()).filter(Boolean);
}

function tokenize(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function wordFrequencies(sentences) {
  const frequencies = new Map();
  for (const sentence of sentences) {
    for (const word of tokenize(sentence)) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
  }
  return frequencies;
}

function scoreSentence(sentence, index, total, frequencies) {
  const words = tokenize(sentence);
  if (words.length === 0) return 0;

  let score = 0;
  for (const word of words) {
    score += frequencies.get(word) || 0;
  }
  score /= words.length;

  const positionBoost = index === 0 || index === total - 1 ? 1.15 : 1;
  const lengthPenalty = words.length < 6 || words.length > 40 ? 0.85 : 1;
  return score * positionBoost * lengthPenalty;
}

export function summarizeLocally(text, length = "short") {
  const source = String(text || "").trim();
  const sentences = splitSentences(source);
  if (sentences.length === 0) return "";
  if (sentences.length === 1) return sentences[0];

  const selected = TARGETS[length] ? length : "short";
  const targetCount = Math.max(
    1,
    Math.min(
      sentences.length,
      Math.max(
        selected === "short" ? 2 : selected === "medium" ? 3 : 5,
        Math.round(sentences.length * TARGETS[selected].ratio)
      ),
      TARGETS[selected].sentences
    )
  );

  if (targetCount >= sentences.length) {
    return sentences.join(" ");
  }

  const frequencies = wordFrequencies(sentences);
  const ranked = sentences.map((sentence, index) => ({
    sentence,
    index,
    score: scoreSentence(sentence, index, sentences.length, frequencies),
  }));

  const chosen = ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  return chosen.join(" ");
}
