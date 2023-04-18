# Nutty
#### A simple HTTP paste server

Nutty is a self-hostable paste server, allowing you to easily upload and share text files instantly.

## Features
- A simple HTTP interface
- Public and private pastes
- Low memory footprint

## Installation

1. Make sure you have Deno installed on your system. If not, you can install it by following the instructions on the [Deno website](https://deno.land/#installation).
2. Clone the repository by running `git clone https://github.com/JLCarveth/nutty.git`.
3. Change into the cloned directory by running `cd nutty`.
4. Run the `paste.ts` file with Deno by running `deno run -A --unstable paste.ts`.

A simple systemd service can also be setup to handle stopping/starting Nutty:
```Systemd
[Unit]
Description=File pasting API

[Service]
ExecStart=/home/jlcarveth/.deno/bin/deno run -A --unstable paste.ts
Restart=always
User=jlcarveth
Group=jlcarveth
WorkingDirectory=/opt/paste
EnvironmentFile=/opt/paste/.env
StandardOutput=/var/log/paste/out.log
StandardError=/var/log/paste/error.log

[Install]
WantedBy=multi-user.target
```
### Environment
Nutty depends on a couple of environment variables to be established before running.
|Variable Name|Description|Example Values|
|---|---|---|
|`TARGET_DIR`|The directory where pastes will be stored.|`/opt/paste/data`|
|`BASE_URL`|The base URL at which the API can be accessed.|`https://paste.mysite.com/api`|
|`SECRET_KEY`|Used for signing JWTs. A secret key can be generated with `openssl rand -base64 32`|`GDZ1FzBF18dtAk2enanqqxskVf5hptmPjy/pcBm384M=`|
|`PORT`|The port to listen to. Default is 5335|`5335`|

## Usage

