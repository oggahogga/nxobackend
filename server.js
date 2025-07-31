const express = require('express');
const path = require('path');
const app = express(); // ← this needs to come BEFORE using app

const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// static files serving
app.use(express.static(path.join(__dirname, 'public'))); // serve stuff from 'public' folder

// your existing API endpoints here
let activeList = [];

app.post('/api/register', (req, res) => {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).send("missing stuff");

    let found = activeList.find(e => e.code === code && e.name === name);
    if (!found) {
        activeList.push({ code, name, lastSeen: Date.now() });
        console.log(`added: ${code} - ${name}`);
    }

    res.sendStatus(200);
});

app.get('/api/ping', (req, res) => {
    const { code, name } = req.query;
    const found = activeList.find(e => e.code === code && e.name === name);
    if (found) found.lastSeen = Date.now();
    res.sendStatus(200);
});

setInterval(() => {
    const now = Date.now();
    activeList = activeList.filter(e => now - e.lastSeen < 10000);
}, 5000);

app.get('/api/list', (req, res) => {
    res.json(activeList.map(({ code, name }) => ({ code, name })));
});

app.listen(PORT, () => console.log(`server live on ${PORT}`));
