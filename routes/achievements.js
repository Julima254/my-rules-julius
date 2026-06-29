const express = require('express');
const router = express.Router();
const { Achievement } = require('../models/models');

// List
router.get('/', async (req, res) => {
  const achievements = await Achievement.find().sort({ createdAt: -1 });
  res.render('achievements', { achievements });
});

// Create
router.post('/', async (req, res) => {
  const { title, description, targetDate } = req.body;
  await Achievement.create({ title, description, targetDate: targetDate || null });
  res.redirect('/achievements');
});

// Mark achieved
router.put('/:id/achieve', async (req, res) => {
  await Achievement.findByIdAndUpdate(req.params.id, { dateAchieved: new Date(), dateFailed: null });
  res.redirect('/achievements');
});

// Mark failed
router.put('/:id/fail', async (req, res) => {
  await Achievement.findByIdAndUpdate(req.params.id, { dateFailed: new Date(), dateAchieved: null });
  res.redirect('/achievements');
});

// Reset status
router.put('/:id/reset', async (req, res) => {
  await Achievement.findByIdAndUpdate(req.params.id, { dateAchieved: null, dateFailed: null });
  res.redirect('/achievements');
});

// Update notes
router.put('/:id', async (req, res) => {
  const { title, description, targetDate, notes } = req.body;
  await Achievement.findByIdAndUpdate(req.params.id, { title, description, targetDate, notes });
  res.redirect('/achievements');
});

// Delete
router.delete('/:id', async (req, res) => {
  await Achievement.findByIdAndDelete(req.params.id);
  res.redirect('/achievements');
});

module.exports = router;