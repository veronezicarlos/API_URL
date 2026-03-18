const app = require('./src/app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 URL Shortener API rodando em http://localhost:${PORT}\n`);
});
