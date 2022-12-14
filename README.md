# globalauth

Easy to use and secure authentication server. Users do not have to give their email, only create a username and password.

Written for use with [bun](https://bun.sh)!

## Endpoints

### Login/Create Endpoints

#### **POST** `/api/v1/users/create`

Create a new user.

```ts
{
    "username": string;
    "uuid": string;
    "token": string;
}
```

#### **POST** `/api/v1/users/login`

Login to an existing account.

```ts
{
    "username": string;
    "token": string;
}
```

### Tokens Endpoints

#### **POST** `/api/v1/users/@me/tokens`

Create a new token for the specified account.

```ts
{
    "username": string;
    "activeToken": string;
}
```

#### **PUT** `/api/v1/users/@me/tokens`

Validate an existing token for the specified account.

```ts
{
    "username": string;
    "activeToken": string;
    "tokenToValidate": string;
}
```

#### **DELETE** `/api/v1/users/@me/tokens`

Delete an existing token for the specified account.

```ts
{
    "username": string;
    "activeToken": string;
    "tokenToDelete": string;
}
```

### Profile Data Endpoints

#### **PUT** `/api/v1/users/@me`

Get the profile data from the specified account.

```ts
{
    "username": string;
    "activeToken": string;
}
```

#### **PUT** `/api/v1/users/@me/update`

Add profile data to the specified account.

```ts
{
    "username": string;
    "activeToken": string;
    "data": {
        [key: string]: string;
    }
}
```

#### **DELETE** `/api/v1/users/@me/update`

Delete profile data from the specified account.

```ts
{
    "username": string;
    "activeToken": string;
    "data": string[];
}
```

### Device Endpoints

#### **PUT** `/api/v1/users/@me/devices`

Return a list of all registered devices for the specified user.

```ts
{
    "username": string;
    "activeToken": string;
}
```

#### **DELETE** `/api/v1/users/@me/devices`

Delete a device by token for the specified user.

```ts
{
    "username": string;
    "activeToken": string;
    "tokenToDelete": string;
}
```

## Endpoint Returns

All endpoints will return JSON similar to the type example below.

```ts
{
    "s": "succeeded" | "failed",
    "d": {
        [key: string]: any
    }
}
```

For example, a successful user creation event might look similar to this:

**Request:** POST /api/v1/users/create
```json
{
    "username": "example",
    "password": "example"
}
```

**Response:**
```json
{
    "s": "succeeded",
    "d": {
        "username": "example",
        "uuid": "795a5ed5-2906-4508-ba75-3e003599e97d",
        "token": "2cb89f99439fa3ec16f15304"
    }
}
```

But a failed user creation event that didn't pass the `password` field might look similar to this:

**Request:** POST /api/v1/users/create
```json
{
    "username": "example"
}
```

**Response:**
```json
{
    "s": "failed",
    "d": {
        "message": "Missing required body fields."
    }
}
```

## Development

- Server:
    - Clone the repository
    - Run `cd globalauth`
    - Make sure you have [bun](https://bun.sh) installed
    - Run `bun install`
    - Start server with `bun run dev`
- Client:
    - Clone the repository
    - Run `cd globalauth/client`
    - Run `npm i`
    - Watch with `npm run watch` and `npm run watch:vite`