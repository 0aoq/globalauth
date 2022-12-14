/**
 * @file Handle GlobalAuth server
 * @name index.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import config from "../config.json";
import { log } from "./helpers";

import getUserData from "./endpoints/getdata.js";
import createUser from "./endpoints/create.js";
import userTokens from "./endpoints/tokens.js";
import updateUser from "./endpoints/update.js";
import userDevices from "./endpoints/devices";
import loginUser from "./endpoints/login.js";

import crypto from "node:crypto";
import fs from "node:fs";

// create directories (if they don't exist)
if (!fs.existsSync("data")) fs.mkdirSync("data");
if (!fs.existsSync("data/users")) fs.mkdirSync("data/users");

// default headers (will be included in every response)
export const defaultHeaders = {
    Via: "1.1 OXVSAPI (oxvs.net), 1.1 Bun (bun.sh)",
    Server: "OXVSAPI",
    "Cache-Control": "max-age=86400, public",
    "Strict-Transport-Security": "max-age=63072000",
    "X-Using": "OXVSAPI Library 0.2",
    "X-Frame-Options": "SAMEORIGIN",
    "Content-Security-Policy": "default-src 'self' *;",
    "Access-Control-Allow-Origin": "*",
    "Set-Cookie": `ga-record=${crypto.randomBytes(12).toString("base64")}; SameSite=Lax; HttpOnly; Secure`
};

// types
export type UserProfile = {
    username: string;
    password: string;
    uuid: string;
    profileData: {};
    tokens: [string]; // the user should probably start with a token, right?
    devices: Device[];
};

export type Device = {
    name: string;
    token: string;
};

// global rate limit
export let globalRateLimit = {
    limit: 1000, // max per interval
    total: 0, // this interval
    interval: 1000, // ms
};

setInterval(() => {
    globalRateLimit.total = 0;
}, globalRateLimit.interval);

// bun http server
export default {
    port: config.port || 8080,
    fetch(request: Request) {
        globalRateLimit.total++;

        if (globalRateLimit.total > globalRateLimit.limit) {
            return new Response(
                `Too many requests! ${globalRateLimit.total}/${globalRateLimit.limit} requests used. Please wait ${globalRateLimit.interval}ms!`,
                {
                    status: 418,
                    headers: defaultHeaders,
                }
            );
        }

        // get url
        const url = new URL(request.url);

        // handle endpoints
        switch (url.pathname) {
            case "/api/v1/users/create":
                return createUser(request);

            case "/api/v1/users/login":
                return loginUser(request);

            case "/api/v1/users/@me/tokens":
                return userTokens(request);

            case "/api/v1/users/@me/devices":
                return userDevices(request);

            case "/api/v1/users/@me/update":
                return updateUser(request);

            case "/api/v1/users/@me":
                return getUserData("@me", request);

            case "/api/v1/users/":
                return getUserData(undefined, request);

            default:
                log(
                    "\u{274C}",
                    `HTTP request failed with status 404! Path: ${url.pathname}`
                );

                return new Response(`We couldn't find that. (${url.href})`, {
                    status: 404,
                    headers: {
                        "content-type": "text/plain",
                        ...defaultHeaders,
                    },
                });
        }
    },
};
