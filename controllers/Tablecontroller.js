const controller = {};
const { validationResult } = require('express-validator');

const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const token = "_IHzr59QZ80M3sY4sNsQmkUBdAZPvgxjk5TRRIvPQMkhFCb6dUSY6jpeIFxtf9eKWF7pDSAwH5k3QtMzvzhzdg=="
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com'
const client = new InfluxDB({ url, token })
const org = '60ea2d775f2de60f'
const bucket = 'MINIPROJECT'

controller.Table = async (req, res) => {
    let data = [];
    try {
        const queryClient = client.getQueryApi(org);
        
        const fluxQuery = `from(bucket: "MINIPROJECT")
        |> range(start: -1d)
        |> filter(fn: (r) => r["device"] == "bc:dd:c2:53:8:61")
        |> filter(fn: (r) => r._measurement == "temperatures" and r["_field"] =~ /^Temp/)`;

        await new Promise((resolve, reject) => {
            queryClient.queryRows(fluxQuery, {
                next: (row, tableMeta) => {
                    const tableObject = tableMeta.toObject(row);
                    tableObject.time = new Date(tableObject._time).toLocaleString(); 
                    data.push(tableObject); 
                },
                error: (error) => {
                    console.error("\nError", error);
                    reject(error);
                },
                complete: async () => {
                    data.sort((a, b) => {
                        const indexA = parseInt(a._field.replace('Temp', ''));
                        const indexB = parseInt(b._field.replace('Temp', ''));
                        return indexA - indexB;
                    });
                    res.render("Table", { data }); // ส่งข้อมูลทั้งหมดไปที่หน้า view Table
                },
            });
        });
    } catch (error) {
        console.error("Error", error);
        res.render("Table", { data }); // ส่งข้อมูลทั้งหมดไปที่หน้า view Table
    } 
};

module.exports = controller;
