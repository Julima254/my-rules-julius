const express = require('express');
const router = express.Router();
const { RoutineSlot, RoutineCheck } = require('../models/models');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')}${period.toLowerCase()}`;
}

router.get('/', async (req, res) => {
  const date = req.query.date || todayStr();
  const slots = await RoutineSlot.find().sort({ hour: 1 });
  const checks = await RoutineCheck.find({ date });

  const checksMap = {};
  checks.forEach(c => {
    checksMap[c.slot.toString()] = {
      done: c.done,
      comment: c.comment || '',
      task: c.task || ''
    };
  });

  const formattedSlots = slots.map(s => ({
    ...s.toObject(),
    hourLabel: `${formatTime(s.hour)} - ${formatTime(s.endHour)}`
  }));

  res.render('routine', { slots: formattedSlots, checksMap, date });
});

router.post('/', async (req, res) => {
  const { hour, endHour, task } = req.body;
  await RoutineSlot.create({ hour, endHour, task });
  res.redirect('/routine');
});

router.post('/:id/check', async (req, res) => {
  const { date, done, comment, task } = req.body;
  const checkDate = date || todayStr();

  await RoutineCheck.findOneAndUpdate(
    { slot: req.params.id, date: checkDate },
    { done: done === 'on', comment: comment || '', task: task || '' },
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