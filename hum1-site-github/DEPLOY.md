# Выкладка на GitHub и Render: с нуля

## 0. Что понадобится
- аккаунт на github.com
- аккаунт на render.com (регистрируйся кнопкой **Sign up with GitHub**)
- токен бота и chat id (как их получить, написано в README.md, часть 2)
- придуманный длинный пароль для админки

## 1. Залить проект на GitHub

**Способ А (проще всего): GitHub Desktop**
1. Скачай и установи GitHub Desktop (desktop.github.com), войди в свой аккаунт GitHub.
2. Распакуй `hum1-site-github.zip`. Внутри сразу лежат файлы проекта: `package.json`, `server.js`, папка `public` и другие.
3. В GitHub Desktop: меню **File, Add Local Repository**, выбери эту папку.
   Если пишет, что папка не Git-репозиторий, нажми синюю ссылку **create a repository**, потом **Create Repository**.
4. Слева внизу в поле Summary напиши `first commit` и нажми **Commit to main**.
5. Сверху нажми **Publish repository**, оставь имя `hum1-site`, нажми **Publish Repository**. Можно оставить галочку «Keep this code private», Render всё равно сможет читать репозиторий.
6. Открой `github.com/ТВОЙ_НИК/hum1-site`. В самом начале списка файлов должны быть `package.json`, `server.js`, `render.yaml` и папка `public`.

GitHub Desktop сам не загружает `node_modules` и `.env`, это защищает от главных ошибок.

**Способ Б: через сайт GitHub**
1. github.com, кнопка **New repository**, имя `hum1-site`, **Create repository**.
2. Ссылка **uploading an existing file**. Открой распакованную папку, нажми Cmd+Shift+точка (покажутся скрытые файлы), Cmd+A и перетащи **содержимое** папки в окно браузера, а не саму папку.
3. Внизу нажми **Commit changes**.
Не загружай папку `node_modules` (если запускал проект локально, она появилась после `npm install`) и файл `.env`.

## 2. Запустить на Render

**Вариант 1 (рекомендую): Blueprint**
1. dashboard.render.com, кнопка **New +**, затем **Blueprint**.
2. Подключи GitHub и выбери репозиторий `hum1-site`, нажми **Connect**.
3. Render увидит файл `render.yaml` и попросит три значения: `ADMIN_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Впиши и нажми **Deploy Blueprint**.
4. Подожди 2 to 5 минут, пока статус станет **Live**. Адрес сайта написан вверху страницы сервиса, например `https://hum1-site.onrender.com`.

**Вариант 2: вручную**
**New +, Web Service**, выбери репозиторий. Настройки:
- Language: `Node`, Branch: `main`, Root Directory: оставь пустым
- Build Command: `npm install`
- Start Command: `npm start`
- Instance Type: `Free`
- Environment Variables: `NODE_ENV=production`, `TRUST_PROXY=1`, `ADMIN_PASSWORD=...`, `TELEGRAM_BOT_TOKEN=...`, `TELEGRAM_CHAT_ID=...`
Нажми **Create Web Service**.

## 3. Проверь, что всё работает
1. `https://ТВОЙ-АДРЕС/healthz` должен показать `{"ok":true,...}`.
2. Сайт открывается, а `/admin` пускает по паролю.
3. В админке: **Settings, Send test message**. В Telegram придёт сообщение.
4. Пройди бриф до кнопки **Finish**: появится окно «Спасибо», а заявка придёт в Telegram и появится в админке во вкладке Briefs.

## 4. Важно про бесплатный план Render
- Сайт засыпает примерно через 15 минут без посетителей. Первый заход после сна открывается 30 to 60 секунд.
- Файлы на бесплатном плане стираются при перезапуске и при каждом обновлении. Правки из админки и список заявок могут пропасть. Что делать:
  - после больших правок нажимай **Settings, Download backup**, а если данные пропали, **Restore from file**;
  - заявки при этом приходят в Telegram сразу, клиенты не теряются;
  - надёжный вариант: платный план и диск. В `render.yaml` есть закомментированные строки: раскомментируй их, замени `plan: free` на `plan: starter` и добавь переменную `DATA_DIR=/var/data`.

## 5. Как обновлять сайт
Поменял файлы, в GitHub Desktop напиши Summary, нажми **Commit to main**, затем **Push origin**. Render сам пересоберёт сайт за пару минут.

## 6. Частые ошибки
| Что видишь | Причина | Что делать |
|---|---|---|
| В логах Render `Could not read package.json` или `missing script: start` | `package.json` не в корне репозитория (загрузилась папка внутрь папки) | Перезалей содержимое папки. Или в Render: Settings, **Root Directory**, впиши имя вложенной папки |
| `Cannot find module 'express'` | Build Command не `npm install` | Settings, Build and Deploy, исправь команду |
| `Port scan timeout` или `No open ports detected` | Сервер упал при старте | Открой **Logs**, прочитай первую красную строку. Start Command должен быть `npm start`, переменную `PORT` не создавай |
| GitHub: загрузка зависла, «too many files» | Попала папка `node_modules` | Удали её и загрузи заново, или используй GitHub Desktop |
| Админка пишет «Wrong password» | Пароль в Environment с опечаткой или пробелом | Исправь `ADMIN_PASSWORD`, нажми Save Changes, подожди перезапуск |
| В админке «Telegram: not sent» | Неверный токен или chat id, не нажат Start у бота | **Settings, Send test message** покажет точную причину |
| Пропали правки и заявки | Бесплатный план стирает файлы | **Restore from file** из бэкапа, см. пункт 4 |
| Свой домен | | Render, Settings, **Custom Domains**, затем создай запись у регистратора домена, как подскажет Render |
