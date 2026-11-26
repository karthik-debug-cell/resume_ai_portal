const { port, openRouter } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

(async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(openRouter.apiKey
      ? `AI screening: OpenRouter (${openRouter.model})`
      : 'AI screening: OPENrouter_API_KEY not set → using keyword-based fallback scoring');
  });
})();
