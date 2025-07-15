const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
`👋 Hello ${ctx.from.first_name || 'there'}! I'm StudyGuardianBot.
I help you focus, take breaks, stay motivated, and manage your tasks.

Type /help to see everything I can do.`);
});

bot.command('help', (ctx) => {
  ctx.reply(
`📚 StudyGuardianBot – Commands

/start    Welcome message
/study    25‑min focus timer (pause‑able)
/break    Pause study for a 5‑min break
/pause    Pause study without break
/resume   Resume paused study
/stop     Cancel the current session and reset
/quote    Random motivational quote
/todo     Add/view/remove tasks
/clear    Clear all tasks
/reminder Set a reminder  (e.g. /reminder 10 Drink water)
/help     This help message`);
});

const sessions = {};

function startStudy(ctx, uid, durationMs) {
  const end = Date.now() + durationMs;

  sessions[uid] = sessions[uid] || { pomos: 0 };
  Object.assign(sessions[uid], { endTime: end, remainingMs: null, onBreak: false, paused: false });

  sessions[uid].timerId = setTimeout(() => {
    sessions[uid].pomos += 1;
    sessions[uid].timerId = null;
    ctx.reply('✅ Study session complete!');

    const shortBreak = 5 * 60 * 1000;
    const longBreak  = 15 * 60 * 1000;

    if (sessions[uid].pomos % 4 === 0) {
      ctx.reply('🛋️ 4 pomodoros done! Enjoy a 15‑minute long break.');
      setTimeout(() => ctx.reply('⏰ Long break over! Ready to focus again?'), longBreak);
    } else {
      ctx.reply('☕ Take a 5‑minute short break.');
      setTimeout(() => ctx.reply('⏰ Break over! Let’s dive back in.'), shortBreak);
    }
  }, durationMs);

  ctx.reply(`⏳ Focus for the next ${Math.round(durationMs / 60000)} minutes!`);
}

bot.command('study', (ctx) => {
  const uid = ctx.from.id;
  const s   = sessions[uid];

  if (s?.timerId && !s.onBreak && !s.paused)
    return ctx.reply('You’re already in a study session. Type /break or /pause if you need to stop.');

  if (s?.onBreak)
    return ctx.reply('Finish your break first; I’ll auto‑resume afterward.');

  if (s?.paused && s.remainingMs) {
    s.paused = false;
    ctx.reply('▶️ Resuming your paused study session.');
    return startStudy(ctx, uid, s.remainingMs);
  }

  startStudy(ctx, uid, 25 * 60 * 1000);
});

bot.command('break', (ctx) => {
  const uid = ctx.from.id;
  const s   = sessions[uid];

  if (!s || !s.timerId || s.onBreak)
    return ctx.reply('You’re not in an active study session.');

  clearTimeout(s.timerId);
  s.remainingMs = s.endTime - Date.now();
  s.timerId = null;
  s.onBreak = true;

  ctx.reply('⏸️ Study paused. Enjoy a 5‑minute break!');

  setTimeout(() => {
    ctx.reply('⏰ Break over! Resuming your study.');
    startStudy(ctx, uid, s.remainingMs);
  }, 5 * 60 * 1000);
});

bot.command('pause', (ctx) => {
  const uid = ctx.from.id;
  const s   = sessions[uid];

  if (!s || !s.timerId || s.paused)
    return ctx.reply("You don't have an active study timer to pause.");

  clearTimeout(s.timerId);
  s.remainingMs = s.endTime - Date.now();
  s.timerId = null;
  s.paused = true;

  ctx.reply(`⏸️ Timer paused with about ${Math.ceil(s.remainingMs / 60000)} min left. Type /resume to continue.`);
});

bot.command('resume', (ctx) => {
  const uid = ctx.from.id;
  const s   = sessions[uid];

  if (!s || !s.paused)
    return ctx.reply("You don't have a paused session. Type /study to start one.");

  ctx.reply('▶️ Resuming your study session!');
  s.paused = false;
  startStudy(ctx, uid, s.remainingMs);
});

bot.command('stop', (ctx) => {
  const uid = ctx.from.id;
  const s = sessions[uid];

  if (!s || (!s.timerId && !s.paused && !s.onBreak))
    return ctx.reply("You don't have any active or paused session to stop.");

  if (s.timerId) clearTimeout(s.timerId);
  delete sessions[uid];

  ctx.reply('🛑 Study session stopped. Use /study to start a new one anytime.');
});

function getQuote() {
  return new Promise((resolve, reject) => {
    axios.get('https://zenquotes.io/api/random')
      .then(r => resolve(`${r.data[0].q} — ${r.data[0].a}`))
      .catch(() => reject("Couldn't fetch a quote right now."));
  });
}

bot.command('quote', (ctx) =>
  getQuote()
    .then(q => ctx.reply(`💡 "${q}"`))
    .catch(err => ctx.reply(`⚠️ ${err}`))
);

const todos = {};

bot.command('todo', (ctx) => {
  const uid = ctx.from.id;
  const text = ctx.message.text.split(' ').slice(1).join(' ');

  if (!todos[uid]) todos[uid] = [];

  if (!text) {
    if (todos[uid].length === 0) return ctx.reply('Your to‑do list is empty.');
    const list = todos[uid].map((t, i) => `${i + 1}. ${t}`).join('\n');
    return ctx.reply(`📋 Your to‑dos:\n${list}`);
  }

  if (text.startsWith('remove')) {
    const n = parseInt(text.split(' ')[1]) - 1;
    if (!isNaN(n) && todos[uid][n]) {
      const removed = todos[uid].splice(n, 1);
      return ctx.reply(`🗑️ Removed “${removed}”.`);
    }
    return ctx.reply("Couldn't find that item. Try 'remove 1'.");
  }

  todos[uid].push(text);
  ctx.reply(`✅ Added “${text}” to your list.`);
});

bot.command('clear', (ctx) => {
  todos[ctx.from.id] = [];
  ctx.reply('🧼 To‑do list cleared.');
});

bot.command('reminder', (ctx) => {
  const parts = ctx.message.text.split(' ').slice(1);
  const minutes = parseInt(parts[0]);
  const msg = parts.slice(1).join(' ') || 'Time’s up!';

  if (isNaN(minutes) || minutes <= 0)
    return ctx.reply('Usage: /reminder <minutes> <message>');

  ctx.reply(`🔔 Okay! I’ll remind you in ${minutes} min: “${msg}”`);
  setTimeout(() => ctx.reply(`⏰ Reminder: ${msg}`), minutes * 60 * 1000);
});

bot.launch();
console.log('StudyGuardianBot running…');
