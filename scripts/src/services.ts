import * as moment from "moment";
import { readFileSync } from "fs";
import * as jsonwebtoken from "jsonwebtoken";
import { Request, Response, RequestHandler } from "express";

import { randomItem, path } from "./utils";
import { getConfig } from "./config";

class KeyMap extends Map<string, { algorithm: string; key: Buffer; }> {
	public random() {
		const entries = Array.from(this.entries()).map(([id, key]) => ({
			id,
			key: key.key,
			algorithm: key.algorithm
		}));

		return randomItem(entries);
	}
}

const CONFIG = getConfig();
const KEYS = new KeyMap();

export type RegisterRequest = Request & {
	query: {
		user_id: string;
	}
};

export const getRegisterJWT = function(req: RegisterRequest, res: Response) {
	if (req.query.user_id) {
		res.status(200).json({ jwt: sign("register", { user_id: req.query.user_id }) });
	} else {
		res.status(400).send({ error: "'user_id' query param is missing" });
	}
} as any as RequestHandler;

export type SpendRequest = Request & {
	query: {
		offer_id: string;
	}
};

export const getSpendJWT = function(req: SpendRequest, res: Response) {
	if (req.query.offer_id) {
		let offer;
		CONFIG.offers.forEach(item => {
			if (item.id === req.query.offer_id) {
				offer = item;
			}
		});

		if (offer) {
			res.status(200).json({ jwt: sign("spend", { offer } ) });
		} else {
			res.status(400).send({ error: `cannot find offer with id '${ req.query.offer_id }'` });
		}
	} else {
		res.status(400).send({ error: "'offer_id' query param is missing" });
	}
} as any as RequestHandler;

export const getOffers = function(req: Request, res: Response) {
	res.status(200).send({ offers: CONFIG.offers });
} as any as RequestHandler;

export type ArbitraryPayloadRequest = Request & {
	body: {
		subject: string;
		payload: { [key: string]: any };
	}
};

export const signArbitraryPayload = function(req: ArbitraryPayloadRequest, res: Response) {
	if (req.body.subject && req.body.payload) {
		res.status(200).json({ jwt: sign(req.body.subject, req.body.payload) });
	} else {
		res.status(400).send({ error: `missing 'subject' and/or 'payload' in request body` });
	}
} as any as RequestHandler;

function sign(subject: string, payload: any) {
	const signWith = KEYS.random();

	payload = Object.assign({
		iss: getConfig().app_id,
		exp: moment().add(6, "hours").valueOf(),
		iat: moment().valueOf(),
		sub: subject
	}, payload);

	return jsonwebtoken.sign(payload, signWith.key, {
		header: {
			kid: signWith.id,
			alg: signWith.algorithm,
			typ: "JWT"
		}
	});
}

// init
(() => {
	Object.entries(CONFIG.private_keys).forEach(([ name, key ]) => {
		KEYS.set(name, { algorithm: key.algorithm, key: readFileSync(path(key.file)) });
	});
})();
