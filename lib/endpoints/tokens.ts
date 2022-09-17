/**
 * @file Handle the /api/v1/users/tokens endpoint
 * @name tokens.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import crypto from "node:crypto";
import fs from "node:fs";

import { defaultHeaders, UserProfile } from "..";
import { log } from "../helpers.js";

/**
 * @function tokens.default
 * @description Handle the tokens endpoint
 */
export default async (request: Request) => {
    // handle OPTIONS
    if (request.method === "OPTIONS")
        return new Response(null, {
            status: 200,
            headers: {
                "Access-Control-Allow-Methods": "POST,DELETE,PUT",
                ...defaultHeaders,
            },
        });

    // make sure method is correct
    if (
        request.method !== "POST" &&
        request.method !== "DELETE" &&
        request.method !== "PUT"
    )
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
        tokenToValidate /* required for PUT */,
    } = await ((await request.json()) as any);

    // validate inputs
    if (!username || !activeToken)
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

    // make sure user exists
    if (!fs.existsSync(`data/users/user-${username}.json`))
        return new Response(
            JSON.stringify({
                s: "failed",
                d: {
                    message: "User does not exist!",
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

    // handle different methods
    switch (request.method) {
        case "PUT":
            // validate the given token
            // using PUT because GET doesn't support body

            // validate inputs
            if (!tokenToValidate)
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

            // check if token is included in profile
            const put_tokenIsValid = profile.tokens.includes(tokenToValidate);

            // respond
            return new Response(
                JSON.stringify({
                    s: "succeeded",
                    d: {
                        valid: put_tokenIsValid,
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

        case "POST":
            // create new token
            const post_newToken = crypto.randomBytes(12).toString("hex");

            profile.tokens.push(post_newToken);

            // push profile
            fs.writeFileSync(
                `data/users/user-${username}.json`,
                JSON.stringify(profile)
            );

            // respond
            return new Response(
                JSON.stringify({
                    s: "succeeded",
                    d: {
                        token: post_newToken,
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

            // make sure tokenToDelete exists
            if (!profile.tokens.includes(tokenToDelete))
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

            // remove token
            profile.tokens.splice(profile.tokens.indexOf(tokenToDelete), 1);

            // push profile
            fs.writeFileSync(
                `data/users/user-${username}.json`,
                JSON.stringify(profile)
            );

            // respond
            log(
                "\u{1F510}",
                `User revoked token! Username: ${username}, Token: ${tokenToDelete}`
            );
            return new Response(
                JSON.stringify({
                    s: "succeeded",
                    d: {
                        message: "Token revoked.",
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
