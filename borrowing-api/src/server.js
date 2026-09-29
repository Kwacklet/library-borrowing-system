// server.js - starts the Borrowing API on a port.
const app = require('./app');

const PORT = Number(process.env.PORT || 3002);

app.listen(PORT, () => {
  console.log(`Borrowing API listening on port ${PORT}`);
});
