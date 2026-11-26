require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  adminInviteCode: process.env.ADMIN_INVITE_CODE || '',
  openRouter: {
    // Spec asks for OPENrouter_API_KEY; the conventional upper-case name is accepted too.
    apiKey: process.env.OPENrouter_API_KEY || process.env.OPENROUTER_API_KEY || '',
    baseUrl: (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    timeoutMs: Number(process.env.OPENROUTER_TIMEOUT_MS) || 45000,
    appUrl: process.env.OPENROUTER_APP_URL || 'http://localhost:5173',
    appName: process.env.OPENROUTER_APP_NAME || 'ResumeAI Portal',
  },
  maxFileSizeBytes: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024,
};
