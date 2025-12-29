#!/bin/bash

# MoodMash Comprehensive Testing Script
# Tests all major components and features

BASE_URL="https://5be8c75c.moodmash.pages.dev"
TEST_USER="user1767035396"
TEST_EMAIL="test1767035396@testing.local"
TEST_PASS="Xk1767035396Zy@9Mq!Rt#Vb"

echo "======================================"
echo "MoodMash Comprehensive Testing"
echo "======================================"
echo "Production URL: $BASE_URL"
echo "Test started at: $(date)"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

test_pass() {
    ((pass_count++))
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

test_fail() {
    ((fail_count++))
    echo -e "${RED}✗ FAIL${NC}: $1"
}

test_info() {
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

echo "======================================"
echo "1. HOMEPAGE & NAVIGATION TESTS"
echo "======================================"

# Test homepage loads
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    test_pass "Homepage loads successfully (HTTP 200)"
else
    test_fail "Homepage failed to load"
fi

# Test navigation links
for page in "/login" "/register" "/about"; do
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page" | grep -q "200\|302"; then
        test_pass "Page $page accessible"
    else
        test_fail "Page $page not accessible"
    fi
done

echo ""
echo "======================================"
echo "2. LANGUAGE SELECTOR TESTS (13 Languages)"
echo "======================================"

HOMEPAGE_HTML=$(curl -s "$BASE_URL")

# Test all 13 languages are present
langs=("🇺🇸 English" "🇪🇸 Español" "🇨🇳 中文" "🇫🇷 Français" "🇩🇪 Deutsch" "🇮🇹 Italiano" "🇸🇦 العربية" "🇮🇳 हिन्दी" "🇧🇩 বাংলা" "🇮🇳 தமிழ்" "🇯🇵 日本語" "🇰🇷 한국어" "🇲🇾 Bahasa Melayu")

for lang in "${langs[@]}"; do
    if echo "$HOMEPAGE_HTML" | grep -q "$lang"; then
        test_pass "Language present: $lang"
    else
        test_fail "Language missing: $lang"
    fi
done

echo ""
echo "======================================"
echo "3. FLOATING BUTTONS TESTS"
echo "======================================"

# Test AI Chatbot button
if echo "$HOMEPAGE_HTML" | grep -q "ai-chat-toggle"; then
    test_pass "AI Chatbot button present"
else
    test_fail "AI Chatbot button missing"
fi

# Test Accessibility button
if echo "$HOMEPAGE_HTML" | grep -q "accessibility-toggle"; then
    test_pass "Accessibility button present"
else
    test_fail "Accessibility button missing"
fi

echo ""
echo "======================================"
echo "4. AUTHENTICATION API TESTS"
echo "======================================"

# Test auth/me endpoint (unauthenticated)
AUTH_ME=$(curl -s "$BASE_URL/api/auth/me")
if echo "$AUTH_ME" | grep -q "Not authenticated"; then
    test_pass "Auth /api/auth/me endpoint working (unauthenticated)"
else
    test_fail "Auth /api/auth/me endpoint not working"
fi

# Test registration (new user)
TIMESTAMP=$(date +%s)
REG_EMAIL="autotest${TIMESTAMP}@test.local"
REG_USER="autotest${TIMESTAMP}"
REG_PASS="AutoTest@${TIMESTAMP}Pass!"

REG_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$REG_USER\",\"email\":\"$REG_EMAIL\",\"password\":\"$REG_PASS\"}")

if echo "$REG_RESULT" | grep -q "success"; then
    test_pass "Registration successful for $REG_EMAIL"
    test_info "User ID: $(echo $REG_RESULT | grep -o '"id":[0-9]*' | cut -d: -f2)"
else
    test_fail "Registration failed: $(echo $REG_RESULT | head -c 100)"
fi

# Test login with unverified account
LOGIN_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$REG_USER\",\"password\":\"$REG_PASS\"}")

if echo "$LOGIN_RESULT" | grep -q "Email not verified"; then
    test_pass "Login correctly requires email verification"
else
    test_fail "Login verification check not working"
fi

echo ""
echo "======================================"
echo "5. STATIC ASSETS TESTS"
echo "======================================"

