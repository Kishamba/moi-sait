# Kishamba Portfolio Website

Professional multilingual portfolio website for Aleksey Lazarev - Event Management & Technical Production Services.

## Features

- 🌍 **4 Languages**: English, Russian, Arabic (RTL), Chinese
- 📱 **Telegram Integration**: Real-time notifications for visitors, downloads, and messages
- 💬 **WhatsApp Integration**: Direct messaging capability
- 📥 **Resume Download**: PDF download with tracking
- 🎨 **Premium Design**: Modern glassmorphism with smooth animations
- 📊 **IP Tracking**: Visitor analytics with geolocation
- 📱 **Fully Responsive**: Mobile-first design

## Technology Stack

### Frontend
- HTML5
- CSS3 (Glassmorphism, Gradients, Animations)
- Vanilla JavaScript
- Google Fonts (Poppins, Inter)
- Font Awesome Icons

### Backend
- Node.js
- Express.js
- Telegram Bot API
- IP Geolocation API

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with:
- Telegram Bot Token
- Telegram Chat ID
- WhatsApp Number
- Server Port

### 3. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 4. Development Mode (with auto-reload)

```bash
npm run dev
```

## Telegram Bot Setup

Your bot is already configured:
- **Bot**: @kishambatest_bot
- **Token**: 8276713967:AAFYqge3Ywka6bTvTmV2CJNzEbVKbCi2cVc
- **Chat ID**: 228860864

### Bot Commands

The bot includes interactive buttons:
- 📊 Статистика - View statistics
- ⚙️ Настройки - Settings
- 🌐 Открыть сайт - Open website
- ℹ️ Помощь - Help

### Notifications

The bot sends notifications with action buttons for:
1. **New Visitor**: IP, location, language, time
2. **Resume Download**: IP, location, language, time
3. **Contact Message**: Name, email, message, location with quick reply buttons

## File Structure

```
sait2/
├── server.js              # Express server with Telegram integration
├── index.html             # Main HTML structure
├── styles.css             # Premium CSS design system
├── script.js              # Frontend JavaScript
├── translations.js        # All language translations
├── package.json           # Dependencies
├── .env                   # Environment variables
├── resume.pdf             # Downloadable resume
├── images/                # Image assets
│   ├── me.JPG            # Professional photo
│   ├── logotext black.png # Logo
│   ├── concerts.JPG      # Portfolio images
│   ├── cinema.JPG
│   ├── mtv.png
│   └── ...
└── README.md             # This file
```

## Deployment

### Option 1: VPS/Cloud Server (Recommended)

1. **Upload files** to your server
2. **Install Node.js** (v14 or higher)
3. **Install dependencies**: `npm install`
4. **Use PM2** for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name kishamba-portfolio
   pm2 save
   pm2 startup
   ```
5. **Configure Nginx** as reverse proxy
6. **Setup SSL** with Let's Encrypt

### Option 2: Heroku

1. Create `Procfile`:
   ```
   web: node server.js
   ```
2. Deploy:
   ```bash
   heroku create kishamba-portfolio
   git push heroku main
   ```

### Option 3: Vercel/Netlify

For static hosting, you'll need to modify the backend to use serverless functions.

## Environment Variables

```env
TELEGRAM_BOT_TOKEN=8276713967:AAFYqge3Ywka6bTvTmV2CJNzEbVKbCi2cVc
TELEGRAM_CHAT_ID=228860864
WHATSAPP_NUMBER=79035560626
PORT=3000
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Features Breakdown

### Language Switching
- Auto-detect browser language
- Save preference in localStorage
- RTL support for Arabic
- Smooth transitions

### Telegram Notifications
- Visitor tracking with IP geolocation
- Resume download tracking
- Contact form submissions
- Interactive buttons for quick actions

### WhatsApp Integration
- Floating action button
- Pre-filled message based on language
- Opens WhatsApp Web or mobile app

### Design Features
- Glassmorphism effects
- Gradient accents
- Smooth scroll animations
- Hover micro-interactions
- Responsive grid layouts
- Mobile-first approach

## Customization

### Change Colors

Edit CSS variables in `styles.css`:
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --accent-cyan: #00f2fe;
    /* ... */
}
```

### Add New Language

1. Add translations in `translations.js`
2. Add language button in `index.html`
3. Update language detection in `script.js`

### Modify Content

Edit text in `translations.js` for all languages simultaneously.

## Support

For issues or questions:
- Email: Alexlaza1@gmail.com
- Telegram: @Kishamba
- WhatsApp: +7 903 556 0626

## License

© 2025 Aleksey Lazarev. All rights reserved.
