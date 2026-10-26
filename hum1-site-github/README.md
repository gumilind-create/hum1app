# Hum1: сайт студии + бэкенд + админка + Telegram-бот

Что внутри:

```
hum1-site/
  server.js          сервер (Express): сайт, приём заявок, Telegram, API админки
  public/            сам сайт (index.html, css, js, картинки, шрифты) и админка (admin.html)
  data/              сюда сервер пишет правки админки и заявки (content.json, briefs.json, uploads)
  scripts/chat-id.js помощник: показывает chat id для Telegram
  .env.example       шаблон настроек (пароль админки, токен бота, chat id)
```

## 1. Запуск на MacBook (проверка через консоль)

1. Открой Terminal (Cmd+Пробел, напиши `Terminal`).
2. Проверь Node.js: `node -v`. Нужна версия 18 или новее.
   Если команды нет: `brew install node` (если нет brew, скачай установщик LTS на https://nodejs.org).
3. Перейди в папку проекта. Если распаковал архив в «Загрузки»:
   `cd ~/Downloads/hum1-site`
4. Установи зависимости: `npm install`
5. Создай файл настроек: `cp .env.example .env`, потом открой его: `open -e .env`
   Минимум впиши `ADMIN_PASSWORD=` (длинный пароль). Токен бота добавим в шаге 2.
6. Запусти: `npm start`
7. Открой в браузере:
   - сайт: http://localhost:3000
   - админка: http://localhost:3000/admin
8. Остановить сервер: Ctrl+C. Режим разработки с автоперезапуском: `npm run dev`.

Быстрая проверка из консоли (в соседней вкладке Terminal): `curl http://localhost:3000/healthz`. Должно вернуться `{"ok":true,...}`.

## 2. Подключение Telegram-бота

1. В Telegram найди **@BotFather**, отправь `/newbot`, придумай имя и username (он заканчивается на `bot`).
   BotFather пришлёт **токен** вида `123456789:AAH...`. Впиши в `.env`: `TELEGRAM_BOT_TOKEN=токен`
2. Открой своего нового бота, нажми **Start** и напиши любое сообщение.
   Если заявки нужны в группе: добавь бота в группу и напиши там сообщение.
3. Узнай chat id: `npm run chatid`. Скрипт покажет бота и список чатов с id.
   Впиши нужный в `.env`: `TELEGRAM_CHAT_ID=123456789`
   Несколько получателей через запятую: `TELEGRAM_CHAT_ID=123456789,-1001234567890` (у групп id отрицательный).
4. Перезапусти сервер (Ctrl+C, потом `npm start`).
5. Зайди в админку, вкладка **Settings**, кнопка **Send test message**. В Telegram придёт сообщение.
6. Пройди бриф на сайте до конца и нажми **Finish** (появится окно «Спасибо»). Заявка придёт в бота, а копия останется в админке во вкладке **Briefs**.

Если что-то не так, админка покажет причину:
- `chat not found`: не нажал Start у бота или неверный chat id.
- `Unauthorized`: неверный токен.
- `bot was blocked by the user`: ты заблокировал бота, разблокируй.
Заявка в любом случае сохраняется в админке, оттуда её можно отправить в Telegram повторно (кнопка **Resend**).

## 3. Админка (/admin)

- **Texts**: все тексты сайта по разделам. Меняешь, жмёшь Save (или Cmd+S). «Reset» возвращает оригинал.
- **Prices**: цены пакетов, каждой услуги конфигуратора и разработки логотипа (три тарифа и скидка в % при заказе вместе с сайтом). Меняются сразу в карточках, в конфигураторе и в оценке заявки.
- **Gallery**: замена картинок мини-сайтов на свои скриншоты (PNG, JPEG, WebP до 4 МБ, лучше пропорции 8:5).
- **Briefs**: все заявки, статусы New / In progress / Done, повторная отправка в Telegram, удаление.
- **Settings**: проверка Telegram и смена пароля.

Все правки лежат в `data/` (content.json, briefs.json, uploads). Это нужно бэкапить.
Структуру страницы (разделы, вёрстку) меняют в `public/index.html`. Атрибуты `data-c`, `data-price`, `data-img` не удаляй: по ним админка находит редактируемые места.

## 4. Выкладка в интернет

**Для GitHub и Render смотри отдельную пошаговую инструкцию: `DEPLOY.md`** (там же частые ошибки). Ниже общая справка.

Нужен хостинг, где работает Node.js, и важно, чтобы папка `data/` не стиралась.

**Вариант А. VPS (Ubuntu), самый надёжный**
```
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
# скопируй проект на сервер, зайди в папку, создай .env (добавь TRUST_PROXY=1 и NODE_ENV=production)
npm install --omit=dev
sudo npm i -g pm2 && pm2 start server.js --name hum1 && pm2 save && pm2 startup
```
Nginx (`/etc/nginx/sites-available/hum1`), затем HTTPS через certbot:
```
server { server_name example.com;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; proxy_set_header X-Forwarded-Proto $scheme; } }
```
`sudo ln -s /etc/nginx/sites-available/hum1 /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx && sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx -d example.com`

**Вариант Б. Render / Railway**
1. Залей проект на GitHub (`.env` и `data/*.json` в репозиторий не попадут, это уже в `.gitignore`).
2. Создай Web Service: Build `npm install`, Start `npm start`.
3. В Environment добавь переменные из `.env` плюс `TRUST_PROXY=1` и `NODE_ENV=production`.
4. Подключи постоянный диск (Persistent Disk / Volume), смонтируй, например, в `/var/data` и задай `DATA_DIR=/var/data`. Без диска правки админки и заявки пропадут при следующем деплое.
5. Домен подключается в настройках сервиса (CNAME), HTTPS выдаётся автоматически.

## 5. Безопасность

- Поставь длинный уникальный `ADMIN_PASSWORD` и смени его в админке; `.env` никому не отправляй и не заливай в репозиторий.
- Вход в админку и отправка брифов ограничены по частоте, формы защищены от простых ботов (скрытое поле и проверка времени заполнения).
- Админка работает только по HTTPS в интернете (на localhost можно по http).
