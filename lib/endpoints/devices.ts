/**
 * @file Handle the /api/v1/users/devices endpoint
 * @name devices.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import fs from "node:fs";

import { defaultHeaders, UserProfile } from "..";
import { log } from "../helpers.js";

/**
 * @function devices.default
 * @description Handle the user devices endpoint
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
        tokenToDelete /* required for DELETE */,
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
            // using PUT for this endpoint because GET doesn't support body...
            // return list of devices
            return new Response(
                JSON.stringify({
                    s: "succeeded",
                    d: {
                        devices: profile.devices,
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
            // validate inputs
            if (!tokenToDelete)
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

            // remove a specific device from the list (by token)
            const delete_device = profile.devices.find((x) => {
                return x.token === activeToken;
            });

            if (!delete_device)
                return new Response(
                    JSON.stringify({
                        s: "failed",
                        d: {
                            message: "Device does not exist.",
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

            profile.devices.splice(profile.devices.indexOf(delete_device), 1);

            // push profile
            fs.writeFileSync(
                `data/users/user-${username}.json`,
                JSON.stringify(profile)
            );

            // respond
            log("\u{1F4BB}", `Deleted user device from storage! Username: ${username}`);
            return new Response(
                JSON.stringify({
                    s: "succeeded",
                    d: {
                        devices: profile.devices,
                        removed: delete_device,
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
