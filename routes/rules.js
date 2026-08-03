const express = require('express');
const router = express.Router();
const { Rule, RuleCheck } = require('../models/models');

// Format a Date object as YYYY-MM-DD using LOCAL time (avoids UTC shift bugs)
function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayStr() {
  return formatLocalDate(new Date());
}

// Returns array of 7 { date, label, isToday } objects, Mon -> Sun,
// for the week containing the given date string (YYYY-MM-DD)
function getWeekDates(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(y, m - 1, d); // constructed in local time, no UTC shift
  const day = (base.getDay() + 6) % 7; // Mon=0 ... Sun=6

  const monday = new Date(base);
  monday.setDate(base.getDate() - day);

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = todayStr();

  return labels.map((label, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const iso = formatLocalDate(dt);
    return { date: iso, label, isToday: iso === today };
  });
}

// List + week's checks
router.get('/', async (req, res) => {
  const date = req.query.date || todayStr();
  const weekDates = getWeekDates(date);
  const weekDateStrings = weekDates.map(d => d.date);

  const rules = await Rule.find().sort({ createdAt: -1 });
  const checks = await RuleCheck.find({ date: { $in: weekDateStrings } });

  const checksMap = {};
  checks.forEach(c => {
    const ruleId = c.rule.toString();
    if (!checksMap[ruleId]) checksMap[ruleId] = {};
    checksMap[ruleId][c.date] = { followed: c.followed, comment: c.comment };
  });

  res.render('rules', { rules, checksMap, date, weekDates });
});

// Create rule
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  await Rule.create({ title, description });
  res.redirect('/rules');
});

// Toggle/set check for a date
router.post('/:id/check', async (req, res) => {
  const { date, followed, comment } = req.body;
  const checkDate = date || todayStr();

  const update = { followed: followed === 'on' };
  if (comment !== undefined) update.comment = comment; // don't wipe comment on day-toggle posts

  await RuleCheck.findOneAndUpdate(
    { rule: req.params.id, date: checkDate },
    update,
    { upsert: true }
  );
  res.redirect('/rules?date=' + checkDate);
});

// Delete rule
router.delete('/:id', async (req, res) => {
  await Rule.findByIdAndDelete(req.params.id);
  await RuleCheck.deleteMany({ rule: req.params.id });
  res.redirect('/rules');
});

module.exports = router;