const express = require('express');
const router = express.Router();
const { ThemeOfYear } = require('../models/models');

router.get('/', async (req, res) => {
  const themes = await ThemeOfYear.find().sort({ year: -1 });
  res.render('theme', { themes });
});

router.post('/', async (req, res) => {
  const { year, theme, description } = req.body;
  await ThemeOfYear.findOneAndUpdate(
    { year },
    { theme, description },
    { upsert: true }
  );
  res.redirect('/theme');
});

router.delete('/:id', async (req, res) => {
  await ThemeOfYear.findByIdAndDelete(req.params.id);
  res.redirect('/theme');
});

module.exports = router;