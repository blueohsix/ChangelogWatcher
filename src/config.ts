import path from "path";

export type SourceId = "claude" | "gemini" | "chatgpt";

export interface ReleaseSource {
  id: SourceId;
  name: string;
  url: string;
  parserType: "markdown" | "hash-only" | "wayback";
  stateFile: string;
  releasePageUrl: string;
  slackWebhookUrl: string;
}

export const SOURCES: Record<SourceId, ReleaseSource> = {
  claude: {
    id: "claude",
    name: "Claude Code",
    url: "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md",
    parserType: "markdown",
    stateFile: "claude.json",
    releasePageUrl: "https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md",
    slackWebhookUrl: process.env.SLACK_WEBHOOK_CLAUDE || "",
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    url: "https://gemini.google/release-notes/",
    parserType: "hash-only",
    stateFile: "gemini.json",
    releasePageUrl: "https://gemini.google/release-notes/",
    slackWebhookUrl: process.env.SLACK_WEBHOOK_GEMINI || "",
  },
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://help.openai.com/en/articles/6825453-chatgpt-release-notes",
    parserType: "wayback",
    stateFile: "chatgpt.json",
    releasePageUrl:
      "https://help.openai.com/en/articles/6825453-chatgpt-release-notes",
    slackWebhookUrl: process.env.SLACK_WEBHOOK_CHATGPT || "",
  },
};

export const DATA_DIR = path.join(process.cwd(), ".data");
