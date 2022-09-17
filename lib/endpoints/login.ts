/**
 * @file Handle the /api/v1/users/login endpoint
 * @name login.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import crypto from "node:crypto";
import fs from "node:fs";

import { defaultHeaders, UserProfile } from "..";
import { log } from "../helpers.js";

/**
 * @function login.default
 * @description Handle the user login endpoint
 */
export default async (request: Request) => {
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

    // get user profile
    const profile = JSON.parse(
        fs.readFileSync(`data/users/user-${username}.json`).toString()
    ) as UserProfile;

    // make sure passwords match
    if (
        profile.password !==
        crypto.createHash("sha256").update(password, "binary").digest("base64")
    )
        return new Response(
            JSON.stringify({
                s: "failed",
                d: {
                    message: "Password is invalid.",
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

    // generate a new token (passwords match)
    const newToken = crypto.randomBytes(12).toString("hex");

    profile.tokens.push(newToken);

    // create new device
    profile.devices.push({
        name: request.headers.get("User-Agent"),
        token: newToken,
    },)

    // push profile
    fs.writeFileSync(
        `data/users/user-${username}.json`,
        JSON.stringify(profile)
    );

    // respond
    log("\u{1F511}", `User login! Username: ${username}`);
    return new Response(
        JSON.stringify({
            s: "succeeded",
            d: {
                username,
                token: newToken,
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
