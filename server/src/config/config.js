require('dotenv').config();
const Joi = require('joi');
const logger = require('../utils/logger');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(5000),
  CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_DIR: Joi.string().default('logs'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100)
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  clientUrl: envVars.CLIENT_URL,
  log: {
    level: envVars.LOG_LEVEL,
    dir: envVars.LOG_DIR
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS
  },
  cors: {
    origin: envVars.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
};

logger.info('Configuration loaded', {
  env: config.env,
  port: config.port,
  clientUrl: config.clientUrl,
  logLevel: config.log.level
});

module.exports = config;
