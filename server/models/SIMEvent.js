const mongoose = require('mongoose');

const SIMEventSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true },
    event_type: { type: String, enum: ['swap_success', 'imei_change', 'new_sim'], required: true },
    old_imei: { type: String, default: null },
    new_imei: { type: String, default: null },
    location: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
    source_channel: { type: String, default: null }
});

module.exports = mongoose.model('SIMEvent', SIMEventSchema);
