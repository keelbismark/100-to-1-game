# Руководство по развертыванию

Это руководство поможет вам развернуть приложение "Сто к Одному" на сервере для доступа из интернета.

## Варианты развертывания

### 1. Развертывание на VPS (Virtual Private Server)

#### Требования
- VPS с Ubuntu 20.04+ или Debian 11+
- Минимум 1GB RAM (рекомендуется 2GB)
- 10GB дискового пространства
- Node.js 18+ и npm

#### Пошаговая инструкция

**1. Подключитесь к серверу**
```bash
ssh user@your-server-ip
```

**2. Установите Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**3. Установите Git**
```bash
sudo apt-get install -y git
```

**4. Склонируйте репозиторий**
```bash
git clone https://github.com/ваше-имя/100-to-1.git
cd 100-to-1
```

**5. Установите зависимости**
```bash
npm install:all
```

**6. Установите PM2 (для управления процессами)**
```bash
sudo npm install -g pm2
```

**7. Создайте конфигурационный файл для среды**
```bash
nano .env
```

Содержимое `.env`:
```
NODE_ENV=production
PORT=5000
CLIENT_URL=http://your-domain.com
```

**8. Соберите клиент**
```bash
cd client
npm run build
cd ..
```

**9. Запустите сервер с PM2**
```bash
pm2 start server/src/server.js --name "100-to-1-server"
pm2 save
pm2 startup
```

**10. Настройте Nginx**

Установите Nginx:
```bash
sudo apt-get install -y nginx
```

Создайте конфигурацию:
```bash
sudo nano /etc/nginx/sites-available/100-to-1
```

Содержимое конфигурации:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        root /путь/к/проекту/client/dist;
        try_files $uri /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Активируйте сайт:
```bash
sudo ln -s /etc/nginx/sites-available/100-to-1 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**11. Получите SSL сертификат (Let's Encrypt)**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**12. Управление процессом**
```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs 100-to-1-server

# Рестарт
pm2 restart 100-to-1-server

# Остановка
pm2 stop 100-to-1-server
```

### 2. Развертывание на Heroku

#### Требования
- Учетная запись Heroku
- Heroku CLI

#### Пошаговая инструкция

**1. Установите Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Скачайте установщик с heroku.com

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

**2. Войдите в Heroku**
```bash
heroku login
```

**3. Создайте приложение**
```bash
heroku create your-app-name
```

**4. Создайте `Procfile` в корне проекта**
```
web: node server/src/server.js
```

**5. Добавьте скрипт сборки в `server/package.json`**
```json
"scripts": {
  "start": "node src/server.js",
  "build": "cd client && npm install && npm run build"
}
```

**6. Задайте конфигурационные переменные**
```bash
heroku config:set NODE_ENV=production
heroku config:set CLIENT_URL=https://your-app-name.herokuapp.com
```

**7. Разверните приложение**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

**8. Откройте приложение**
```bash
heroku open
```

### 3. Развертывание на DigitalOcean App Platform

#### Тошаговая инструкция

**1. Подключите репозиторий**
- Зайдите в DigitalOcean Dashboard
- Перейдите в Apps
- Нажмите "Create App"
- Подключите ваш GitHub репозиторий

**2. Настройте приложение**

Раздел "App Specification" -> "Edit" -> "YAML":

```yaml
name: 100-to-1
services:
- name: server
  environment_slug: node-js
  github:
    repo: ваше-имя/100-to-1
    branch: main
  run_command: node server/src/server.js
  env_vars:
  - key: NODE_ENV
    value: production
  - key: CLIENT_URL
    value: https://your-app-name.ondigitalocean.app
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /socket.io
  - path: /api
```

**3. Разверните**

Нажмите "Create" и дождитесь завершения развертывания.

### 4. Развертывание с Docker

#### Создайте Dockerfile

**Для сервера** (`server/Dockerfile`):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

**Для клиента** (`client/Dockerfile`):
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - CLIENT_URL=http://localhost:80
    restart: always

  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - server
    restart: always
```

**Запуск**:
```bash
docker-compose up -d
```

## Мониторинг и логирование

### PM2 мониторинг
```bash
pm2 monit
```

### Просмотр логов
```bash
# PM2
pm2 logs 100-to-1-server

# Docker
docker-compose logs -f

# Heroku
heroku logs --tail
```

### Настройка логирования в приложении

Усовершенствуйте логирование в `server/src/server.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## Безопасность

### 1. CORS
Настройте CORS в `server/src/server.js`:
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // лимит на IP
});

app.use('/api/', limiter);
```

### 3. Блокировка suspicious activity
```javascript
io.use((socket, next) => {
  const ipAddress = socket.handshake.address;
  
  if (isSuspicious(ipAddress)) {
    return next(new Error('Suspicious activity detected'));
  }
  
  next();
});
```

## Оптимизация производительности

### 1. CDN для статических файлов
Используйте Cloudflare или AWS CloudFront для статических файлов клиента.

### 2. Сжатие
Добавьте сжатие на сервере:
```javascript
const compression = require('compression');
app.use(compression());
```

### 3. Кеширование
```javascript
app.use(express.static('public', {
  maxAge: '1y',
  setHeaders: function (res, path) {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
```

## Backup и восстановление

### База данных (если добавите)
```bash
# Backup
mongodump --db 100to1 --out /backup/

# Restore
mongorestore /backup/100to1
```

### Игровые пакеты
```bash
# Backup
tar -czf game-packs-backup.tar.gz game-packs/

# Restore  
tar -xzf game-packs-backup.tar.gz
```

## Troubleshooting

### Проблема: WebSocket не работает
**Решение:** Проверьте конфигурацию Nginx, убедитесь что заголовки Upgrade и Connection верны.

### Проблема: После обновления не работает
**Решение:** 
```bash
pm2 restart all
pm2 flush
```

### Проблема: Медленная работа
**Решение:**
- Увеличьте размер инстанса
- Используйте CDN
- Оптимизируйте React приложение (code splitting)

## Обновление

### PM2
```bash
git pull
npm install:all
cd client && npm run build && cd ..
pm2 restart 100-to-1-server
```

### Heroku
```bash
git push heroku main
```

### Docker
```bash
docker-compose pull
docker-compose up -d
```

## Масштабирование

### Горизонтальное масштабирование
Используйте Redis для хранения состояния игр между серверами:
```javascript
const { Server } = require('socket.io');
const redisAdapter = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const io = new Server();
const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(redisAdapter(pubClient, subClient));
});
```

## Стоимость

### Ориентировочная стоимость (ежемесячно)
- **VPS (DigitalOcean Linode)**: $5-20
- **Heroku**: $7+ (Dino план)
- **DigitalOcean App Platform**: $5-20
- **Docker (собственный сервер)**: Минимум (но нужен сервер)

Рекомендуем начать с VPS ($5-10/месяц) для тестирования.

## Поддержка

Если возникли проблемы при развертывании:
1. Проверьте логи
2. Посмотрите troubleshooting раздел
3. Создайте issue в GitHub репозитории
4. Или напишите на support@your-domain.com

Удачного развертывания! 🚀
