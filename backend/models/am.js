import mongoose from 'mongoose';

// Function to check if ID is for guest
function isGuestId(id) {
  return typeof id === "string" && id.startsWith("guest_");
}

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed, // can be ObjectId or string for guest
      default: function() {
        return new mongoose.Types.ObjectId();
      },
    },

    name: { 
      type: String, 
      required: true 
    },

    email: { 
      type: String,
      required: function() { return !isGuestId(this._id); },
      unique: function() { return !isGuestId(this._id); },
      sparse: true
    },

    password: { 
      type: String,
      required: function() { return !isGuestId(this._id); }
    },

    role: { 
      type: String, 
      enum: ['user', 'admin', 'guest'], 
      default: 'user' 
    },

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
      }
    ],

    downloads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);