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
  checks.forEach(c => {
    checksMap[c.slot.toString()] = {
      done: c.done,
      comment: c.comment || ''
    };
  });

  res.render('routine', { slots, checksMap, date });
});

// Add a new slot
router.post('/', async (req, res) => {
  const { hour, endHour, task, date } = req.body;
  await RoutineSlot.create({ hour, endHour, task });
  res.redirect('/routine?date=' + (date || todayStr()));
});

// Edit a slot permanently (start time, end time, task)
router.post('/:id/edit', async (req, res) => {
  const { hour, endHour, task, date } = req.body;
  const update = {};
  if (hour) update.hour = hour;
  if (endHour) update.endHour = endHour;
  if (typeof task === 'string' && task.trim()) update.task = task.trim();

  await RoutineSlot.findByIdAndUpdate(req.params.id, { $set: update });
  res.redirect('/routine?date=' + (date || todayStr()));
});

// Done + comment for a specific date
router.post('/:id/check', async (req, res) => {
  const { date, done, comment } = req.body;
  const checkDate = date || todayStr();

  await RoutineCheck.findOneAndUpdate(
    { slot: req.params.id, date: checkDate },
    { $set: { done: done === 'on', comment: comment || '' } },
    { upsert: true }
  );
  res.redirect('/routine?date=' + checkDate);
});

router.delete('/:id', async (req, res) => {
  await RoutineSlot.findByIdAndDelete(req.params.id);
  await RoutineCheck.deleteMany({ slot: req.params.id });
  res.redirect('/routine?date=' + (req.query.date || todayStr()));
});

module.exports = router;