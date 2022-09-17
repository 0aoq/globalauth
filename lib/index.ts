/**
 * @file Handle GlobalAuth server
 * @name index.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import crypto from "node:crypto";
import fs from "node:fs";

// create directories (if they don't exist)
if (!fs.existsSync("data")) fs.mkdirSync("data");
if (!fs.existsSync("data/users")) fs.mkdirSync("data/users");

// bun http server
export default {
    port: 8080,
    fetch(request: Request) {
        const defaultHeaders = {
            Via: "1.1 OXVSAPI (oxvs.net), 1.1 Bun (bun.sh)",
            Server: "OXVSAPI",
            "Cache-Control": "max-age=86400, public",
            "Strict-Transport-Security": "max-age=63072000",
            "X-Using": "OXVSAPI Library 0.2",
            "X-Frame-Options": "SAMEORIGIN",
            "Content-Security-Policy": "default-src 'self' *;",
            Record: crypto.randomBytes(12).toString("hex"),
        };

        // get url
        const url = new URL(request.url);

        // handle endpoints
        switch (url.pathname) {
            case "/api/v1/users/create":
                return (async () => {
                    // make sure method is correct
                    if (request.method !== "POST")
                        return new Response(
                            JSON.stringify({
                                s: "failed",
                                d: {
                                    message:
                                        "Incorrect HTTP method header for this endpoint.",
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
                    const { username, password } =
                        (await request.json()) as any;

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
                                status: 500,
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
                                    message:
                                        "Username is taken! Please try another.",
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
                            tokens: [initialToken],
                        })
                    );

                    // respond
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
                })();

            case "/api/v1/users/tokens":
                return (async () => {
                    // make sure method is correct
                    if (
                        request.method !== "POST" &&
                        request.method !== "DELETE"
                    )
                        return new Response(
                            JSON.stringify({
                                s: "failed",
                                d: {
                                    message:
                                        "Incorrect HTTP method header for this endpoint.",
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
                                status: 500,
                                headers: {
                                    "content-type": "application/json",
                                    ...defaultHeaders,
                                },
                            }
                        );

                    if (!fs.existsSync(`data/users/user-${username}.json`))
                        return new Response(
                            JSON.stringify({
                                s: "failed",
                                d: {
                                    message: "User does not exist!",
                                },
                            }),
                            {
                                status: 500,
                                headers: {
                                    "content-type": "application/json",
                                    ...defaultHeaders,
                                },
                            }
                        );

                    // handle different methods
                    switch (request.method) {
                        case "POST":
                            // get user data and push a new token
                            const post_uProfile = JSON.parse(
                                fs
                                    .readFileSync(
                                        `data/users/user-${username}.json`
                                    )
                                    .toString()
                            );

                            // validate token
                            if (!post_uProfile.tokens.includes(activeToken))
                                return new Response(
                                    JSON.stringify({
                                        s: "failed",
                                        d: {
                                            message:
                                                "Initial token is invalid.",
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

                            // create new token
                            const post_newToken = crypto
                                .randomBytes(12)
                                .toString("hex");

                            post_uProfile.tokens.push(post_newToken);

                            // push profile
                            fs.writeFileSync(
                                `data/users/user-${username}.json`,
                                JSON.stringify(post_uProfile)
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
                            if (!activeToken || !tokenToDelete)
                                return new Response(
                                    JSON.stringify({
                                        s: "failed",
                                        d: {
                                            message:
                                                "Missing required body fields.",
                                        },
                                    }),
                                    {
                                        status: 500,
                                        headers: {
                                            "content-type": "application/json",
                                            ...defaultHeaders,
                                        },
                                    }
                                );

                        // remove token
                        // TODO ...

                        default:
                            break;
                    }
                })();

            default:
                return new Response(`We couldn't find that. (${url.href})`, {
                    status: 400,
                    headers: {
                        "content-type": "text/plain",
                        ...defaultHeaders,
                    },
                });
        }
    },
};
