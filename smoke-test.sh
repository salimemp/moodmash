#!/bin/bash

echo "========================================"
echo "MoodMash Application Smoke Tests"
echo "========================================"
echo ""

# Test 1: Health endpoint
echo "Test 1: Health Endpoint"
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/health)
status=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "200" ]; then
    echo "✅ PASS - Health endpoint returned 200"
    echo "   Response: $body"
else
    echo "❌ FAIL - Health endpoint returned $status"
    exit 1
fi
echo ""

# Test 2: Homepage loads
echo "Test 2: Homepage Loads"
status=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/)
if [ "$status" = "200" ]; then
    echo "✅ PASS - Homepage loaded successfully"
else
    echo "❌ FAIL - Homepage returned $status"
    exit 1
fi
echo ""

# Test 3: Static assets load
echo "Test 3: Static Assets Load"
status=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/manifest.json)
if [ "$status" = "200" ]; then
    echo "✅ PASS - Manifest loads"
else
    echo "⚠️  WARNING - Manifest returned $status"
fi
echo ""

# Test 4: API endpoints respond
echo "Test 4: API Activities Endpoint"
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/activities)
status=$(echo "$response" | tail -1)
if [ "$status" = "200" ] || [ "$status" = "401" ]; then
    echo "✅ PASS - Activities API responds (status: $status)"
else
    echo "❌ FAIL - Activities API returned $status"
    exit 1
fi
echo ""

# Test 5: Monitoring integration
echo "Test 5: Grafana Monitoring Integration"
monitoring=$(curl -s http://localhost:3000/api/health | grep -o '"monitoring":{[^}]*}')
if echo "$monitoring" | grep -q '"enabled":true'; then
    echo "✅ PASS - Monitoring is enabled"
else
    echo "⚠️  WARNING - Monitoring might not be enabled"
fi
echo ""

echo "========================================"
echo "Smoke Tests Complete!"
echo "========================================"
