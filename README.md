# title-grantor

A cold QQ bot that grants special titles.

## Environment

- Node.js (>= 20)
- A running OneBot implementation which supports `set_group_special_title` (e.g. Lagrange.OneBot, OpenShamrock)

## Usage

### Scopes

Only available in groups specified in the `.env` file; only available when the bot is the owner of an enabled group; commands can only be executed by the group owner / admins.

### Commands

`/help`: View the usage of this bot.

`/grant [QQ Number] [Title]`: Grants a given user the specified title. The title should be no longer than 18 bytes. One Chinese character in UTF-8 occupies 3 bytes, so a title in Chinese should be no longer than 6 Chinese characters. 

> Do not attempt to use ASCII characters and Unicode characters together in a title longer than 18 bytes, because it will be cut off after its 18th byte, and if the 18th byte is within a Unicode character, this will cause unexpected outcome.

`/refresh-privileged-list`: Although this application actively listens to the changes of group admins, there are some chance that the bot does not receive the notice. So if the group admin list changes and some of the admins cannot execute commands, those who have the privilege should manually execute this.

## Deployment

First download the `index.js` file.

Create a `.env` file at the same directory as `index.js`, and add such lines:
```properties
WS_URL=
GROUP_NUMBER=
```
`WS_URL`: The (Forward, Active, '正向') WebSocket URL of your OneBot service. (may need access token in query, e.g. `ws://...?access_token=...`)

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