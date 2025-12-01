require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const basicAuth = require('express-basic-auth');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot Setup
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

if (token) {
  bot = new TelegramBot(token, { polling: true });
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is missing. Telegram features will be disabled.');
  // Mock bot to prevent crashes
  bot = {
    onText: () => { },
    on: () => { },
    sendMessage: async () => { console.log('Mock Bot: Message sent (simulated)'); },
    answerCallbackQuery: async () => { console.log('Mock Bot: Callback answered (simulated)'); }
  };
}

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for simplicity with external scripts (Telegram, Charts)
}));
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Rate Limiter for Contact Form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// Basic Auth for Stats
const auth = basicAuth({
  users: { 'admin': process.env.ADMIN_PASSWORD || 'admin123' },
  challenge: true,
  realm: 'Kishamba Stats'
});

// Get IP geolocation
async function getIPInfo(ip) {
  try {
    // Skip localhost IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) {
      return {
        ip: 'localhost',
        city: 'Local',
        region: 'Development',
        country: 'Local',
        country_name: 'Local Development'
      };
    }

    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    return response.data;
  } catch (error) {
    console.error('Error getting IP info:', error.message);
    return { ip, city: 'Unknown', country: 'Unknown' };
  }
}

// Telegram Bot Commands with Buttons
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `👋 Привет! Я бот сайта Kishamba Portfolio.\n\nЯ буду отправлять вам уведомления о:\n• 👁 Посетителях сайта\n• 📥 Скачиваниях резюме\n• 💬 Новых сообщениях\n\nИспользуйте кнопки ниже для управления:`;

  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: '📊 Статистика' }, { text: '⚙️ Настройки' }],
        [{ text: '🌐 Открыть сайт' }, { text: 'ℹ️ Помощь' }]
      ],
      resize_keyboard: true
    }
  };

  bot.sendMessage(chatId, welcomeMessage, keyboard);
});

// Handle button clicks
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '📊 Статистика') {
    const statsKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Открыть статистику', web_app: { url: 'https://kishamba.com/stats' } }]
        ]
      }
    };
    bot.sendMessage(chatId, '📊 Нажмите кнопку ниже, чтобы открыть статистику:', statsKeyboard);
  } else if (text === '⚙️ Настройки') {
    const settingsKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔔 Уведомления: ВКЛ', callback_data: 'toggle_notifications' }],
          [{ text: '🌍 Язык: Русский', callback_data: 'change_language' }],
          [{ text: '◀️ Назад', callback_data: 'back_to_main' }]
        ]
      }
    };
    bot.sendMessage(chatId, '⚙️ Настройки:', settingsKeyboard);
  } else if (text === '🌐 Открыть сайт') {
    bot.sendMessage(chatId, '🌐 Ваш сайт: https://kishamba.com');
  } else if (text === 'ℹ️ Помощь') {
    const helpMessage = `ℹ️ Помощь по боту:\n\n📊 Статистика - просмотр статистики посещений\n⚙️ Настройки - настройки уведомлений\n🌐 Открыть сайт - ссылка на ваш сайт\n\nПо всем вопросам: @Kishamba`;
    bot.sendMessage(chatId, helpMessage);
  }
});

// Handle inline button callbacks
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'view_site') {
    bot.answerCallbackQuery(query.id, { text: 'Открываю сайт...' });
    bot.sendMessage(chatId, '🌐 https://kishamba.com');
  } else if (data === 'reply_visitor') {
    bot.answerCallbackQuery(query.id, { text: 'Функция в разработке' });
  } else if (data === 'toggle_notifications') {
    bot.answerCallbackQuery(query.id, { text: 'Уведомления включены' });
  } else if (data === 'change_language') {
    bot.answerCallbackQuery(query.id, { text: 'Язык: Русский' });
  } else if (data === 'back_to_main') {
    bot.answerCallbackQuery(query.id);
    const keyboard = {
      reply_markup: {
        keyboard: [
          [{ text: '📊 Статистика' }, { text: '⚙️ Настройки' }],
          [{ text: '🌐 Открыть сайт' }, { text: 'ℹ️ Помощь' }]
        ],
        resize_keyboard: true
      }
    };
    bot.sendMessage(chatId, '👋 Главное меню:', keyboard);
  }
});

