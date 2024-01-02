#!/bin/bash
deno_path=$(which deno)

if [ -z "$deno_path" ]; then
  echo "Error: deno is not installed"
  exit 1
fi

# Set the DB_NAME environment variable
export DB_NAME="test.db"

# Start the paste service
$deno_path run -A --unstable paste.ts &
paste_pid=$(ps aux | grep "$deno_path run -A --unstable paste.ts" | grep -v grep | awk '{print $2}')

# Run tests
$deno_path test -A --unstable

# Cleanup testing environment
kill $paste_pid
rm test.db

