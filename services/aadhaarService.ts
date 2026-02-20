
/**
 * Simulated service mimicking the requested Java Spring Boot 'SIM-Aadhaar Genuineness Service'
 * Endpoints: 
 * - POST /api/v1/auth/aadhaar-otp
 * - POST /api/v1/verify-ownership
 */

export const requestAadhaarOTP = async (aadhaarNumber: string) => {
  console.log(`[SIMULATED BACKEND] POST /api/v1/auth/aadhaar-otp for Aadhaar: ${aadhaarNumber}`);
  // Simulate UIDAI Java SDK delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: "OTP sent to registered mobile number" };
};

export const verifyMobileOwnership = async (phone: string, aadhaar: string) => {
  console.log(`[SIMULATED BACKEND] GET /api/v1/verify-ownership for ${phone}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Anomaly Logic: Mocking a "Primary" number check
  // For demonstration, let's say only numbers ending in '0' are "Primary" in the telco DB
  const isPrimaryInRegistry = phone.endsWith('0');
  
  return {
    isPrimary: isPrimaryInRegistry,
    suggestedType: isPrimaryInRegistry ? 'PRIMARY' : 'SECONDARY',
    carrier: "Telecom-India-v4"
  };
};

export const validateOTP = async (otp: string) => {
  console.log(`[SIMULATED BACKEND] POST /api/v1/auth/validate-otp: ${otp}`);
  await new Promise(resolve => setTimeout(resolve, 1200));
  return otp === "123456"; // Demo logic
};
