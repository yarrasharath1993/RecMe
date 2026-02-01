import https from 'https';

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<void> {
  // Send message via Telegram Bot API
  // This is I/O - runner's responsibility
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const data = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

export async function sendTelegramDraft(draft: any, config: any): Promise<void> {
  // Send social draft to Telegram
  // Requires human approval flag check
  
  if (!config.telegram_bot_token || !config.telegram_chat_id) {
    throw new Error('Telegram credentials not configured');
  }

  // Check if approval is required
  if (draft.metadata.requires_approval) {
    console.log(`Draft ${draft.draft_id} requires approval, skipping auto-send`);
    return;
  }

  // Send the draft content
  await sendTelegramMessage(
    config.telegram_bot_token,
    config.telegram_chat_id,
    draft.content
  );
}
