require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

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
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
    bot.sendMessage(chatId, '📊 Статистика сайта будет доступна в следующей версии.');
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
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { language, userAgent } = req.body;

    const ipInfo = await getIPInfo(ip);

    const message = `👁 *Новый посетитель на сайте!*\n\n` +
      `🌍 IP: \`${ipInfo.ip}\`\n` +
      `📍 Локация: ${ipInfo.city}, ${ipInfo.country_name}\n` +
      `🗣 Язык: ${language}\n` +
      `⏰ Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 Открыть сайт', callback_data: 'view_site' }],
          [{ text: '📊 Статистика', callback_data: 'stats' }]
        ]
      }
    };

    await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown', ...keyboard });

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

    await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown', ...keyboard });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { name, email, message, language } = req.body;

    const ipInfo = await getIPInfo(ip);

    const telegramMessage = `💬 *Новое сообщение с сайта!*\n\n` +
      `👤 Имя: ${name}\n` +
      `📧 Email: ${email}\n` +
      `💬 Сообщение:\n${message}\n\n` +
      `---\n` +
      `🌍 IP: \`${ipInfo.ip}\`\n` +
      `📍 Локация: ${ipInfo.city}, ${ipInfo.country_name}\n` +
      `🗣 Язык: ${language}\n` +
      `⏰ Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

    const whatsappNumber = process.env.WHATSAPP_NUMBER || '';
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📧 Ответить на email', url: `mailto:${email}` }],
          [{ text: '💬 Открыть Telegram', url: 'https://t.me/Kishamba' }],
          [{ text: '📱 WhatsApp', url: `https://wa.me/${whatsappNumber}` }]
        ]
      }
    };

    try {
      await bot.sendMessage(CHAT_ID, telegramMessage, { parse_mode: 'Markdown', ...keyboard });
    } catch (botError) {
      console.error('Telegram Bot Error:', botError.message);
      // Don't fail the request if just the bot fails, but log it
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending contact message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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
