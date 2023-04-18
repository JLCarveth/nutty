#!/bin/bash

# Read environment variables
EMAIL=${EMAIL}
TOKEN=${TOKEN}
API_URL=${API_URL}
RECIPIENT=${RECIPIENT}

# Read piped input
TEXT=$(cat)

# Encrypt text with gpg
ENCRYPTED_TEXT=$(echo "${TEXT}" | gpg --encrypt --armor --recipient "${EMAIL}")

# Send POST request with curl
UUID=$(curl -X POST -H "X-Access-Token: ${TOKEN}" -d "${ENCRYPTED_TEXT}" "${API_URL}/paste")
echo $UUID
