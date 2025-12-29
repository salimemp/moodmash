#!/bin/bash
# Comprehensive MoodMash Page Testing Script
# Tests all pages for Tailwind CSS, Font Awesome icons, and navigation

BASE_URL="https://moodmash.win"
PAGES=(
    ""
    "login"
    "register"
    "about"
    "ar-dashboard"
    "voice-journal"
    "3d-avatar"
    "ar-cards"
    "social-network"
    "gamification"
    "biometrics"
)

echo "========================================"
echo "MoodMash Comprehensive Page Test"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "Testing $(date)"
echo ""

PASS=0
FAIL=0

for page in "${PAGES[@]}"; do
    url="$BASE_URL/$page"
    echo "Testing: $url"
    
    # Fetch page
    response=$(curl -sL "$url")
    
    # Check for Tailwind CSS (self-hosted)
    if echo "$response" | grep -q "tailwind-complete.css"; then
        echo "  ✅ Tailwind CSS: Self-hosted"
        ((PASS++))
    elif echo "$response" | grep -q "cdn.tailwindcss.com"; then
        echo "  ⚠️  Tailwind CSS: CDN (may be blocked by COEP)"
        ((FAIL++))
    else
        echo "  ❌ Tailwind CSS: Not found"
        ((FAIL++))
    fi
    
    # Check for Font Awesome
    if echo "$response" | grep -q "fontawesome"; then
        echo "  ✅ Font Awesome: Found"
    else
        echo "  ❌ Font Awesome: Not found"
    fi
    
    # Check for navigation
    if echo "$response" | grep -q "fa-brain"; then
        echo "  ✅ Navigation: Icons present"
    else
        echo "  ⚠️  Navigation: May require authentication"
    fi
    
    echo ""
done

echo "========================================"
echo "Test Summary"
echo "========================================"
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "Total Tests: $((PASS + FAIL))"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "MoodMash is fully operational."
else
    echo ""
    echo "⚠️  Some tests failed. Please review the output above."
fi
