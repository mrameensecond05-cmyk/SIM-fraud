const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    prediction: { type: mongoose.Schema.Types.ObjectId, ref: 'PredictionOutput', required: true },
    severity: { type: String, default: null },  // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status: { type: String, default: 'open' }, // 'open', 'in_review', 'closed'
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Login', default: null },
    created_at: { type: Date, default: Date.now },
    closed_at: { type: Date, default: null }
});

module.exports = mongoose.model('Alert', AlertSchema);
