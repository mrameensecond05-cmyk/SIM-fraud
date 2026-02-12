const axios = require('axios');
require('dotenv').config();

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';
const MAX_SMS_PER_DAY = 3;

// --- Daily Rate Limiter ---
let smsCount = 0;
let lastResetDate = new Date().toDateString();

function checkAndResetDailyLimit() {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
        smsCount = 0;
        lastResetDate = today;
        console.log('[SMS] Daily counter reset.');
    }
}

function canSendSMS() {
    checkAndResetDailyLimit();
    return smsCount < MAX_SMS_PER_DAY;
}

function getRemainingQuota() {
    checkAndResetDailyLimit();
    return MAX_SMS_PER_DAY - smsCount;
}
// --- End Rate Limiter ---

if (FAST2SMS_API_KEY) {
    console.log(`✅ Fast2SMS Initialized (API Key configured, limit: ${MAX_SMS_PER_DAY} SMS/day)`);
} else {
    console.warn("⚠️  Fast2SMS API Key missing in .env. SMS will log to console only (Mock Mode).");
}

/**
 * Strips the +91 prefix from an Indian phone number.
 */
function sanitizePhone(phone) {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+91')) cleaned = cleaned.substring(3);
    if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.substring(2);
    return cleaned;
}

/**
 * Sends an SMS using Fast2SMS Quick SMS route.
 * Rate limited to MAX_SMS_PER_DAY per day.
 */
async function sendSimulatedSMS(to, body) {
    if (!to) {
        console.error("sendSMS: No recipient phone number provided.");
        return null;
    }

    const phone = sanitizePhone(to);
    if (!phone || phone.length !== 10) {
        console.error(`sendSMS: Invalid phone number after sanitization: "${phone}" (original: "${to}")`);
        return null;
    }

    // Console Log (Always do this for visibility)
    console.log(`\n[SMS] To: ${phone} | Body: "${body}"`);

    // Check daily rate limit
    if (!canSendSMS()) {
        console.log(`[SMS] ⛔ Daily limit reached (${MAX_SMS_PER_DAY}/${MAX_SMS_PER_DAY}). Message logged to console only.`);
        return { request_id: 'RATE_LIMITED_' + Date.now(), status: 'logged', rateLimited: true, remaining: 0 };
    }

    if (!FAST2SMS_API_KEY) {
        console.log("[SMS] Mock Success (No Fast2SMS API Key)\n");
        return { request_id: 'MOCK_' + Date.now(), status: 'queued' };
    }

    try {
        const response = await axios.get(FAST2SMS_BASE_URL, {
            params: {
                authorization: FAST2SMS_API_KEY,
                message: body,
                language: 'english',
                route: 'q',
                numbers: phone,
            },
            headers: { 'cache-control': 'no-cache' }
        });

        if (response.data && response.data.return === true) {
            smsCount++;
            const remaining = MAX_SMS_PER_DAY - smsCount;
            console.log(`[SMS] ✅ Sent! Request ID: ${response.data.request_id} (${remaining} remaining today)\n`);
            return {
                request_id: response.data.request_id,
                status: 'sent',
                message: response.data.message,
                remaining: remaining
            };
        } else {
            console.error(`[SMS] ❌ Fast2SMS Error: ${JSON.stringify(response.data)}\n`);
            return null;
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        console.error(`[SMS] ❌ Fast2SMS Error: ${errMsg}`);
        console.log(`[SMS] ⚠️  Falling back to console-only mode. Message logged above.`);
        return { request_id: 'FALLBACK_' + Date.now(), status: 'logged', fallback: true };
    }
}

/**
 * Sends a numeric OTP using Fast2SMS OTP route.
 * Also rate limited.
 */
async function sendOTP(to, otp) {
    if (!to) {
        console.error("sendOTP: No recipient phone number provided.");
        return null;
    }

    const phone = sanitizePhone(to);
    if (!phone || phone.length !== 10) {
        console.error(`sendOTP: Invalid phone number: "${phone}"`);
        return null;
    }

    console.log(`\n[OTP] To: ${phone} | OTP: ${otp}`);

    if (!canSendSMS()) {
        console.log(`[OTP] ⛔ Daily limit reached (${MAX_SMS_PER_DAY}/${MAX_SMS_PER_DAY}). OTP logged to console only.`);
        return { request_id: 'RATE_LIMITED_OTP_' + Date.now(), status: 'logged', rateLimited: true, remaining: 0 };
    }

    if (!FAST2SMS_API_KEY) {
        console.log("[OTP] Mock Success (No Fast2SMS API Key)\n");
        return { request_id: 'MOCK_OTP_' + Date.now(), status: 'queued' };
    }

    try {
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: FAST2SMS_API_KEY,
                variables_values: String(otp),
                route: 'otp',
                numbers: phone,
            },
            headers: { 'cache-control': 'no-cache' }
        });

        if (response.data && response.data.return === true) {
            smsCount++;
            const remaining = MAX_SMS_PER_DAY - smsCount;
            console.log(`[OTP] ✅ Sent! Request ID: ${response.data.request_id} (${remaining} remaining today)\n`);
            return {
                request_id: response.data.request_id,
                status: 'sent',
                message: response.data.message,
                remaining: remaining
            };
        } else {
            console.error(`[OTP] ❌ Fast2SMS Error: ${JSON.stringify(response.data)}\n`);
            return null;
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        console.error(`[OTP] ❌ Fast2SMS Error: ${errMsg}`);
        console.log(`[OTP] ⚠️  Falling back to console-only mode. OTP logged above.`);
        return { request_id: 'FALLBACK_OTP_' + Date.now(), status: 'logged', fallback: true };
    }
}

module.exports = { sendSimulatedSMS, sendOTP, getRemainingQuota };
