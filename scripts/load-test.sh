#!/bin/bash
# Load testing script for the API

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   MoodMash API Load Testing         ${NC}"
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

# Check if artillery is installed
if ! command -v artillery &> /dev/null; then
  echo -e "${YELLOW}Artillery is not installed globally. Using npx instead.${NC}"
  ARTILLERY_CMD="npx artillery"
else
  ARTILLERY_CMD="artillery"
fi

# Check if session token is provided
AUTH_TOKEN=${1:-""}
if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${YELLOW}No authentication token provided. Tests requiring authentication may fail.${NC}"
  echo -e "${YELLOW}To provide a token, run: ./scripts/load-test.sh YOUR_SESSION_TOKEN${NC}"
else
  # Create a temporary config file with the provided token
  echo -e "${GREEN}Using provided authentication token for tests.${NC}"
  cp load-tests/config.yml load-tests/config-temp.yml
  sed -i "s/REPLACE_WITH_ACTUAL_SESSION_TOKEN/$AUTH_TOKEN/g" load-tests/config-temp.yml
  CONFIG_FILE="load-tests/config-temp.yml"
else
  CONFIG_FILE="load-tests/config.yml"
fi

# Create reports directory if it doesn't exist
mkdir -p reports

# Run quick test first
echo -e "\n${GREEN}Running quick test (10 seconds)...${NC}"
$ARTILLERY_CMD quick --count 10 -n 20 http://localhost:3000/api/health

# Ask if want to continue with full test
echo -e "\n${YELLOW}Do you want to run the full load test suite? This will take about 5 minutes. (y/n)${NC}"
read answer
if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
  echo -e "${BLUE}Skipping full load test.${NC}"
  
  # Clean up temp file if it exists
  if [ -f "load-tests/config-temp.yml" ]; then
    rm load-tests/config-temp.yml
  fi
  
  exit 0
fi

# Run full load test
timestamp=$(date +"%Y%m%d_%H%M%S")
report_file="reports/load_test_report_$timestamp.json"
html_report="reports/load_test_report_$timestamp.html"

echo -e "\n${GREEN}Running full load test...${NC}"
echo -e "${BLUE}This will take approximately 5 minutes.${NC}"
echo -e "${BLUE}Report will be saved to: $html_report${NC}"

$ARTILLERY_CMD run --output $report_file $CONFIG_FILE
$ARTILLERY_CMD report $report_file --output $html_report

echo -e "\n${GREEN}Load test completed!${NC}"
echo -e "${BLUE}HTML report has been generated at: $html_report${NC}"

# Clean up temp file if it exists
if [ -f "load-tests/config-temp.yml" ]; then
  rm load-tests/config-temp.yml
fi

echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}   Load Testing Completed            ${NC}"
echo -e "${BLUE}======================================${NC}" 