/*
 * Water Tank Monitor - ESP32 WROOM 32 with Auto-Cleaning
 * 
 * Features:
 * - Real-time sensor monitoring (pH, TDS, Turbidity, Water Level)
 * - 16x2 LCD display for local monitoring
 * - Automated cleaning sequence with motor stirring
 * - Wi-Fi connectivity with Supabase integration
 * - Manual and automatic cleaning triggers
 * - UV light sanitation
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "config.h"

// LCD Setup
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ADC Constants
const float ADC_MAX = 4095.0;
const float VREF = 3.3;

// Sensor Pins
const int pHPin = 35;
const int turbidityPin = 34;
const int tdsPin = 32;
const int tempPin = 33;
const int trigPin = 4;
const int echoPin = 2;

// pH Calibration
float pH_Slope  = -4.16;
float pH_Offset = 17.27;

// Turbidity Calibration
#define V_CLEAR   1.52
#define V_DIRTY   0.80
#define NTU_CLEAR 1.0
#define NTU_DIRTY 100.0
float turbSlope;
float turbOffset;

// TDS Calibration
float tdsFactor = 0.5;

// Ultrasonic Setup
#define SENSOR_OFFSET_CM  5.0
#define TANK_HEIGHT_CM    50.0
#define DEAD_ZONE_CM      5.0

// Thresholds
#define PH_LOW_LIMIT        6.5
#define PH_HIGH_LIMIT       8.5
#define TURBIDITY_LIMIT     25.0
#define TDS_LIMIT           500.0
#define LEVEL_LIMIT_PERCENT 5.0
#define TEMP_LIMIT          35.0

// Motor Driver Pins (BTS7960)
#define RPWM 25  // Right PWM (Forward)
#define LPWM 26  // Left PWM (Backward)
#define REN  33  // Right Enable
#define LEN  15  // Left Enable

// Relay Pins
#define RELAY_PUMP        27
#define RELAY_INLET_VALVE 18
#define RELAY_DRAIN_VALVE 19
#define RELAY_UV_LIGHT    14

// Button Pin
#define CLEAN_BUTTON 16

// Timing
#define SENSOR_READ_INTERVAL 2000   // 2 seconds
#define SUPABASE_UPDATE_INTERVAL 5000 // 5 seconds
#define COMMAND_CHECK_INTERVAL 3000 // 3 seconds

// Global State
bool userApproved = false;
bool cleaningInProgress = false;
unsigned long lastSensorRead = 0;
unsigned long lastSupabaseUpdate = 0;
unsigned long lastCommandCheck = 0;

// Sensor Data
float currentPH = 0;
float currentTurbidity = 0;
float currentTDS = 0;
float currentTemp = 0;
float currentLevel = 0;

// Forward declarations
void connectWiFi();
void readSensors();
void updateLCD();
void checkCleaningNeeded();
void startCleaning();
void sendDataToSupabase();
void checkSupabaseCommands();

void setup() {
  Serial.begin(115200);
  Serial.println("AquaPro Water Tank Monitor Starting...");

  // Initialize LCD
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("AquaPro v2.0");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");

  // Initialize Relay Pins (Active LOW)
  pinMode(RELAY_PUMP, OUTPUT);
  pinMode(RELAY_INLET_VALVE, OUTPUT);
  pinMode(RELAY_DRAIN_VALVE, OUTPUT);
  pinMode(RELAY_UV_LIGHT, OUTPUT);
  
  digitalWrite(RELAY_PUMP, HIGH);
  digitalWrite(RELAY_INLET_VALVE, HIGH);
  digitalWrite(RELAY_DRAIN_VALVE, HIGH);
  digitalWrite(RELAY_UV_LIGHT, LOW);

  // Initialize Motor Driver
  pinMode(RPWM, OUTPUT);
  pinMode(LPWM, OUTPUT);
  pinMode(REN, OUTPUT);
  pinMode(LEN, OUTPUT);
  
  digitalWrite(REN, LOW);
  digitalWrite(LEN, LOW);
  analogWrite(RPWM, 0);
  analogWrite(LPWM, 0);

  // Initialize Ultrasonic
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Initialize Button
  pinMode(CLEAN_BUTTON, INPUT_PULLUP);

  // Calculate turbidity calibration
  turbSlope  = (NTU_DIRTY - NTU_CLEAR) / (V_DIRTY - V_CLEAR);
  turbOffset = NTU_CLEAR - (turbSlope * V_CLEAR);

  // Connect to WiFi
  connectWiFi();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  delay(2000);
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Read sensors periodically
  if (millis() - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readSensors();
    checkCleaningNeeded();
    lastSensorRead = millis();
  }

  // Update Supabase periodically
  if (millis() - lastSupabaseUpdate >= SUPABASE_UPDATE_INTERVAL) {
    sendDataToSupabase();
    lastSupabaseUpdate = millis();
  }

  // Check for Supabase commands
  if (millis() - lastCommandCheck >= COMMAND_CHECK_INTERVAL) {
    checkSupabaseCommands();
    lastCommandCheck = millis();
  }

  // Check for manual clean button press
  if (!cleaningInProgress && digitalRead(CLEAN_BUTTON) == LOW) {
    userApproved = true;
    delay(200); // Debounce
  }

  // Check for serial commands
  if (!cleaningInProgress && Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "CLEAN") {
      userApproved = true;
    }
  }

  // Update LCD display
  if (!cleaningInProgress) {
    updateLCD();
  }

  delay(100);
}

void connectWiFi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(attempts % 16, 1);
    lcd.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(2000);
  } else {
    Serial.println("\nWiFi Connection Failed!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");
    lcd.setCursor(0, 1);
    lcd.print("Check Config");
    delay(3000);
  }
}

void readSensors() {
  // Read pH
  currentPH = (analogRead(pHPin) / ADC_MAX * VREF) * pH_Slope + pH_Offset;

  // Read Turbidity
  float vTurb = analogRead(turbidityPin) / ADC_MAX * VREF;
  currentTurbidity = turbSlope * vTurb + turbOffset;
  if (currentTurbidity < 0) currentTurbidity = 0;

  // Read TDS
  float vTDS = analogRead(tdsPin) / ADC_MAX * VREF;
  currentTDS = (133.42 * vTDS * vTDS * vTDS
              - 255.86 * vTDS * vTDS
              + 857.39 * vTDS) * tdsFactor;
  if (currentTDS < 0) currentTDS = 0;

  // Read Temperature (assuming NTC or LM35)
  float vTemp = analogRead(tempPin) / ADC_MAX * VREF;
  currentTemp = vTemp * 100.0; // For LM35: 10mV/°C

  // Read Water Level
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  float dist = (duration * 0.0343) / 2.0;
  if (dist < DEAD_ZONE_CM) dist = DEAD_ZONE_CM;

  float waterHeight = TANK_HEIGHT_CM - (dist - SENSOR_OFFSET_CM);
  if (waterHeight < 0) waterHeight = 0;
  if (waterHeight > TANK_HEIGHT_CM) waterHeight = TANK_HEIGHT_CM;
  currentLevel = (waterHeight / TANK_HEIGHT_CM) * 100.0;

  // Print to Serial
  Serial.print("pH: "); Serial.print(currentPH, 2);
  Serial.print(" | Turb: "); Serial.print(currentTurbidity, 1);
  Serial.print(" | TDS: "); Serial.print(currentTDS, 0);
  Serial.print(" | Temp: "); Serial.print(currentTemp, 1);
  Serial.print(" | Level: "); Serial.print(currentLevel, 1);
  Serial.println("%");
}

void updateLCD() {
  static bool showParams = true;
  static unsigned long lastToggle = 0;
  
  if (millis() - lastToggle < 3000) return;
  lastToggle = millis();

  lcd.clear();
  if (showParams) {
    // Show sensor readings
    lcd.setCursor(0, 0);
    lcd.print("pH:");
    lcd.print(currentPH, 1);
    lcd.print(" T:");
    lcd.print(currentTurbidity, 0);
    
    lcd.setCursor(0, 1);
    lcd.print("TDS:");
    lcd.print(currentTDS, 0);
    lcd.print(" L:");
    lcd.print(currentLevel, 0);
    lcd.print("%");
  } else {
    // Show alert status
    bool cleaningNeeded = (currentPH < PH_LOW_LIMIT || currentPH > PH_HIGH_LIMIT ||
                          currentTurbidity > TURBIDITY_LIMIT ||
                          currentTDS > TDS_LIMIT);
    
    lcd.setCursor(0, 0);
    if (cleaningNeeded) {
      lcd.print("*** ALERT ***");
      lcd.setCursor(0, 1);
      lcd.print("CLEANING NEEDED");
    } else {
      lcd.print("Water Quality");
      lcd.setCursor(0, 1);
      lcd.print("Status: OK");
    }
  }
  
  showParams = !showParams;
}

void checkCleaningNeeded() {
  bool cleaningNeeded = false;
  
  if (currentPH < PH_LOW_LIMIT || currentPH > PH_HIGH_LIMIT) {
    cleaningNeeded = true;
    Serial.println("*** ALERT: pH out of range ***");
  }
  if (currentTurbidity > TURBIDITY_LIMIT) {
    cleaningNeeded = true;
    Serial.println("*** ALERT: High turbidity ***");
  }
  if (currentTDS > TDS_LIMIT) {
    cleaningNeeded = true;
    Serial.println("*** ALERT: High TDS ***");
  }

  // Auto-start cleaning if approved and level is low enough
  if (cleaningNeeded && userApproved && currentLevel < LEVEL_LIMIT_PERCENT && !cleaningInProgress) {
    userApproved = false;
    startCleaning();
  }
}

void startCleaning() {
  cleaningInProgress = true;
  Serial.println("=== STARTING CLEANING SEQUENCE ===");

  // Turn on UV light
  digitalWrite(RELAY_UV_LIGHT, HIGH);

  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Cleaning Tank...");

  // Close inlet, open drain, turn off pump
  digitalWrite(RELAY_PUMP, LOW);
  digitalWrite(RELAY_DRAIN_VALVE, LOW);  // Open drain
  digitalWrite(RELAY_INLET_VALVE, HIGH); // Close inlet

  // Motor stirring sequence
  digitalWrite(REN, HIGH);
  digitalWrite(LEN, HIGH);

  // Forward stirring
  Serial.println("Stirring forward...");
  lcd.setCursor(0,1);
  lcd.print("Stirring FWD");
  analogWrite(RPWM, 180);
  analogWrite(LPWM, 0);
  delay(5000);

  // Pause
  Serial.println("Pause...");
  analogWrite(RPWM, 0);
  delay(2000);

  // Reverse stirring
  Serial.println("Stirring reverse...");
  lcd.setCursor(0,1);
  lcd.print("Stirring REV");
  analogWrite(LPWM, 180);
  delay(5000);

  // Stop motor
  analogWrite(LPWM, 0);
  digitalWrite(REN, LOW);
  digitalWrite(LEN, LOW);

  // Wait for drain
  Serial.println("Draining...");
  lcd.setCursor(0,1);
  lcd.print("Draining...    ");
  delay(5000);

  // Start refilling
  Serial.println("Refilling tank...");
  digitalWrite(RELAY_PUMP, HIGH);  // Turn on pump
  delay(5000);
  digitalWrite(RELAY_DRAIN_VALVE, HIGH);  // Close drain
  digitalWrite(RELAY_INLET_VALVE, LOW);   // Open inlet
  digitalWrite(RELAY_PUMP, LOW);          // Turn off pump

  // Monitor refill progress
  while (true) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    long d = pulseIn(echoPin, HIGH, 30000);
    float dist = (d * 0.0343) / 2.0;
    if (dist < DEAD_ZONE_CM) dist = DEAD_ZONE_CM;

    float h = TANK_HEIGHT_CM - (dist - SENSOR_OFFSET_CM);
    if (h < 0) h = 0;
    if (h > TANK_HEIGHT_CM) h = TANK_HEIGHT_CM;

    float lvl = (h / TANK_HEIGHT_CM) * 100.0;

    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("REFILLING...");
    lcd.setCursor(0,1);
    lcd.print(lvl,0);
    lcd.print(" %");

    Serial.print("Refilling: ");
    Serial.print(lvl);
    Serial.println("%");

    if (lvl >= 100.0) break;
    delay(1000);
  }

  // Cleanup - close valves, turn off UV
  digitalWrite(RELAY_PUMP, HIGH);
  digitalWrite(RELAY_INLET_VALVE, HIGH);
  digitalWrite(RELAY_UV_LIGHT, LOW);

  Serial.println("=== CLEANING COMPLETE ===");
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Cleaning Done!");
  delay(3000);

  cleaningInProgress = false;
}

void sendDataToSupabase() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  
  String url = String(SUPABASE_URL) + "/rest/v1/sensor_readings";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
  http.addHeader("Prefer", "return=minimal");

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["ph"] = currentPH;
  doc["tds"] = currentTDS;
  doc["turbidity"] = currentTurbidity;
  doc["temperature"] = currentTemp;
  doc["water_level"] = currentLevel;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    Serial.print("Supabase POST: ");
    Serial.println(httpCode);
  } else {
    Serial.print("Supabase Error: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

void checkSupabaseCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  
  String url = String(SUPABASE_URL) + "/rest/v1/commands?device_id=eq." + 
               String(DEVICE_ID) + "&executed=eq.false&order=created_at.desc";
  
  http.begin(url);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));

  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error && doc.size() > 0) {
      JsonObject cmd = doc[0];
      String actuator = cmd["actuator"];
      int value = cmd["value"];
      String commandId = cmd["id"];

      Serial.print("Command received: ");
      Serial.print(actuator);
      Serial.print(" = ");
      Serial.println(value);

      // Execute command
      if (actuator == "valve_1") {
        digitalWrite(RELAY_INLET_VALVE, value ? LOW : HIGH);
      } else if (actuator == "valve_2") {
        digitalWrite(RELAY_DRAIN_VALVE, value ? LOW : HIGH);
      } else if (actuator == "uv_light") {
        digitalWrite(RELAY_UV_LIGHT, value ? HIGH : LOW);
      } else if (actuator == "clean") {
        userApproved = true;
      }

      // Mark command as executed
      String updateUrl = String(SUPABASE_URL) + "/rest/v1/commands?id=eq." + commandId;
      HTTPClient updateHttp;
      updateHttp.begin(updateUrl);
      updateHttp.addHeader("Content-Type", "application/json");
      updateHttp.addHeader("apikey", SUPABASE_ANON_KEY);
      updateHttp.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
      
      String updateBody = "{\"executed\":true}";
      updateHttp.PATCH(updateBody);
      updateHttp.end();
    }
  }

  http.end();
}
