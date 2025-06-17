const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = "missollyadmin"; // Change this to your secret password

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'game-night-secret', // Change this to a strong secret
  resave: false,
  saveUninitialized: false
}));

let scores = require('./data/scores.json');

// Home - leaderboard
app.get('/', (req, res) => {
  const sorted = Object.entries(scores).sort((a, b) => b[1].points - a[1].points);
  res.render('index', { teams: sorted });
});

// Team members
app.get('/team/:name', (req, res) => {
  const teamName = req.params.name;
  const team = scores[teamName];
  if (team) {
    res.send(`<h1>${teamName}</h1><ul>${team.members.map(m => `<li>${m}</li>`).join('')}</ul>`);
  } else {
    res.send("Team not found");
  }
});

// Admin login page
app.get('/admin', (req, res) => {
  if (req.session.loggedIn) {
    res.render('admin', { teams: Object.keys(scores) });
  } else {
    res.render('login');
  }
});


app.post('/admin', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('Incorrect password');
  }
});


app.post('/submit-score', (req, res) => {
  const { team, points } = req.body;
  if (scores[team]) {
    scores[team].points += parseInt(points);
    fs.writeFileSync('./data/scores.json', JSON.stringify(scores, null, 2));
    res.redirect('/');
  } else {
    res.send('Invalid team');
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});
app.post('/reset-scores', (req, res) => {
  if (!req.session.loggedIn) return res.sendStatus(403);
  for (let team in scores) scores[team].points = 0;
  fs.writeFileSync('./data/scores.json', JSON.stringify(scores, null, 2));
  res.redirect('/');
});
app.get("/", (req, res) => {
  res.render("index", { teams });
});
