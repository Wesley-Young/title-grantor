# title-grantor

A cold QQ bot that grants special titles.

## Environment

- Node.js (>= 20)
- A running OneBot implementation which supports `set_group_special_title` (e.g. Lagrange.OneBot, OpenShamrock)

## Deployment

First download the `index.js` file.

Create a `.env` file at the same directory as `index.js`, and add such lines:
```properties
WS_URL=
GROUP_NUMBER=
```
`WS_URL`: The (Forward, Active, '正向') WebSocket URL of your OneBot service. (may need access token in query, e.g. `ws://...?token=...`)

`GROUP_NUMBER`: The number(s) of group(s) where the bot is supposed to be enabled. To specify multiple groups, please split numbers with comma(s), for example `12345,67890`.

### Debug Mode

If you want to debug this application, add another line to `.env`:
```properties
DEBUG_MODE=1
```

In debug mode, the bot will be more "noisy" and send messages containing debug information. Do not enable this in production environment!

### Start

You should check whether your OneBot service is running. If it is running, execute
```shell
node --env-file=.env ./index.js
```

and the application will start to work.