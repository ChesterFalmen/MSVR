const express = require('express');
const app = express();
const path = require('path');

const PORT = 3000;

// Serve static files from "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach((name) => {
    interfaces[name].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Server running at http://${iface.address}:${PORT}`);
      }
    });
  });
});