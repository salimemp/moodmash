#!/bin/bash

echo "========================================"
echo "MoodMash Comprehensive API Tests"
echo "========================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo "Testing: $name"
    status=$(curl -s -w "%{http_code}" -o /dev/null "$url")
    
    if [ "$status" = "$expected_status" ]; then
        echo "✅ PASS - $name (Status: $status)"
        ((PASS_COUNT++))
    else
        echo "❌ FAIL - $name (Expected: $expected_status, Got: $status)"
        ((FAIL_COUNT++))
    fi
    echo ""
}

test_json_response() {
    local name="$1"
    local url="$2"
    local expected_key="$3"
    
    echo "Testing: $name"
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "\"$expected_key\""; then
        echo "✅ PASS - $name (Found key: $expected_key)"
        echo "   Response preview: $(echo "$response" | head -c 200)..."
        ((PASS_COUNT++))
    else
        echo "❌ FAIL - $name (Missing key: $expected_key)"
        echo "   Response: $response"
        ((FAIL_COUNT++))
    fi
    echo ""
}

# Health & Monitoring Tests
echo "=== Health & Monitoring ==="
test_json_response "Health Check" "http://localhost:3000/api/health" "status"
test_json_response "Monitoring Enabled" "http://localhost:3000/api/health" "monitoring"
test_json_response "Database Connected" "http://localhost:3000/api/health" "database"

# Public Endpoints
echo "=== Public Endpoints ==="
test_endpoint "Homepage" "http://localhost:3000/" "200"
test_endpoint "Login Page" "http://localhost:3000/login" "200"
test_endpoint "Manifest" "http://localhost:3000/manifest.json" "200"
test_endpoint "Service Worker" "http://localhost:3000/sw.js" "200"

# Protected API Endpoints (should return 401 when not authenticated)
echo "=== Protected API Endpoints ==="
test_endpoint "Get Moods (Protected)" "http://localhost:3000/api/moods" "401"
test_endpoint "Get Activities (Protected)" "http://localhost:3000/api/activities" "401"
test_endpoint "Get Stats (Protected)" "http://localhost:3000/api/stats" "401"
test_endpoint "Get Insights (Protected)" "http://localhost:3000/api/insights" "401"
test_endpoint "Get Challenges (Protected)" "http://localhost:3000/api/challenges" "401"
test_endpoint "Get Achievements (Protected)" "http://localhost:3000/api/achievements" "401"

# OAuth Endpoints
echo "=== OAuth Endpoints ==="
test_endpoint "Google OAuth Init" "http://localhost:3000/auth/google" "302"
test_endpoint "GitHub OAuth Init" "http://localhost:3000/auth/github" "302"

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "⚠️  Warnings: $WARN_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed"
    exit 1
fi
