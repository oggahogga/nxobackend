const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let activeList = [];

app.post('/api/register', (req, res) => {
  const { code, name } = req.body;
  if (!code || !name) return res.status(400).send("missing stuff");

  const now = Date.now();
  let player = activeList.find(e => e.name === name);

  if (!player) {
    activeList.push({ 
      code, 
      name, 
      lastSeen: now, 
      pings: [now], 
      codeChanges: [] // new field to track code changes
    });
    console.log(`added new player: ${code} - ${name}`);
  } else {
    // track room code changes
    if (player.code !== code) {
      player.codeChanges.push({
        from: player.code,
        to: code,
        timestamp: now,
      });
      console.log(`updated player room: ${name} from ${player.code} to ${code}`);
      player.code = code;
    }
    player.lastSeen = now;
    player.pings.push(now);
  }

  res.sendStatus(200);
});

app.get('/api/ping', (req, res) => {
  const { code, name } = req.query;
  const found = activeList.find(e => e.code === code && e.name === name);
  if (found) {
    const now = Date.now();
    found.lastSeen = now;
    found.pings.push(now);
  }
  res.sendStatus(200);
});

// endpoint to get full player history (pings + code changes)
app.get('/api/history', (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).send("missing name");

  const player = activeList.find(e => e.name === name);
  if (!player) return res.status(404).send("player not found");

  // send both pings and codeChanges
  res.json({
    pings: player.pings,
    codeChanges: player.codeChanges,
    currentCode: player.code,
  });
});

setInterval(() => {
  const now = Date.now();
  activeList = activeList.filter(e => now - e.lastSeen < 3000);
}, 10000);

app.get('/api/list', (req, res) => {
  res.json(activeList.map(({ code, name }) => ({ code, name })));
});

app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
