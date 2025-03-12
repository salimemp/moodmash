#!/bin/bash
# Comprehensive API Testing Suite

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   MoodMash API Testing Suite        ${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if server is running
echo -e "\n${GREEN}Checking if development server is running...${NC}"
curl -s http://localhost:3000/api/health > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Server is not running. Please start the development server first.${NC}"
  echo -e "${GREEN}You can start the server with: npm run dev${NC}"
  exit 1
fi
echo -e "${GREEN}Server is running!${NC}"

# Set environment variables for testing
export NODE_ENV=test
export DATABASE_URL="file:./test.db"
export REDIS_URL="redis://localhost:6379"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="test-secret-do-not-use-in-production"
export ENCRYPTION_KEY="test-key-32-chars-do-not-use-prod"
export SMTP_HOST="localhost"
export SMTP_PORT="1025"
export SMTP_USER="test"
export SMTP_PASSWORD="test"
export SMTP_FROM="test@example.com"
export OPENAI_API_KEY="sk-test"
export NEXT_PUBLIC_POSTHOG_KEY="phc_test"
export NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
export NEXT_PUBLIC_ENABLE_ANALYTICS="false"
export NEXT_PUBLIC_SENTRY_DSN=""
export NEXT_PUBLIC_ENVIRONMENT="test"

# Run the API tests
echo "Running API tests..."
npx vitest run --config=vitest.config.ts src/__tests__/api/**/*.test.ts

# Return the exit code from the test command
exit $?

# Step 2: Run manual API tests with curl
echo -e "\n${GREEN}Running Manual API Tests...${NC}"

# The test-api.sh script should be called here
# Check if it exists first
if [ -f "./scripts/test-api.sh" ]; then
  echo -e "${GREEN}Running API endpoint tests...${NC}"
  bash ./scripts/test-api.sh
else
  echo -e "${RED}test-api.sh script not found. Skipping manual API tests.${NC}"
fi

# Final summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}   Testing Completed                 ${NC}"
echo -e "${BLUE}======================================${NC}"

if [ $? -ne 0 ]; then
  echo -e "${RED}Some tests failed. Please fix the issues before deploying.${NC}"
  exit $?
else
  echo -e "${GREEN}All automated tests passed!${NC}"
fi

# Add a helpful message about how to update the session token
echo -e "\n${BLUE}Note:${NC} To update the session token for manual tests:"
echo -e "1. Sign in to the application in your browser"
echo -e "2. Open browser developer tools (F12)"
echo -e "3. Go to Application > Cookies > http://localhost:3000"
echo -e "4. Copy the value of the 'next-auth.session-token' cookie"
echo -e "5. Update the AUTH_COOKIE variable in scripts/test-api.sh"

exit $? 