// API: Track visitor
app.post('/api/visitor', async (req, res) => {
  try {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    const { language, userAgent } = req.body;
    const referrer = req.headers.referer || req.headers.referrer || 'direct';

    let ipInfo = { ip: 'Unknown', city: 'Unknown', country: 'Unknown' };

    // Try to get IP info, but don't fail if rate limited
    try {
      ipInfo = await getIPInfo(ip);
    } catch (error) {
      console.log('IP info lookup skipped:', error.message);
    }

    // Check if this IP visited in the last 30 minutes
    const recentVisit = await db.checkRecentVisit(ipInfo.ip);

    if (recentVisit) {
      console.log(`🔄 Recent visit found for IP ${ipInfo.ip}, skipping tracking.`);
      return res.json({ success: true, location: ipInfo, skipped: true });
    }

    // Save to database
    await db.addVisitor(
      ipInfo.ip,
      ipInfo.country_name || ipInfo.country || 'Unknown',
      ipInfo.city || 'Unknown',
      language || 'unknown',
      referrer,
      userAgent || 'unknown'
    );

    console.log(`📊 Visitor tracked: ${ipInfo.city}, ${ipInfo.country} (${language}) from ${referrer}`);

    res.json({ success: true, location: ipInfo });
  } catch (error) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Track resume download
app.post('/api/download', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { language } = req.body;

    const ipInfo = await getIPInfo(ip);

    const message = `📥 *Скачивание резюме!*\n\n` +
      `🌍 IP: \`${ipInfo.ip}\`\n` +
      `📍 Локация: ${ipInfo.city}, ${ipInfo.country_name}\n` +
      `🗣 Язык: ${language}\n` +
      `⏰ Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Отметить как важное', callback_data: 'mark_important' }],
          [{ text: '📊 Статистика скачиваний', callback_data: 'download_stats' }]
        ]
      }
    };

    // Save to database
    await db.addDownload(
      ipInfo.ip,
      ipInfo.country_name || ipInfo.country || 'Unknown',
      ipInfo.city || 'Unknown',
      language || 'unknown'
    );

    await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown', ...keyboard });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Contact form submission
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    console.log('📧 Contact form submission received');

    const { name, email, message, language } = req.body;

    if (!name || !email || !message) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';

    let ipInfo = { ip: 'Unknown', city: 'Unknown', country: 'Unknown' };
    try {
      ipInfo = await getIPInfo(ip);
    } catch (error) {
      console.log('IP info lookup skipped:', error.message);
    }

    // Save to database
    await db.addMessage(
      name,
      email,
      message,
      ipInfo.ip,
      ipInfo.country_name || ipInfo.country || 'Unknown',
      ipInfo.city || 'Unknown',
      language || 'unknown'
    );

    // Send Telegram notification
    const telegramMessage = `💬 *Новое сообщение с сайта!*\n\n` +
      `👤 Имя: ${name}\n` +
      `📧 Email: ${email}\n` +
      `💬 Сообщение:\n${message}\n\n` +
      `🗣 Язык: ${language || 'unknown'}\n` +
      `⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

    try {
      await bot.sendMessage(CHAT_ID, telegramMessage, { parse_mode: 'Markdown' });
      console.log('✅ Telegram message sent successfully');
    } catch (botError) {
      console.error('❌ Telegram Bot Error:', botError.message);
      // Don't fail the request if just the bot fails
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error in contact handler:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get statistics
app.get('/api/stats', auth, async (req, res) => {
  try {
    const data = await db.getStats();
    const stats = {
      totalVisitors: data.totalVisitors.count,
      uniqueVisitors: data.uniqueVisitors.count,
      totalMessages: data.totalMessages.count,
      totalDownloads: data.totalDownloads.count,
      topCountries: data.topCountries,
      topReferrers: data.topReferrers,
      visitsByDay: data.visitsByDay,
      recentMessages: data.recentMessages,
      visitsByHour: data.visitsByHour
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve stats page
app.get('/stats', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'stats.html'));
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 Telegram bot is active`);

  // Send startup notification
  bot.sendMessage(CHAT_ID, `✅ Сервер запущен!\n🌐 https://kishamba.com\n⏰ ${new Date().toLocaleString('ru-RU')}`);
});
