/**
 * @file Handle the /api/v1/users/update endpoint
 * @name update.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import fs from "node:fs";

import { defaultHeaders, UserProfile } from "..";
import { log } from "../helpers.js";

/**
 * @function update.default
 * @description Handle the user update endpoint
 */
export default async (request: Request) => {
    // make sure method is correct
    if (request.method !== "PUT" && request.method !== "DELETE")
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
        data /* required */,
    } = (await request.json()) as any;

    // validate inputs
    if (!activeToken || !username || !data || typeof data !== "object")
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
            // add each key/value pair from data to profile.profileData
            for (let pair of Object.entries(data)) {
                profile.profileData[pair[0]] = pair[1];
            }

            // push profile
            fs.writeFileSync(
                `data/users/user-${username}.json`,
                JSON.stringify(profile)
            );

            // respond
            log(
                "\u{1F4DD}",
                `Updated user profile! Username: ${username}, Entries: ${
                    Object.entries(data).length
                } added`
            );

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

        case "DELETE":
            // make sure data is an array
            if (!Array.isArray(data))
                return new Response(
                    JSON.stringify({
                        s: "failed",
                        d: {
                            message: "DELETE event expects an array for data!",
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

            // remove specified values from profile.profileData
            for (let key of data) {
                if (profile.profileData[key]) delete profile.profileData[key];
            }

            // push profile
            fs.writeFileSync(
                `data/users/user-${username}.json`,
                JSON.stringify(profile)
            );

            // respond
            log(
                "\u{1F4DD}",
                `Updated user profile! Username: ${username}, Removed: ${data.length} entries`
            );

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
