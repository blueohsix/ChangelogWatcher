import * as log from "./logger";

export interface SlackPayload {
  source: string;
  version: string;
  changes: string;
  test: string;
}

export interface SlackResult {
  success: boolean;
  error?: string;
}

export async function sendSlackNotification(
  webhookUrl: string,
  payload: SlackPayload
): Promise<SlackResult> {
  if (!webhookUrl) {
    return { success: false, error: "No webhook URL configured" };
  }

  const body = JSON.stringify(payload);
  log.info(`  POST ${webhookUrl}`);
  log.info(`  Payload: ${body}`);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      log.info(`  Response: ${response.status} OK`);
      return { success: true };
    }

    const text = await response.text();
    log.error(`  Response: ${response.status} ${text}`);
    return { success: false, error: `${response.status}: ${text}` };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log.error(`  Request failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
