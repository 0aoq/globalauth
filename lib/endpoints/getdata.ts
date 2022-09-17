/**
 * @file Handle the /api/v1/users/getdata endpoint
 * @name getdata.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import fs from "node:fs";

import { defaultHeaders, UserProfile } from "..";
import { log } from "../helpers.js";

/**
 * @function getdata.default
 * @description Handle the user getdata endpoint
 */
export default async (request: Request) => {
    // handle OPTIONS
    if (request.method === "OPTIONS")
        return new Response(null, {
            status: 200,
            headers: {
                "Access-Control-Allow-Methods": "PUT",
                ...defaultHeaders,
            },
        });

    // make sure method is correct
    if (request.method !== "PUT")
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
    const {
        username /* required */,
        activeToken /* required */,
    } = (await request.json()) as any;

    // validate inputs
    if (!activeToken || !username)
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

    // validate token
    if (!profile.tokens.includes(activeToken))
        return new Response(
            JSON.stringify({
                s: "failed",
                d: {
                    message: "Initial token is invalid.",
                },
            }),
            {
                status: 401,
                headers: {
                    "content-type": "application/json",
                    ...defaultHeaders,
                },
            }
        );

    // handle methods
    switch (request.method) {
        case "PUT":
            // respond
            return new Response(
                JSON.stringify({
                    s: "succeeded",
                    d: {
                        profileData: profile.profileData,
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

        default:
            break;
    }
};
