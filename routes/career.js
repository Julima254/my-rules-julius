const express = require('express');
const router = express.Router();
const { Career } = require('../models/models');

router.get('/', async (req, res) => {
  const tasks = await Career.find().sort({ createdAt: -1 });
  res.render('career', { tasks });
});

router.post('/', async (req, res) => {
  const { task, description, targetDate } = req.body;
  await Career.create({ task, description, targetDate: targetDate || null });
  res.redirect('/career');
});

router.put('/:id', async (req, res) => {
  const { task, description, targetDate, status } = req.body;
  const update = { task, description, targetDate, status };
  if (status === 'achieved') update.dateAchieved = new Date();
  await Career.findByIdAndUpdate(req.params.id, update);
  res.redirect('/career');
});

router.delete('/:id', async (req, res) => {
  await Career.findByIdAndDelete(req.params.id);
  res.redirect('/career');
});

module.exports = router;