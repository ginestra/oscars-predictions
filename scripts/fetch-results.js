"use strict";

const fs = require("fs/promises");
const path = require("path");

const CATEGORIES_PATH = path.join(__dirname, "..", "data", "categories.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "results.json");

function normalizeWhitespace(text) {
  return text ? text.replace(/\s+/g, " ").trim() : "";
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const ACTING_CATEGORIES = new Set([
  "actor in a leading role",
  "actor in a supporting role",
  "actress in a leading role",
  "actress in a supporting role"
]);
const DIRECTING_CATEGORY = "directing";

function shouldAppendDetail(categoryName) {
  const normalized = categoryName.toLowerCase();
  return ACTING_CATEGORIES.has(normalized) || normalized === DIRECTING_CATEGORY;
}

function formatNomineeLabel(categoryName, nominee, detail) {
  if (!detail || detail === nominee) {
    return nominee;
  }
  if (categoryName.toLowerCase().includes("international feature film")) {
    return `${nominee} — ${detail}`;
  }
  if (shouldAppendDetail(categoryName)) {
    return `${nominee} (${detail})`;
  }
  return nominee;
}

function parseWinnersFromText(rawText, categories) {
  const lines = rawText
    .split("\n")
    .map((line) => decodeEntities(normalizeWhitespace(line)))
    .filter(Boolean);

  const winnersByCategoryId = {};
  const isCategoryLine = (index) =>
    Boolean(lines[index]) &&
    lines[index] !== "Winner" &&
    lines[index + 1] === "Winner";
  const isDetailLine = (index) =>
    Boolean(lines[index]) &&
    lines[index] !== "Winner" &&
    lines[index] !== "Nominees" &&
    lines[index] !== "NOMINEES" &&
    !isCategoryLine(index);

  for (let i = 0; i < lines.length - 2; i += 1) {
    if (!isCategoryLine(i)) {
      continue;
    }
    const categoryName = lines[i];
    const winnerName = lines[i + 2];
    const detailCandidate = lines[i + 3] || "";
    const detail = isDetailLine(i + 3) ? detailCandidate : "";
    const category = categories.find((entry) => entry.name === categoryName);
    if (category && winnerName) {
      winnersByCategoryId[category.id] = formatNomineeLabel(
        categoryName,
        winnerName,
        detail
      );
    }
  }

  return winnersByCategoryId;
}

async function main() {
  let categoriesData;
  try {
    const raw = await fs.readFile(CATEGORIES_PATH, "utf8");
    categoriesData = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Could not read categories. Run npm run fetch-nominees first: ${error.message}`
    );
  }

  const categories = categoriesData.categories || [];
  const ceremonyYear = categoriesData.year || new Date().getFullYear().toString();

  if (!categories.length) {
    throw new Error("No categories found in data/categories.json");
  }

  const url = `https://r.jina.ai/http://www.oscars.org/oscars/ceremonies/${ceremonyYear}`;
  const headers = {
    Accept: "text/plain",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch results: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const winnersByCategoryId = parseWinnersFromText(text, categories);

  if (Object.keys(winnersByCategoryId).length === 0) {
    throw new Error(
      "No winners parsed. The Oscars site structure may have changed."
    );
  }

  const output = {
    winnersByCategoryId,
    finalizedAt: new Date().toISOString(),
    ceremonyYear
  };

  const outputJson = JSON.stringify(output, null, 2);
  await fs.writeFile(OUTPUT_PATH, outputJson);
  const resultsYearPath = path.join(__dirname, "..", "data", `results-${ceremonyYear}.json`);
  await fs.writeFile(resultsYearPath, outputJson);
  console.log(
    `Saved ${Object.keys(winnersByCategoryId).length} category results to data/results.json and data/results-${ceremonyYear}.json`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
