# Инструкция по подключению домена к сайту

## Вариант 1: Vercel (Рекомендуется) ⭐

Vercel отлично подходит для Node.js приложений и предоставляет бесплатный хостинг с возможностью подключения собственного домена.

### Шаги:

1. **Установите Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Войдите в Vercel:**
   ```bash
   vercel login
   ```

3. **Деплой проекта:**
   ```bash
   vercel
   ```
   Следуйте инструкциям в терминале.

4. **Добавьте переменные окружения:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Откройте ваш проект
   - Перейдите в Settings → Environment Variables
   - Добавьте:
     - `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
     - `TELEGRAM_CHAT_ID` - ID чата для уведомлений
     - `PORT` - порт (обычно не нужен, Vercel сам назначает)
     - `WHATSAPP_NUMBER` - номер WhatsApp (опционально)

5. **Подключение домена:**
   - В настройках проекта перейдите в **Domains**
   - Нажмите **Add Domain**
   - Введите ваш домен (например: `kishamba.com`)
   - Vercel покажет DNS записи, которые нужно добавить:
     - **A запись**: `76.76.21.21` (или IP, который покажет Vercel)
     - **CNAME запись**: `cname.vercel-dns.com` (для поддоменов)
   
6. **Настройка DNS у регистратора домена:**
   - Зайдите в панель управления доменом (где вы его купили)
   - Найдите раздел DNS / DNS Management
   - Добавьте записи, которые показал Vercel
   - Подождите 5-60 минут для распространения DNS

7. **Проверка:**
   - После настройки DNS, Vercel автоматически выдаст SSL сертификат
   - Ваш сайт будет доступен по вашему домену!

---

## Вариант 2: Railway

Railway - отличная платформа для Node.js приложений с простым деплоем.

### Шаги:

1. **Зарегистрируйтесь на [railway.app](https://railway.app)**

2. **Подключите GitHub репозиторий:**
   - Нажмите "New Project"
   - Выберите "Deploy from GitHub repo"
   - Выберите ваш репозиторий `moi-sait`

3. **Настройте переменные окружения:**
   - В настройках проекта добавьте переменные:
     - `TELEGRAM_BOT_TOKEN`
     - `TELEGRAM_CHAT_ID`
     - `WHATSAPP_NUMBER` (опционально)

4. **Подключение домена:**
   - В настройках проекта перейдите в **Settings → Domains**
   - Нажмите **Generate Domain** для тестового домена
   - Или **Add Custom Domain** для вашего домена
   - Добавьте CNAME запись в DNS вашего домена

---

## Вариант 3: Render

Render предоставляет бесплатный хостинг для Node.js приложений.

### Шаги:

1. **Зарегистрируйтесь на [render.com](https://render.com)**

2. **Создайте новый Web Service:**
   - Подключите GitHub репозиторий
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Настройте переменные окружения** (как в Vercel)

4. **Подключение домена:**
   - В настройках сервиса перейдите в **Custom Domains**
   - Добавьте ваш домен
   - Настройте DNS записи согласно инструкциям Render

---

## Вариант 4: Собственный VPS сервер

Если у вас есть VPS сервер (DigitalOcean, AWS, Hetzner и т.д.)

### Шаги:

1. **Подключитесь к серверу по SSH**

2. **Установите Node.js и npm:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Установите PM2 для управления процессом:**
   ```bash
   npm install -g pm2
   ```

4. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/Kishamba/moi-sait.git
   cd moi-sait
   npm install
   ```

5. **Создайте файл .env:**
   ```bash
   nano .env
   ```
   Добавьте все необходимые переменные окружения

6. **Запустите приложение через PM2:**
   ```bash
   pm2 start server.js --name "kishamba-portfolio"
   pm2 save
   pm2 startup
   ```

7. **Установите Nginx как reverse proxy:**
   ```bash
   sudo apt install nginx
   ```

8. **Настройте Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/kishamba
   ```
   
   Добавьте конфигурацию:
   ```nginx
   server {
       listen 80;
       server_name ваш-домен.com www.ваш-домен.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Активируйте конфигурацию:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/kishamba /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Установите SSL сертификат (Let's Encrypt):**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d ваш-домен.com -d www.ваш-домен.com
    ```

11. **Настройте DNS:**
    - Добавьте A запись, указывающую на IP вашего сервера
    - Или CNAME для поддомена

---

## Настройка DNS записей

### Для корневого домена (example.com):
- **Тип**: A
- **Имя**: @ или оставьте пустым
- **Значение**: IP адрес сервера (для VPS) или IP, указанный хостингом

### Для поддомена (www.example.com):
- **Тип**: CNAME
- **Имя**: www
- **Значение**: домен, предоставленный хостингом (например: `cname.vercel-dns.com`)

### Время распространения DNS:
- Обычно: 5-60 минут
- Максимум: до 48 часов

---

## Важные замечания

⚠️ **Telegram Bot с polling:**
- На некоторых платформах (Vercel, Netlify) polling может не работать из-за ограничений времени выполнения
- Рассмотрите использование webhook для Telegram бота в production

⚠️ **Переменные окружения:**
- Никогда не коммитьте `.env` файл в Git
- Всегда используйте переменные окружения на платформе хостинга

⚠️ **SSL сертификат:**
- Большинство платформ (Vercel, Railway, Render) автоматически предоставляют SSL
- Для VPS используйте Let's Encrypt (бесплатно)

---

## Рекомендация

Для вашего проекта я рекомендую **Vercel**, так как:
- ✅ Бесплатный план с хорошими лимитами
- ✅ Автоматический SSL
- ✅ Простое подключение домена
- ✅ Автоматический деплой из GitHub
- ✅ Хорошая поддержка Node.js

---

## Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Let's Encrypt](https://letsencrypt.org)

