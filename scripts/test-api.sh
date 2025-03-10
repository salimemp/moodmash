#!/bin/bash
# API Testing Script

# Set your base URL
BASE_URL="http://localhost:3000/api"

# Set authentication (you'll need to extract this from your browser)
# This assumes you have a valid session cookie
AUTH_COOKIE="next-auth.session-token=REPLACE_WITH_ACTUAL_SESSION_TOKEN"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "===== API Testing Script ====="

# Test GET preferences
echo -e "\n${GREEN}Testing GET preferences${NC}"
curl -X GET "$BASE_URL/profile/preferences" \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -s | json_pp

# Test PATCH preferences (update theme)
echo -e "\n${GREEN}Testing PATCH preferences (update theme)${NC}"
curl -X PATCH "$BASE_URL/profile/preferences" \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark"}' \
  -s | json_pp

# Test PUT preferences (replace all preferences)
echo -e "\n${GREEN}Testing PUT preferences (replace all)${NC}"
curl -X PUT "$BASE_URL/profile/preferences" \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"theme":"light","emailNotifications":false,"pushNotifications":true,"weeklyDigest":false,"language":"en"}' \
  -s | json_pp

# Test invalid input
echo -e "\n${GREEN}Testing invalid input${NC}"
curl -X PATCH "$BASE_URL/profile/preferences" \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"theme":"invalid-theme"}' \
  -s | json_pp

# Test empty input
echo -e "\n${GREEN}Testing empty input${NC}"
curl -X PATCH "$BASE_URL/profile/preferences" \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -s | json_pp

echo -e "\n===== API Testing Complete =====" 