import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export interface SIMSentinelPlugin {
    /**
     * Request permissions for SMS, Phone State, etc.
     * On Android 13+, this also includes Notification permission.
     */
    requestPermissions(): Promise<{ granted: boolean; message?: string }>;

    /**
     * Retrieve device identifiers like IMEI (if possible) or Android ID.
     */
    getIdentifiers(): Promise<{ imei: string; type: 'IMEI' | 'ANDROID_ID' }>;

    addListener(eventName: 'smsReceived', listenerFunc: (data: { sender: string; message: string; timestamp: number }) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
}

const SIMSentinel = registerPlugin<SIMSentinelPlugin>('SIMSentinel', {
    web: {
        requestPermissions: async () => {
            console.log('SIMSentinel: Web environment detected, simulating permission grant.');
            return { granted: true, message: 'Simulated Web Grant' };
        },
        getIdentifiers: async () => {
            console.log('SIMSentinel: Web environment detected, returning mock ID.');
            return { imei: 'WEB-MOCK-ID-12345', type: 'ANDROID_ID' };
        },
        addListener: async (eventName, listenerFunc) => {
            console.log(`SIMSentinel: Web listener added for ${eventName}`);
            // Simulate an SMS for testing in web after 5 seconds
            setTimeout(() => {
                listenerFunc({
                    sender: "AX-HDFC",
                    message: "Your OTP for transaction of Rs. 50000 is 123456.",
                    timestamp: Date.now()
                });
            }, 5000);
            return { remove: async () => { } } as any;
        }
    }
});

export default SIMSentinel;
