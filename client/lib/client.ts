/**
 * @file Handle the GlobalAuth JS client SDK
 * @name client.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

/**
 * @type GlobalAuthProps
 */
export type GlobalAuthProps = {
    host: string /* origin of the instance (ex: https://example.com) */;
    username?: string;
    token?: string;
};

/**
 * @type LoginCreateReturn
 */
export type LoginCreateReturn = {
    s: "succeeded" | "failed";
    d: {
        username: string;
        token: string;
        message?: string /* if error */;
    };
};

/**
 * @type UpdateReturn
 */
export type UpdateReturn = {
    s: "succeeded" | "failed";
    d: {
        profileData: { [key: string]: any };
        message?: string /* if error */;
    };
};

/**
 * @type DevicesReturn
 */
export type DevicesReturn = {
    s: "succeeded" | "failed";
    d: {
        devices: any[];
        removed?: { name: string; token: string } /* only on DELETE */;
        message?: string /* if error */;
    };
};

/**
 * @type DefaultReturn
 */
export type DefaultReturn = {
    s: "succeeded" | "failed";
    d: {
        message: string;
    };
};

/**
 * @class GlobalAuth
 */
export class GlobalAuth {
    props: GlobalAuthProps;
    isAuthenticated: boolean = false;

    // constructor
    constructor(props: GlobalAuthProps) {
        this.props = props;

        // if credentials are saved, add them to this.props
        if (
            window.localStorage.getItem("ga_credentials") &&
            JSON.parse(window.localStorage.getItem("ga_credentials") as string)
        ) {
            const credentials = JSON.parse(
                window.localStorage.getItem("ga_credentials") as string
            );

            this.props = {
                ...credentials,
                ...this.props,
            };

            this.isAuthenticated = true;
        }
    }

    // store credentials
    private storeCredentials(props: { username: string; token: string }) {
        window.localStorage.setItem("ga_credentials", JSON.stringify(props));
    }

    // /users/create endpoint
    public signup(props: { username: string; password: string }) {
        return new Promise(async (resolve, reject) => {
            // send request
            const res = (await (
                await fetch(`${this.props.host}/api/v1/users/create`, {
                    method: "POST",
                    body: JSON.stringify(props),
                })
            ).json()) as LoginCreateReturn;

            // resolve/reject based on res.s
            switch (res.s) {
                case "failed":
                    reject(res.d);
                    break;

                default:
                    // store credentials
                    this.storeCredentials({
                        username: props.username,
                        token: res.d.token,
                    });

                    // resolve
                    resolve(res.d);
                    break;
            }
        });
    }

    // /users/login endpoint
    public login(props: { username: string; password: string }) {
        return new Promise(async (resolve, reject) => {
            // send request
            const res = (await (
                await fetch(`${this.props.host}/api/v1/users/login`, {
                    method: "POST",
                    body: JSON.stringify(props),
                })
            ).json()) as LoginCreateReturn;

            // resolve/reject based on res.s
            switch (res.s) {
                case "failed":
                    reject(res.d);
                    break;

                default:
                    // store credentials
                    this.storeCredentials({
                        username: props.username,
                        token: res.d.token,
                    });

                    // resolve
                    resolve(res.d);
                    break;
            }
        });
    }

    // logout
    public logout() {
        if (!this.props.token) return; // must be in an account
        window.localStorage.removeItem("ga_credentials");
        return this.devices({
            type: "remove",
            tokenToDelete: this.props.token,
        });
    }

    // /users/@me/update endpoint
    public updateProfile(props: {
        type: "add" | "remove";
        data: { [key: string]: any } | string[];
    }) {
        if (!this.props.token) return; // must be in an account
        return new Promise(async (resolve, reject) => {
            // send request
            const res = (await (
                await fetch(`${this.props.host}/api/v1/users/@me/update`, {
                    method: props.type === "add" ? "PUT" : "DELETE",
                    body: JSON.stringify({
                        username: this.props.username,
                        activeToken: this.props.token,
                        data: props.data
                    }),
                })
            ).json()) as UpdateReturn;

            // resolve/reject based on res.s
            switch (res.s) {
                case "failed":
                    reject(res.d);
                    break;

                default:
                    resolve(res.d);
                    break;
            }
        });
    }

    // /users/@me/ endpoint
    public getProfile() {
        if (!this.props.token) return; // must be in an account
        return new Promise(async (resolve, reject) => {
            // send request
            const res = (await (
                await fetch(`${this.props.host}/api/v1/users/@me`, {
                    method: "PUT",
                    body: JSON.stringify({
                        username: this.props.username,
                        activeToken: this.props.token,
                    }),
                })
            ).json()) as DefaultReturn;

            // resolve/reject based on res.s
            switch (res.s) {
                case "failed":
                    reject(res.d);
                    break;

                default:
                    resolve(res.d);
                    break;
            }
        });
    }

    // /users/@me/devices endpoint
    public devices(props: {
        type: "get" | "remove";
        tokenToDelete?: string /* required only for remove */;
    }) {
        if (!this.props.token) return; // must be in an account
        return new Promise(async (resolve, reject) => {
            // send request
            const res = (await (
                await fetch(`${this.props.host}/api/v1/users/@me/devices`, {
                    method: props.type === "get" ? "PUT" : "DELETE",
                    body: JSON.stringify({
                        username: this.props.username,
                        activeToken: this.props.token,
                        tokenToDelete: props.tokenToDelete
                    }),
                })
            ).json()) as DevicesReturn;

            // resolve/reject based on res.s
            switch (res.s) {
                case "failed":
                    reject(res.d);
                    break;

                default:
                    resolve(res.d);
                    break;
            }
        });
    }
}

// default export
export default GlobalAuth;
