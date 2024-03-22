const controller = {};
const { validationResult } = require('express-validator');

const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const token = "_IHzr59QZ80M3sY4sNsQmkUBdAZPvgxjk5TRRIvPQMkhFCb6dUSY6jpeIFxtf9eKWF7pDSAwH5k3QtMzvzhzdg==";
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const client = new InfluxDB({ url, token });
const org = '60ea2d775f2de60f';
const bucket = 'MINIPROJECT';

let previousMax = null;
let previousMin = null;

async function updateTemperature() {
    let max = null;
    let min = null;

    try {
        const queryClient = client.getQueryApi(org);

        const fluxQuery = `from(bucket: "MINIPROJECT")
        |> range(start: -10m)
        |> filter(fn: (r) => r["device"] == "bc:dd:c2:53:8:61")
        |> filter(fn: (r) => r._measurement == "temperatures" and (r["_field"] == "max_temperature" or r["_field"] == "min_temperature"))
        |> group(columns: ["_field"])
        |> last()`;

        await new Promise((resolve, reject) => {
            queryClient.queryRows(fluxQuery, {
                next: (row, tableMeta) => {
                    const tableObject = tableMeta.toObject(row);
                    console.log(tableObject._value);
                    if (tableObject._field === "max_temperature") {
                        max = tableObject._value;
                    } else if (tableObject._field === "min_temperature") {
                        min = tableObject._value;
                    }
                },
                error: (error) => {
                    console.error("\nError", error);
                    reject(error);
                },
                complete: () => {
                    resolve();
                },
            });
        });

        if (max !== null && max !== previousMax) {
            const point = new Point(bucket).intField('max_temperature', max);

            await client.writePoint(point);
            await client.flush();
            previousMax = max;
        }
        if (min !== null && min !== previousMin) {
            const point = new Point(bucket).intField('min_temperature', min);

            await client.writePoint(point);
            await client.flush();
            previousMin = min;
        }
    } catch (error) {
        console.error("Error", error);
    }

    return { max, min };
}

controller.Temp = async (req, res) => {
    try {
        const { max, min } = await updateTemperature();

        res.render("Temp", { data: { max, min } });
    } catch (error) {
        console.error("Error", error);
        res.render("Temp", { data: { max: null, min: null } });
    }
};

module.exports = controller;
