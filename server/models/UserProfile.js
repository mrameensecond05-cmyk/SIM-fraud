const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    login: { type: mongoose.Schema.Types.ObjectId, ref: 'Login', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: null },
    place_address: { type: String, default: null },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
