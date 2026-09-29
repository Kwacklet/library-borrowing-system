// server.js - starts the Books API on a port.
const app = require('./app');

const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, () => {
  console.log(`Books API listening on port ${PORT}`);
});
