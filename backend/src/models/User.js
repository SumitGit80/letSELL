import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },

  // Optional Fields
  phone: {
    type: String,
    trim: true
  },

  hostel: {
    type: String,
    trim: true
  },

  roomNumber: {
    type: String,
    trim: true
  },

  branch: {
    type: String,
    trim: true
  },

  graduationYear: {
    type: Number
  },

  rollNumber: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String // image URL
  },
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;