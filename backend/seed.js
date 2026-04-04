const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('./models/Book');
const connectDB = require('./config/db');

dotenv.config();

const sampleBooks = [
  {
    title: 'Learning Python',
    author: 'Mark Lutz',
    category: 'Programming',
    language: 'English',
    description: 'Comprehensive guide to Python programming.',
    fileUrl: 'https://example.com/files/learning-python.pdf'
  },
  {
    title: 'తెలుగు సామగ్రి',
    author: 'రామానుగ్రహ్',
    category: 'Literature',
    language: 'Telugu',
    description: 'తెలుగు సాహిత్య సేకరణ.',
    fileUrl: 'https://example.com/files/telugu-book.pdf'
  },
  {
    title: 'हिंदी कहानी संग्रह',
    author: 'प्रिया शर्मा',
    category: 'Fiction',
    language: 'Hindi',
    description: 'हिंदी की चुनिन्दा कहानियाँ',
    fileUrl: 'https://example.com/files/hindi-stories.pdf'
  },
  {
    title: 'Data Structures in JS',
    author: 'A. Developer',
    category: 'Programming',
    language: 'English',
    description: 'Practical DS implementations in JavaScript.',
    fileUrl: 'https://example.com/files/ds-js.pdf'
  },
  {
    title: 'Mathematics for Everyone',
    author: 'S. Kumar',
    category: 'Education',
    language: 'English',
    description: 'Elementary mathematics explained clearly.',
    fileUrl: 'https://example.com/files/math-everyone.pdf'
  }
];

const seed = async () => {
  await connectDB();
  try {
    await Book.deleteMany({});
    const created = await Book.insertMany(sampleBooks);
    console.log(`Inserted ${created.length} books`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
