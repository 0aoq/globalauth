/**
 * @file Handle the /api/v1/users/create endpoint
 * @name create.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import crypto from "node:crypto";
import fs from "node:fs";

import { defaultHeaders } from "..";
import { log } from "../helpers.js";

/**
 * @function create.default
 * @description Handle the user create endpoint
 */
export default async (request: Request) => {
    // handle OPTIONS
    if (request.method === "OPTIONS")
        return new Response(null, {
            status: 200,
            headers: {
                "Access-Control-Allow-Methods": "POST",
                ...defaultHeaders,
            },
        });

    // make sure method is correct
    if (request.method !== "POST")
        return new Response(
            JSON.stringify({
                s: "failed",
                d: {
                    message: "Incorrect HTTP method header for this endpoint.",
                },
            }),
            {
                status: 400,
                headers: {
                    "content-type": "application/json",
                    ...defaultHeaders,
                },
            }
        );

    // collect inputs
    const { username, password } = (await request.json()) as any;

    // validate inputs
    if (!password || !username)
        return new Response(
            JSON.stringify({
                s: "failed",
                d: {
                    message: "Missing required body fields.",
                },
            }),
            {
                status: 400,
                headers: {
                    "content-type": "application/json",
                    ...defaultHeaders,
                },
            }
        );

    // make sure username isn't taken
    if (fs.existsSync(`data/users/user-${username}.json`)) {
        return new Response(
            JSON.stringify({
                s: "failed",
                d: {
                    message: "Username is taken! Please try another.",
                },
            }),
            {
                status: 400,
                headers: {
                    "content-type": "application/json",
                    ...defaultHeaders,
                },
            }
        );
    }

    // generate userid and save user
    const uuid = crypto.randomUUID();
    const initialToken = crypto.randomBytes(12).toString("hex");

    fs.writeFileSync(
        `data/users/user-${username}.json`,
        JSON.stringify({
            username,
            password: crypto
                .createHash("sha256")
                .update(password, "binary")
                .digest("base64"),
            uuid,
            profileData: {
                // to be filled later... (PUT /api/v1/users/update)
            },
            tokens: [initialToken], // the user should probably start with a token, right?
            devices: [
                {
                    // starting device
                    name: request.headers.get("User-Agent"),
                    token: initialToken,
                },
            ],
        })
    );

    // respond
    log("\u{1F389}", `New user created! Username: ${username}`);
    return new Response(
        JSON.stringify({
            s: "succeeded",
            d: {
                username,
                uuid,
                token: initialToken,
            },
        }),
        {
            status: 200,
            headers: {
                "content-type": "application/json",
                ...defaultHeaders,
            },
        }
    );
};
