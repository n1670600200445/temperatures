#if defined(ESP32)
#include <WiFiMulti.h>
WiFiMulti wifiMulti;
#define DEVICE "ESP32"
#elif defined(ESP8266)
#include <ESP8266WiFiMulti.h>
ESP8266WiFiMulti wifiMulti;
#define DEVICE "ESP8266"
#endif

#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_AMG88xx.h>
#include <InfluxDbClient.h>
#include <InfluxDbCloud.h>

byte mac[6];
String str_mac = "";

// WiFi AP SSID
#define WIFI_SSID "NES"
// WiFi password
#define WIFI_PASSWORD "06133700"

#define INFLUXDB_URL "https://us-east-1-1.aws.cloud2.influxdata.com"
#define INFLUXDB_TOKEN "_IHzr59QZ80M3sY4sNsQmkUBdAZPvgxjk5TRRIvPQMkhFCb6dUSY6jpeIFxtf9eKWF7pDSAwH5k3QtMzvzhzdg=="
#define INFLUXDB_ORG "60ea2d775f2de60f"
#define INFLUXDB_BUCKET "MINIPROJECT"

// Time zone info
#define TZ_INFO "UTC7"
Adafruit_AMG88xx amg;

// Declare InfluxDB client instance with preconfigured InfluxCloud certificate
InfluxDBClient client(INFLUXDB_URL, INFLUXDB_ORG, INFLUXDB_BUCKET, INFLUXDB_TOKEN, InfluxDbCloud2CACert);

// Declare Data point
Point sensor("temperatures");

void setup() {
  Serial.begin(115200);

  // Setup wifi
  WiFi.mode(WIFI_STA);
  wifiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to wifi");
  while (wifiMulti.run() != WL_CONNECTED) {
    Serial.print(".");
    delay(100);
  }
  Serial.println();

  // Accurate time is necessary for certificate validation and writing in batches
  // We use the NTP servers in your area as provided by: https://www.pool.ntp.org/zone/
  // Syncing progress and the time will be printed to Serial.
  timeSync(TZ_INFO, "pool.ntp.org", "time.nis.gov");


  // Check server connection
  if (client.validateConnection()) {
    Serial.print("Connected to InfluxDB: ");
    Serial.println(client.getServerUrl());
  } else {
    Serial.print("InfluxDB connection failed: ");
    Serial.println(client.getLastErrorMessage());
  }
  bool status;

  // default settings
  status = amg.begin();
  if (!status) {
    Serial.println("Could not find a valid AMG88xx sensor, check wiring!");
    while (1)
      ;
  }
  Serial.println("Setup complete");

  WiFi.macAddress(mac);
  str_mac += macToStr(mac);
  Serial.println(str_mac);

  sensor.addTag("device", str_mac);
  sensor.addTag("SSID", WiFi.SSID());
}

void loop() {
  // Array to hold all temperature readings
  float temperatures[64];

  // Read all 64 pixels
  amg.readPixels(temperatures, 64);

  // Calculate the maximum temperature
  float max_temperature = temperatures[0];
  for (int i = 1; i < 64; i++) {
    if (temperatures[i] > max_temperature) {
      max_temperature = temperatures[i];
    }
  }

  // Calculate the minimum temperature
  float min_temperature = temperatures[0];
  for (int i = 1; i < 64; i++) {
    if (temperatures[i] < min_temperature) {
      min_temperature = temperatures[i];
    }
  }

  // Print the maximum and minimum temperatures
  Serial.print("Maximum Temperature: ");
  Serial.print(max_temperature);
  Serial.println(" °C");
  Serial.print("Minimum Temperature: ");
  Serial.print(min_temperature);
  Serial.println(" °C");


  // Clear fields for reusing the point. Tags will remain the same as set above.
  sensor.clearFields();

  // Store measured values into point
  for (int i = 0; i < 64; i++) {
    String field_name = "Temp" + String(i);
    sensor.addField(field_name, temperatures[i]);
  }
  // sensor.addField("rssi", WiFi.RSSI());
  // Add max_temperature and min_temperature to the fields
  sensor.addField("max_temperature", max_temperature);
  sensor.addField("min_temperature", min_temperature);

  // Print what are we exactly writing
  Serial.print("Writing: ");
  Serial.println(sensor.toLineProtocol());

  // Check WiFi connection and reconnect if needed
  if (wifiMulti.run() != WL_CONNECTED) {
    Serial.println("Wifi connection lost");
  }

  // Write point
  if (!client.writePoint(sensor)) {
    Serial.print("InfluxDB write failed: ");
    Serial.println(client.getLastErrorMessage());
  } else {
    Serial.println("InfluxDB write successful");
  }

  readinflux();
  Serial.println("Waiting 10 minutes");
  delay(600000);  // รอ 10 นาที
}

String macToStr(const uint8_t* mac) {
  String result;
  for (int i = 0; i < 6; ++i) {
    result += String(mac[i], 16);
    if (i < 5)
      result += ':';
  }
  return result;
}

void readinflux() {
  String query1;
  query1 = R"(
        from(bucket: "MINIPROJECT")
        |> range(start: -10m)
        |> filter(fn: (r) => r["device"] == "bc:dd:c2:53:8:61")
        |> filter(fn: (r) => r["_field"] == "max_temperature" or r["_field"] == "min_temperature")
        |> last())";

  FluxQueryResult result = client.query(query1);
  while (result.next()) {
    Serial.println(result.getValueByName("_value").getDouble());
  }
  result.close();
}
