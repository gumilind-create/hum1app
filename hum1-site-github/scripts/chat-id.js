'use strict';
// Prints the chat ids that wrote to your bot. Usage: write "hello" to the bot in Telegram, then run: npm run chatid
require('dotenv').config();

const base = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
const token = process.env.TELEGRAM_BOT_TOKEN;

async function call(method) {
  const res = await fetch(`${base}/bot${token}/${method}`);
  return res.json();
}

(async () => {
  if (!token) { console.error('TELEGRAM_BOT_TOKEN is empty. Put the token from @BotFather into .env first.'); process.exit(1); }
  const me = await call('getMe');
  if (!me.ok) { console.error(`Telegram rejected the token: ${me.description}`); process.exit(1); }
  console.log(`Bot: @${me.result.username}`);
  const updates = await call('getUpdates');
  const chats = new Map();
  for (const u of updates.result || []) {
    const chat = (u.message || u.edited_message || u.channel_post || (u.my_chat_member || {})).chat;
    if (chat) chats.set(chat.id, chat);
  }
  if (!chats.size) { console.log('\nNo chats yet. Open the bot in Telegram, press Start (or add it to your group and write a message), then run this again.'); return; }
  console.log('\nFound chats. Put the id into TELEGRAM_CHAT_ID in .env:\n');
  for (const [id, c] of chats) console.log(`  ${id}   ${c.type}   ${c.title || [c.first_name, c.last_name].filter(Boolean).join(' ')}${c.username ? ` (@${c.username})` : ''}`);
})();
