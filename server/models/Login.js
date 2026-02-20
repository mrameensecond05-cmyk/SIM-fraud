const mongoose = require('mongoose');

const LoginSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    phone_number: { type: String, unique: true, sparse: true },
    password_hash: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    last_login: { type: Date },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Login', LoginSchema);
