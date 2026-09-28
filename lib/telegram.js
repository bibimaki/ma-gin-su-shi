export async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram environment variables are missing");
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      console.error("Telegram API error:", result);
      return { ok: false, skipped: false, error: result };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    console.error("Telegram request failed:", error);
    return { ok: false, skipped: false, error: error.message };
  }
}
