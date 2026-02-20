const mongoose = require('mongoose');

const PredictionOutputSchema = new mongoose.Schema({
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, unique: true },
    fraud_score: { type: Number, required: true, min: 0, max: 1 },
    decision: { type: String, enum: ['ALLOW', 'STEP_UP', 'BLOCK'], required: true },
    model_version: { type: String, default: 'v1.0' },
    features_json: { type: mongoose.Schema.Types.Mixed, default: null },
    explanation_json: { type: mongoose.Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PredictionOutput', PredictionOutputSchema);
