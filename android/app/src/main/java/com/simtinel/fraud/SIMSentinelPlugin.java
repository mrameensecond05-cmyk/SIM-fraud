package com.simtinel.fraud;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.telephony.TelephonyManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

@CapacitorPlugin(name = "SIMSentinel", permissions = {
        @Permission(alias = "sms", strings = {
                Manifest.permission.READ_SMS,
                Manifest.permission.RECEIVE_SMS
        }),
        @Permission(alias = "phone", strings = {
                Manifest.permission.READ_PHONE_STATE
        }),
        @Permission(alias = "notifications", strings = {
                // Post notifications is only valid for API 33+, checking it safely below
                "android.permission.POST_NOTIFICATIONS"
        })
})
public class SIMSentinelPlugin extends Plugin {

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        // Prepare aliases based on version
        String[] aliases;
        if (Build.VERSION.SDK_INT >= 33) {
            aliases = new String[] { "sms", "phone", "notifications" };
        } else {
            aliases = new String[] { "sms", "phone" };
        }

        requestPermissionForAliases(aliases, call, "permissionsCallback");
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        // Check if essential permissions are granted
        boolean smsGranted = getPermissionState("sms") == PermissionState.GRANTED;
        boolean phoneGranted = getPermissionState("phone") == PermissionState.GRANTED;

        if (smsGranted && phoneGranted) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("message", "All required permissions granted");
            call.resolve(ret);
        } else {
            call.reject("Required permissions (SMS, Phone) were denied.");
        }
    }

    private static SIMSentinelPlugin instance;
    private static final String PREFS_NAME = "SIMSentinelPrefs";
    private static final String KEY_PENDING_SMS = "pending_sms";

    public void load() {
        instance = this;
    }

    public static void onSmsReceived(Context context, String sender, String message, long timestamp) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("sender", sender);
            ret.put("message", message);
            ret.put("timestamp", timestamp);
            instance.notifyListeners("smsReceived", ret);
        } else {
            // Background Queueing
            savePendingSms(context, sender, message, timestamp);
        }
    }

    private static void savePendingSms(Context context, String sender, String message, long timestamp) {
        try {
            android.content.SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            // Simple JSON array storage
            org.json.JSONArray queue = new org.json.JSONArray(prefs.getString(KEY_PENDING_SMS, "[]"));

            org.json.JSONObject sms = new org.json.JSONObject();
            sms.put("sender", sender);
            sms.put("message", message);
            sms.put("timestamp", timestamp);

            queue.put(sms);

            prefs.edit().putString(KEY_PENDING_SMS, queue.toString()).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @PluginMethod
    public void checkForPendingSMS(PluginCall call) {
        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String jsonStr = prefs.getString(KEY_PENDING_SMS, "[]");

        try {
            org.json.JSONArray queue = new org.json.JSONArray(jsonStr);
            if (queue.length() > 0) {
                for (int i = 0; i < queue.length(); i++) {
                    org.json.JSONObject sms = queue.getJSONObject(i);
                    JSObject ret = new JSObject();
                    ret.put("sender", sms.getString("sender"));
                    ret.put("message", sms.getString("message"));
                    ret.put("timestamp", sms.getLong("timestamp"));
                    notifyListeners("smsReceived", ret);
                }
                // Clear queue
                prefs.edit().remove(KEY_PENDING_SMS).apply();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        call.resolve();
    }

    @SuppressLint({ "HardwareIds", "MissingPermission" })
    @PluginMethod
    public void getIdentifiers(PluginCall call) {
        JSObject ret = new JSObject();
        Context context = getContext();

        try {
            // 1. Try to get IMEI (Only works for < Android 10 or with special privileges)
            // Even with READ_PHONE_STATE, Android 10+ returns SecurityException or null for
            // non-system apps
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
                if (tm != null) {
                    String imei = tm.getDeviceId();
                    if (imei != null) {
                        ret.put("imei", imei);
                        ret.put("type", "IMEI");
                        call.resolve(ret);
                        return;
                    }
                }
            }

            // 2. Fallback to Android ID
            String androidId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
            ret.put("imei", androidId); // Using androidId as the identifier key for consistency with frontend
            ret.put("type", "ANDROID_ID");

            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to retrieve identifiers: " + e.getMessage());
        }
    }
}
