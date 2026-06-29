const express = require('express');
const router = express.Router();
const { Rule, RuleCheck } = require('../models/models');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// List + today's checks
router.get('/', async (req, res) => {
  const date = req.query.date || todayStr();
  const rules = await Rule.find().sort({ createdAt: -1 });
  const checks = await RuleCheck.find({ date });

  const checksMap = {};
  checks.forEach(c => { checksMap[c.rule.toString()] = c; });

  res.render('rules', { rules, checksMap, date });
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

  await RuleCheck.findOneAndUpdate(
    { rule: req.params.id, date: checkDate },
    { followed: followed === 'on', comment },
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