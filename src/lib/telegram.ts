export async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[Telegram] sendMessage failed:", body);
    }
  } catch (err) {
    console.error("[Telegram] sendMessage error:", err);
  }
}
