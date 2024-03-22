const controller = {};
const { validationResult } = require('express-validator');

const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const token = "_IHzr59QZ80M3sY4sNsQmkUBdAZPvgxjk5TRRIvPQMkhFCb6dUSY6jpeIFxtf9eKWF7pDSAwH5k3QtMzvzhzdg==";
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const client = new InfluxDB({ url, token });
const org = '60ea2d775f2de60f';
const bucket = 'MINIPROJECT';
const moment = require("moment");

controller.Pixel = async (req, res) => {
    try {
        const queryClient = client.getQueryApi(org);

        const startTime = moment.utc('2024-03-20T08:34:36.991Z').toISOString();
        const stopTime = moment.utc(startTime).add(10, 'minutes').toISOString();
        
        const fluxQuery = `from(bucket: "MINIPROJECT")
            |> range(start: ${startTime}, stop: ${stopTime}) 
            |> filter(fn: (r) => r["device"] == "bc:dd:c2:53:8:61")
            |> filter(fn: (r) => r._measurement == "temperatures")
            |> group(columns: ["_field"])`;

        const temperaturesPromise = new Promise((resolve, reject) => {
            const temps = [];
            const timestamps = []; 
            queryClient.queryRows(fluxQuery, {
                next: (row, tableMeta) => {
                    const tableObject = tableMeta.toObject(row);
                    temps.push(tableObject._value);
                    timestamps.push(moment(tableObject._time).utc().format("YYYY-MM-DD HH:mm:ss")); 
                },
                error: (error) => {
                    console.error("\nError", error);
                    reject(error); // reject คำขอเมื่อเกิดข้อผิดพลาด
                },
                complete: () => {
                    console.log("Temperatures from InfluxDB:", temps); 
                    console.log("Timestamps from InfluxDB:", timestamps); 
                    resolve({ temperatures: temps, timestamps: timestamps }); // ประกาศ temperatures และ timestamps ก่อน resolve
                },
            });
        });

        const { temperatures, timestamps } = await temperaturesPromise; // เรียกใช้ค่าที่ resolve จาก Promise

        res.render("Pixel", { data: { temperatures, timestamps } }); 
    } catch (error) {
        console.error("Error", error);
        res.render("Pixel", { data: { temperatures: [], timestamps: [] } }); 
    } 
};

module.exports = controller;
