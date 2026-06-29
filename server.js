require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const path = require('path');

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
  }
}));

const { requireLogin } = require('./middleware/auth');
const Models = require('./models/models');

// Public auth routes (no login required)
app.use('/', require('./routes/auth'));

// Everything below this line requires login
app.use(requireLogin);

// Dashboard
app.get('/', async (req, res) => {
  const achievements = await Models.Achievement.find();
  const rules = await Models.Rule.find();
  const habits = await Models.HabitStopper.find();
  const theme = await Models.ThemeOfYear.findOne({ year: new Date().getFullYear() });

  const stats = {
    totalAchievements: achievements.length,
    achieved: achievements.filter(a => a.dateAchieved).length,
    failed: achievements.filter(a => a.dateFailed).length,
    pending: achievements.filter(a => !a.dateAchieved && !a.dateFailed).length,
    activeRules: rules.length,
    activeHabits: habits.length,
    currentTheme: theme ? theme.theme : 'Not set yet'
  };

  res.render('dashboard', { stats, currentYear: new Date().getFullYear() });
});

app.use('/achievements', require('./routes/achievements'));
app.use('/rules', require('./routes/rules'));
app.use('/career', require('./routes/career'));
app.use('/routine', require('./routes/routine'));
app.use('/theme', require('./routes/theme'));
app.use('/habits', require('./routes/habits'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));