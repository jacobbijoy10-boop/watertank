/*
 * Configuration file for ESP32 Water Tank Monitor
 * 
 * This file has been auto-generated with your Supabase credentials.
 * You need to fill in:
 * 1. Your WiFi SSID and Password
 * 2. Your Device ID (create a device in the app first)
 */

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
// TODO: Replace with your actual WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Supabase Configuration (Already configured!)
#define SUPABASE_URL "https://cqgaapheftzunhsawzaf.supabase.co"
#define SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ2FhcGhlZnR6dW5oc2F3emFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDcwODMsImV4cCI6MjA4NTkyMzA4M30.PdtebnICt6V5Fd1-utEYw0P9QZ58UJr7bOPD-Cto-EU"

// Device Configuration
// TODO: Create a device in your app and paste the Device ID here
#define DEVICE_ID "YOUR_DEVICE_UUID_HERE"

// Sensor Calibration (adjust these values after testing)
#define PH_CALIBRATION_OFFSET 0.0
#define TDS_CALIBRATION_MULTIPLIER 1.0
#define TURBIDITY_CALIBRATION_OFFSET 0.0

#endif
