const express = require('express');
const router = express.Router();
const { RoutineSlot, RoutineCheck } = require('../models/models');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

router.get('/', async (req, res) => {
  const date = req.query.date || todayStr();
  const slots = await RoutineSlot.find().sort({ hour: 1 });
  const checks = await RoutineCheck.find({ date });

  const checksMap = {};
  checks.forEach(c => { checksMap[c.slot.toString()] = c.done; });

  res.render('routine', { slots, checksMap, date });
});

router.post('/', async (req, res) => {
  const { hour, task } = req.body;
  await RoutineSlot.create({ hour, task });
  res.redirect('/routine');
});

router.post('/:id/check', async (req, res) => {
  const { date, done } = req.body;
  const checkDate = date || todayStr();

  await RoutineCheck.findOneAndUpdate(
    { slot: req.params.id, date: checkDate },
    { done: done === 'on' },
    { upsert: true }
  );
  res.redirect('/routine?date=' + checkDate);
});

router.delete('/:id', async (req, res) => {
  await RoutineSlot.findByIdAndDelete(req.params.id);
  await RoutineCheck.deleteMany({ slot: req.params.id });
  res.redirect('/routine');
});

module.exports = router;