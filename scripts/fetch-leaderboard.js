"use strict";

const fs = require("fs/promises");
const path = require("path");

const CATEGORIES_PATH = path.join(__dirname, "..", "data", "categories.json");
const CONFIG_PATH = path.join(__dirname, "..", "js", "config.js");

async function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) return { url, key };
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const urlMatch = raw.match(/SUPABASE_URL\s*=\s*"([^"]+)"/);
    const keyMatch = raw.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/);
    if (urlMatch && keyMatch) return { url: urlMatch[1], key: keyMatch[1] };
  } catch (_) {}
  throw new Error(
    "Set SUPABASE_URL and SUPABASE_ANON_KEY (env vars or js/config.js)"
  );
}

async function main() {
  let categoriesData;
  try {
    const raw = await fs.readFile(CATEGORIES_PATH, "utf8");
    categoriesData = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      "Could not read categories. Run npm run fetch-nominees first: " + error.message
    );
  }

  const ceremonyYear = categoriesData.year || new Date().getFullYear().toString();
  const { url, key } = await getSupabaseConfig();

  const apiUrl = `${url.replace(/\/$/, "")}/rest/v1/leaderboard_picks?select=username,picks_by_category`;
  const response = await fetch(apiUrl, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase returned ${response.status}. Database may be unavailable.`
    );
  }

  const picks = await response.json();
  if (!Array.isArray(picks)) {
    throw new Error("Unexpected response from Supabase");
  }

  const output = {
    ceremonyYear,
    finalizedAt: new Date().toISOString(),
    picks,
  };

  const outputPath = path.join(__dirname, "..", "data", `leaderboard-${ceremonyYear}.json`);
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved ${picks.length} picks to data/leaderboard-${ceremonyYear}.json`);

  const availablePath = path.join(__dirname, "..", "data", "available-years.json");
  let years = [];
  try {
    const raw = await fs.readFile(availablePath, "utf8");
    years = JSON.parse(raw);
    if (!Array.isArray(years)) years = [];
  } catch (_) {}
  if (picks.length > 0 && !years.includes(ceremonyYear)) {
    years.push(ceremonyYear);
    years.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    await fs.writeFile(availablePath, JSON.stringify(years, null, 2));
    console.log(`Updated data/available-years.json`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
