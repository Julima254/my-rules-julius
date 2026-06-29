const express = require('express');
const router = express.Router();
const { HabitStopper, HabitCheck } = require('../models/models');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

router.get('/', async (req, res) => {
  const date = req.query.date || todayStr();
  const habits = await HabitStopper.find().sort({ startDate: -1 });
  const checks = await HabitCheck.find({ date });

  const checksMap = {};
  checks.forEach(c => { checksMap[c.habit.toString()] = c; });

  // Calculate streak for each habit (consecutive succeeded days up to today)
  const habitsWithStreak = [];
  for (const h of habits) {
    const allChecks = await HabitCheck.find({ habit: h._id }).sort({ date: -1 });
    let streak = 0;
    for (const c of allChecks) {
      if (c.succeeded) streak++;
      else break;
    }
    const daysSinceStart = Math.floor((new Date() - h.startDate) / (1000 * 60 * 60 * 24));
    habitsWithStreak.push({ ...h.toObject(), streak, daysSinceStart });
  }

  res.render('habits', { habits: habitsWithStreak, checksMap, date });
});

router.post('/', async (req, res) => {
  const { title, targetDays } = req.body;
  await HabitStopper.create({ title, targetDays });
  res.redirect('/habits');
});

router.post('/:id/check', async (req, res) => {
  const { date, succeeded, comment } = req.body;
  const checkDate = date || todayStr();

  await HabitCheck.findOneAndUpdate(
    { habit: req.params.id, date: checkDate },
    { succeeded: succeeded === 'on', comment },
    { upsert: true }
  );
  res.redirect('/habits?date=' + checkDate);
});

router.delete('/:id', async (req, res) => {
  await HabitStopper.findByIdAndDelete(req.params.id);
  await HabitCheck.deleteMany({ habit: req.params.id });
  res.redirect('/habits');
});

module.exports = router;