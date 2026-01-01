#!/bin/bash

echo "========================================"
echo "MoodMash Production Reality Check"
echo "========================================"
echo ""

BASE_URL="https://moodmash.win"

# Test 1: Homepage
echo "✓ Testing Homepage..."
curl -s -o /dev/null -w "Status: %{http_code} | Load time: %{time_total}s\n" "$BASE_URL/"

# Test 2: Login page
echo "✓ Testing Login page..."
curl -s -o /dev/null -w "Status: %{http_code} | Load time: %{time_total}s\n" "$BASE_URL/login"

# Test 3: Register page  
echo "✓ Testing Register page..."
curl -s -o /dev/null -w "Status: %{http_code} | Load time: %{time_total}s\n" "$BASE_URL/register"

# Test 4: AI Chat page
echo "✓ Testing AI Chat page..."
curl -s -o /dev/null -w "Status: %{http_code} | Load time: %{time_total}s\n" "$BASE_URL/ai-chat"

# Test 5: Check OAuth buttons
echo ""
echo "Checking OAuth buttons..."
OAUTH_CHECK=$(curl -s "$BASE_URL/login" | grep -c "Continue with")
if [ "$OAUTH_CHECK" -gt 0 ]; then
    echo "✅ OAuth buttons found: $OAUTH_CHECK"
else
    echo "❌ OAuth buttons NOT FOUND"
fi

# Test 6: Check AI chatbot button
echo ""
echo "Checking AI Chatbot button..."
CHATBOT_CHECK=$(curl -s "$BASE_URL/" | grep -c "ai-chat-toggle")
if [ "$CHATBOT_CHECK" -gt 0 ]; then
    echo "✅ AI chatbot button found in HTML"
else
    echo "❌ AI chatbot button NOT FOUND"
fi

# Test 7: Check accessibility button
echo ""
echo "Checking Accessibility button..."
ACCESS_CHECK=$(curl -s "$BASE_URL/" | grep -c "accessibility-toggle")
if [ "$ACCESS_CHECK" -gt 0 ]; then
    echo "✅ Accessibility button found in HTML"
else
    echo "❌ Accessibility button NOT FOUND"
fi

# Test 8: Check language selector
echo ""
echo "Checking Language Selector..."
LANG_COUNT=$(curl -s "$BASE_URL/" | grep -o "window.i18n.changeLanguage" | wc -l)
echo "Languages in selector: $LANG_COUNT"

# Test 9: Check static assets
echo ""
echo "Checking Static Assets..."
curl -s -o /dev/null -w "auth.js: %{http_code} | Size: %{size_download} bytes\n" "$BASE_URL/static/auth.js"
curl -s -o /dev/null -w "i18n.js: %{http_code} | Size: %{size_download} bytes\n" "$BASE_URL/static/i18n.js"
curl -s -o /dev/null -w "chatbot.js: %{http_code} | Size: %{size_download} bytes\n" "$BASE_URL/static/chatbot.js"
curl -s -o /dev/null -w "accessibility.js: %{http_code} | Size: %{size_download} bytes\n" "$BASE_URL/static/accessibility.js"

# Test 10: Check APIs
echo ""
echo "Checking Backend APIs..."
curl -s -o /dev/null -w "Health: %{http_code}\n" "$BASE_URL/api/health/status"
curl -s -o /dev/null -w "Auth: %{http_code}\n" "$BASE_URL/api/auth/me"

echo ""
echo "========================================"
echo "Production Status Summary"
echo "========================================"
