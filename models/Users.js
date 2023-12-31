const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userStatus: { 
    type: Number, 
    required: true 
  },
  signupCode: {
    type: String,
    required: false,
  },
});

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;

