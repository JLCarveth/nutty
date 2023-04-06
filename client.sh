#!/bin/bash

# Read environment variables
UUID=${UUID}
TOKEN=${TOKEN}
API_URL=${API_URL}
RECIPIENT=${RECIPIENT}

# Read piped input
TEXT=$(cat)

# Encrypt text with gpg
ENCRYPTED_TEXT=$(echo "${TEXT}" | gpg --encrypt --armor --recipient "${RECIPIENT}")

# Send POST request with curl
curl -X POST -H "X-Access-Token: ${TOKEN}" -d "${ENCRYPTED_TEXT}" "${API_URL}/paste"
