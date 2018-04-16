import * as express from "express";

import { getConfig } from "./config";
import { getRegisterJWT, getSpendJWT, getOffers, signArbitraryPayload } from "./services";
import {
	notFoundHandler,
	generalErrorHandler,
	init as initCustomMiddleware, } from "./middleware";

const config = getConfig();

function createApp(): express.Express {
	const app = express();
	app.set("port", config.port);

	const bodyParser = require("body-parser");
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	initCustomMiddleware(app);

	return app;
}

export const app = createApp();

app.get("/offers", getOffers);
app.get("/spend", getSpendJWT);
app.get("/register", getRegisterJWT);
app.post("/sign", signArbitraryPayload);

// catch 404
app.use(notFoundHandler);
// catch errors
app.use(generalErrorHandler);
