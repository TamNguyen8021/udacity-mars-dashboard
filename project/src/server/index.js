require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, "../public")));

app.get("/rovers/:name", async (request, response) => {
	try {
		const {name} = request.params;
		const {sol = 1000} = request.query;
		const apiResponse = await fetch(
			`https://api.nasa.gov/mars-photos/api/v1/rovers/${name}/photos?sol=${sol}&api_key=${process.env.API_KEY}`
		);
		const data = await apiResponse.json();

		response.send(data);
	} catch (error) {
		console.error("error:", error);
	}
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
