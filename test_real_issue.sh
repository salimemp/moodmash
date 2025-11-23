#!/bin/bash

echo "Testing actual page rendering..."
echo ""

# Get the login page HTML
html=$(curl -s https://moodmash.win/login)

echo "=== LOGIN PAGE HTML CONTENT ==="
echo "$html" | grep -o "auth_[a-z_]*" | head -20

if [ -z "$(echo "$html" | grep -o "auth_[a-z_]*")" ]; then
    echo "✅ No raw translation keys in HTML"
else
    echo "❌ Found raw translation keys in HTML!"
fi

echo ""
echo "=== CHECKING IF CONTAINER IS EMPTY ==="
echo "$html" | grep -A 2 'id="auth-container"'

