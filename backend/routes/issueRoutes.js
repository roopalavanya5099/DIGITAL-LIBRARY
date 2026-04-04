const express = require('express');
const Issue = require('../models/Issue');
const Book = require('../models/Book');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Create issue record for authenticated user: POST /api/issues/:bookId
router.post('/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const issue = new Issue({ user: req.user.id, book: book._id });
    await issue.save();
    res.status(201).json(issue);
  } catch (err) {
    console.error('Issue create error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get books issued by logged-in user: GET /api/issues/mybooks
router.get('/mybooks', auth, async (req, res) => {
  try {
    const issues = await Issue.find({ user: req.user.id }).populate('book');
    res.json(issues);
  } catch (err) {
    console.error('Get mybooks error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