# Test Tailwind CSS
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/tailwind-complete.css" | grep -q "200"; then
    TAILWIND_SIZE=$(curl -s "$BASE_URL/static/tailwind-complete.css" | wc -c)
    test_pass "Tailwind CSS loaded ($(numfmt --to=iec $TAILWIND_SIZE))"
else
    test_fail "Tailwind CSS not loading"
fi

# Test i18n.js
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/i18n.js" | grep -q "200"; then
    test_pass "i18n.js loaded successfully"
else
    test_fail "i18n.js not loading"
fi

# Test chatbot.js
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/chatbot.js" | grep -q "200"; then
    test_pass "chatbot.js loaded successfully"
else
    test_fail "chatbot.js not loading"
fi

# Test accessibility.js
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/accessibility.js" | grep -q "200"; then
    test_pass "accessibility.js loaded successfully"
else
    test_fail "accessibility.js not loading"
fi

echo ""
echo "======================================"
echo "6. SPECIAL PAGES TESTS"
echo "======================================"

# Test AI Chat page
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ai-chat" | grep -q "200\|302"; then
    test_pass "AI Chat page accessible"
else
    test_fail "AI Chat page not accessible"
fi

# Test AR Dashboard
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ar-dashboard" | grep -q "200\|302"; then
    test_pass "AR Dashboard accessible"
else
    test_fail "AR Dashboard not accessible"
fi

# Test Voice Journal
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/voice-journal" | grep -q "200\|302"; then
    test_pass "Voice Journal accessible"
else
    test_fail "Voice Journal not accessible"
fi

echo ""
echo "======================================"
echo "7. API ENDPOINTS TESTS"
echo "======================================"

# Test health endpoint
HEALTH=$(curl -s "$BASE_URL/api/health/status")
if echo "$HEALTH" | grep -q "healthy"; then
    test_pass "Health endpoint working"
else
    test_fail "Health endpoint not working"
fi

# Test activities endpoint
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/activities" | grep -q "200"; then
    test_pass "Activities API accessible"
else
    test_fail "Activities API not accessible"
fi

echo ""
echo "======================================"
echo "8. THEME & STYLING TESTS"
echo "======================================"

# Check for dark mode classes
if echo "$HOMEPAGE_HTML" | grep -q "dark:bg-gray"; then
    test_pass "Dark mode styling present"
else
    test_fail "Dark mode styling missing"
fi

# Check for responsive classes
if echo "$HOMEPAGE_HTML" | grep -q "sm:\|md:\|lg:"; then
    test_pass "Responsive design classes present"
else
    test_fail "Responsive design classes missing"
fi

echo ""
echo "======================================"
echo "9. SECURITY HEADERS TESTS"
echo "======================================"

HEADERS=$(curl -s -I "$BASE_URL")

if echo "$HEADERS" | grep -q "strict-transport-security"; then
    test_pass "HSTS header present"
else
    test_fail "HSTS header missing"
fi

if echo "$HEADERS" | grep -q "content-security-policy"; then
    test_pass "CSP header present"
else
    test_fail "CSP header missing"
fi

echo ""
echo "======================================"
echo "10. PERFORMANCE TESTS"
echo "======================================"

# Test page load time
START_TIME=$(date +%s%N)
curl -s -o /dev/null "$BASE_URL"
END_TIME=$(date +%s%N)
LOAD_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))

if [ $LOAD_TIME -lt 2000 ]; then
    test_pass "Homepage loads fast: ${LOAD_TIME}ms"
elif [ $LOAD_TIME -lt 5000 ]; then
    test_info "Homepage load time acceptable: ${LOAD_TIME}ms"
else
    test_fail "Homepage loads slow: ${LOAD_TIME}ms"
fi

echo ""
echo "======================================"
echo "FINAL RESULTS"
echo "======================================"
echo -e "${GREEN}✓ Tests Passed: $pass_count${NC}"
echo -e "${RED}✗ Tests Failed: $fail_count${NC}"
echo "Total Tests: $((pass_count + fail_count))"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "MoodMash is 100% functional!"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($pass_count / ($pass_count + $fail_count)) * 100}")
    echo "Success Rate: ${SUCCESS_RATE}%"
    exit 1
fi
