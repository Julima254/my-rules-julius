const express = require('express');
const router = express.Router();
const { RoutineSlot, RoutineCheck } = require('../models/models');

// Today in Nairobi time (toISOString() gives the wrong day between 12am and 3am)
function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
}

// Makes sure a failed save shows an error instead of hanging the page
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.get('/', wrap(async (req, res) => {
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

  res.set('Cache-Control', 'no-store'); // always show the latest edits
  res.render('routine', { slots, checksMap, date });
}));

// Add a new slot
router.post('/', wrap(async (req, res) => {
  const { hour, endHour, task, date } = req.body;
  await RoutineSlot.create({ hour, endHour, task });
  res.redirect('/routine?date=' + (date || todayStr()));
}));

// Edit a slot permanently (start time, end time, task)
router.post('/:id/edit', wrap(async (req, res) => {
  const { hour, endHour, task, date } = req.body;
  const update = {};
  if (hour) update.hour = hour;
  if (endHour) update.endHour = endHour;
  if (typeof task === 'string' && task.trim()) update.task = task.trim();

  await RoutineSlot.findByIdAndUpdate(req.params.id, { $set: update });
  res.redirect('/routine?date=' + (date || todayStr()));
}));

// Done + comment for a specific date
router.post('/:id/check', wrap(async (req, res) => {
  const { date, done, comment } = req.body;
  const checkDate = date || todayStr();

  await RoutineCheck.findOneAndUpdate(
    { slot: req.params.id, date: checkDate },
    { $set: { done: done === 'on', comment: comment || '' } },
    { upsert: true }
  );

  if ((req.headers.accept || '').includes('application/json')) {
    return res.json({ ok: true });
  }
  res.redirect('/routine?date=' + checkDate);
}));

// Delete (works from a normal form button)
router.post('/:id/delete', wrap(async (req, res) => {
  await RoutineSlot.findByIdAndDelete(req.params.id);
  await RoutineCheck.deleteMany({ slot: req.params.id });
  res.redirect('/routine?date=' + (req.body.date || todayStr()));
}));

// Original delete route, kept so nothing else breaks
router.delete('/:id', wrap(async (req, res) => {
  await RoutineSlot.findByIdAndDelete(req.params.id);
  await RoutineCheck.deleteMany({ slot: req.params.id });
  res.redirect('/routine?date=' + (req.query.date || todayStr()));
}));

module.exports = router;