"use strict";

const fs = require("fs/promises");
const path = require("path");
const cheerio = require("cheerio");

const DEFAULT_URL = "https://www.oscars.org/oscars/ceremonies/2026";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "categories.json");

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
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

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getNomineeFromRow($row) {
  const preferredSelectors = [
    ".views-field-title",
    ".field--name-field-awardee",
    ".field--name-field-award-people",
    ".field--name-field-award-film",
    "h4",
    "h3"
  ];

  for (const selector of preferredSelectors) {
    const text = normalizeWhitespace($row.find(selector).first().text());
    if (text) {
      return text;
    }
  }

  const fallback = normalizeWhitespace($row.text());
  if (!fallback) {
    return "";
  }

  return fallback.split("  ")[0].split("\n")[0].trim();
}

function extractWithViewGrouping($root) {
  const categories = [];
  $root.find(".view-grouping").each((_, group) => {
    const $group = $root.find(group);
    const name = normalizeWhitespace(
      $group.find(".view-grouping-header").first().text()
    );
    if (!name) {
      return;
    }

    const nominees = [];
    $group.find(".views-row").each((__, row) => {
      const nominee = getNomineeFromRow($group.find(row));
      if (
        nominee &&
        nominee.toLowerCase() !== "nominees" &&
        !nominee.toLowerCase().includes("nominees to be determined")
      ) {
        nominees.push(nominee);
      }
    });

    const uniqueNominees = Array.from(new Set(nominees));
    if (uniqueNominees.length) {
      categories.push({ name, nominees: uniqueNominees });
    }
  });

  return categories;
}

function parseNomineesFromText(rawText) {
  const lines = rawText
    .split("\n")
    .map((line) => decodeEntities(normalizeWhitespace(line)))
    .filter(Boolean);

  const nomineesIndex = lines.findIndex((line) => line === "NOMINEES");
  const startIndex = nomineesIndex === -1 ? 0 : nomineesIndex + 1;

  const categories = [];

  const isCategoryLine = (index) =>
    Boolean(lines[index]) &&
    lines[index] !== "Nominees" &&
    lines[index] !== "NOMINEES" &&
    lines[index + 1] === "Nominees";

  let i = startIndex;
  while (i < lines.length) {
    if (!isCategoryLine(i)) {
      i += 1;
      continue;
    }

    const categoryName = lines[i];
    const nominees = [];
    i += 2;

    while (i < lines.length && !isCategoryLine(i)) {
      const nominee = lines[i];
      const detail = lines[i + 1] || "";

      if (
        nominee &&
        nominee !== "Nominees" &&
        nominee !== "NOMINEES" &&
        !nominee.toLowerCase().includes("nominees to be determined")
      ) {
        if (
          categoryName.toLowerCase().includes("international feature film") &&
          detail &&
          !isCategoryLine(i + 1)
        ) {
          nominees.push(`${nominee} — ${detail}`);
          i += 2;
          continue;
        }

        nominees.push(nominee);
      }

      if (detail && !isCategoryLine(i + 1)) {
        i += 2;
      } else {
        i += 1;
      }
    }

    if (nominees.length) {
      categories.push({ name: categoryName, nominees });
    }
  }

  return categories;
}

async function readExistingData() {
  try {
    const existing = await fs.readFile(OUTPUT_PATH, "utf8");
    return JSON.parse(existing);
  } catch (error) {
    return null;
  }
}

function mergePoints(existingData, categories) {
  if (!existingData || !Array.isArray(existingData.categories)) {
    return categories;
  }

  const pointsById = new Map();
  existingData.categories.forEach((category) => {
    if (category.id && category.points) {
      pointsById.set(category.id, category.points);
    }
  });

  return categories.map((category) => ({
    ...category,
    points: pointsById.get(category.id) ?? category.points
  }));
}

async function main() {
  const url = process.argv[2] || DEFAULT_URL;
  const yearMatch = url.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html"
  };
  const proxyHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/plain"
  };

  let response = await fetch(url, { headers });
  let useTextFallback = false;

  if (response.status === 403) {
    const proxyUrl = `https://r.jina.ai/http://${url.replace(
      /^https?:\/\//,
      ""
    )}`;
    response = await fetch(proxyUrl, { headers: proxyHeaders });
    if (response.status === 403) {
      response = await fetch(proxyUrl);
    }
    useTextFallback = true;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch nominees: ${response.status}`);
  }

  const content = await response.text();
  let categories = [];

  if (useTextFallback) {
    categories = parseNomineesFromText(content);
  } else {
    const $ = cheerio.load(content);
    const $root = $("main").length ? $("main") : $("body");
    categories = extractWithViewGrouping($root);
  }

  if (!categories.length) {
    throw new Error(
      "Could not find nominees on the page. The site structure may have changed."
    );
  }

  const normalized = categories.map((category) => ({
    id: slugify(category.name),
    name: category.name,
    points: category.name.toLowerCase() === "best picture" ? 2 : 1,
    nominees: category.nominees
  }));

  const existingData = await readExistingData();
  const mergedCategories = mergePoints(existingData, normalized);
  const pointsPerCategory =
    existingData && existingData.pointsPerCategory
      ? existingData.pointsPerCategory
      : 1;

  const output = {
    year,
    pointsPerCategory,
    categories: mergedCategories
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Saved ${mergedCategories.length} categories to data/categories.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
