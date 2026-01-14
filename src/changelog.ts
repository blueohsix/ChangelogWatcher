import { createHash } from "crypto";
import * as cheerio from "cheerio";
import { ReleaseSource } from "./config";
import { readHash, writeHash } from "./hash-store";
import * as log from "./logger";

export interface CheckResult {
  source: ReleaseSource;
  hasChanged: boolean;
  version?: string;
  formattedChanges?: string;
  error?: string;
}

interface ParsedContent {
  stableContent: string;
  version: string;
  formattedChanges: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

function computeHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function extractStableContent(html: string, sourceId: string): string {
  const $ = cheerio.load(html);

  $("script").remove();
  $("style").remove();
  $("link").remove();
  $("meta").remove();
  $("noscript").remove();
  $("iframe").remove();

  if (sourceId === "gemini") {
    const mainContent =
      $("main").text() || $("article").text() || $("body").text();
    return mainContent.replace(/\s+/g, " ").trim();
  }

  return $("body").text().replace(/\s+/g, " ").trim();
}

async function fetchContent(url: string): Promise<string | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  return response.ok ? response.text() : null;
}

function extractMarkdownVersion(content: string): {
  version: string;
  changes: string;
} {
  const lines = content.split("\n");
  let latestVersionInfo = "";
  let version = "";
  let foundFirstVersion = false;

  for (const line of lines) {
    const versionMatch = line.match(/^#+\s*\[?(\d+\.\d+\.\d+[^\]]*)\]?/);

    if (versionMatch) {
      if (!foundFirstVersion) {
        foundFirstVersion = true;
        version = versionMatch[1];
        latestVersionInfo += line + "\n";
      } else {
        break; // Found second version, stop
      }
    } else if (foundFirstVersion) {
      latestVersionInfo += line + "\n";
    }
  }

  return {
    version: version || "Unknown",
    changes: latestVersionInfo.trim() || content.substring(0, 1000),
  };
}

function createGenericUpdate(source: ReleaseSource): {
  version: string;
  formattedChanges: string;
} {
  return {
    version: "Update detected",
    formattedChanges: `${source.name} release notes have been updated.\n\nCheck the latest changes here:\n${source.releasePageUrl}`,
  };
}

// =============================================================================
// Parser Functions - Each handles fetch + parse for its type
// =============================================================================

async function parseMarkdown(
  source: ReleaseSource
): Promise<ParsedContent | null> {
  const content = await fetchContent(source.url);
  if (!content) return null;

  const { version, changes } = extractMarkdownVersion(content);

  return {
    stableContent: content,
    version,
    formattedChanges: changes,
  };
}

async function parseHashOnly(
  source: ReleaseSource
): Promise<ParsedContent | null> {
  const content = await fetchContent(source.url);
  if (!content) return null;

  const { version, formattedChanges } = createGenericUpdate(source);

  return {
    stableContent: extractStableContent(content, source.id),
    version,
    formattedChanges,
  };
}

async function parseWayback(
  source: ReleaseSource
): Promise<ParsedContent | null> {
  // Check Wayback Machine availability
  const availabilityUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(source.url)}`;
  const availabilityResponse = await fetch(availabilityUrl);

  if (!availabilityResponse.ok) return null;

  const availability = await availabilityResponse.json();
  const snapshot = availability.archived_snapshots?.closest;

  if (!snapshot?.available) return null;

  log.info(`  Found Wayback snapshot from ${snapshot.timestamp}`);

  // Fetch archived content
  const content = await fetchContent(snapshot.url);
  if (!content) return null;

  const { version, formattedChanges } = createGenericUpdate(source);

  return {
    stableContent: extractStableContent(content, source.id),
    version,
    formattedChanges,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

export async function checkSource(source: ReleaseSource): Promise<CheckResult> {
  try {
    // Parse content based on type
    let parsed: ParsedContent | null;

    switch (source.parserType) {
      case "markdown":
        parsed = await parseMarkdown(source);
        break;
      case "hash-only":
        parsed = await parseHashOnly(source);
        break;
      case "wayback":
        parsed = await parseWayback(source);
        break;
      default:
        return { source, hasChanged: false, error: `Unknown parser type` };
    }

    if (!parsed) {
      return { source, hasChanged: false, error: "Failed to fetch content" };
    }

    // Compare hashes
    const newHash = computeHash(parsed.stableContent);
    const oldHash = readHash(source);

    if (oldHash === newHash) {
      return { source, hasChanged: false };
    }

    // Change detected
    writeHash(source, newHash);

    return {
      source,
      hasChanged: true,
      version: parsed.version,
      formattedChanges: parsed.formattedChanges,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { source, hasChanged: false, error: errorMsg };
  }
}
