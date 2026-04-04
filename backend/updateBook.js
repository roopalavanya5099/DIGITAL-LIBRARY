import mongoose from "mongoose";
import Book from "./models/Book.js"; // ✅ correct// path correct ga adjust cheyyandi

mongoose.connect("mongodb://127.0.0.1:27017/digital_library", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const updateBook = async () => {
  try {
    const book = await Book.findOne(); // first book pick chesukuntundi
    if (!book) {
      console.log("No books found");
      return;
    }

    book.downloads = 10; // example value
    book.favorites = 5;  // example value
    await book.save();

    console.log("Book updated:", book.title);
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
  }
};

updateBook();