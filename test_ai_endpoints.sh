#!/bin/bash
BASE_URL="https://755d7ac4.moodmash.pages.dev"

echo "=== Testing AI Endpoints ==="
echo ""

echo "1. Mood Pattern Recognition:"
curl -s -X POST "$BASE_URL/api/ai/patterns" -H "Content-Type: application/json" -d '{}' | jq -r '.success, .data.insights[0]' | head -2
echo ""

echo "2. Predictive Mood Forecasting:"
curl -s -X POST "$BASE_URL/api/ai/forecast" -H "Content-Type: application/json" -d '{}' | jq -r '.success, .data.predictions[0].date' | head -2
echo ""

echo "3. Contextual Mood Analysis:"
curl -s -X POST "$BASE_URL/api/ai/context" -H "Content-Type: application/json" -d '{}' | jq -r '.success, .data.context_factors[0].factor' | head -2
echo ""

echo "4. Causal Factor Identification:"
curl -s -X POST "$BASE_URL/api/ai/causes" -H "Content-Type: application/json" -d '{}' | jq -r '.success, .data.triggers[0].trigger' | head -2
echo ""

echo "5. Personalized Recommendations:"
curl -s -X POST "$BASE_URL/api/ai/recommend" -H "Content-Type: application/json" -d '{}' | jq -r '.success, .data.recommendations[0].activity' | head -2
echo ""

echo "6. Crisis Intervention:"
curl -s -X POST "$BASE_URL/api/ai/crisis-check" -H "Content-Type: application/json" -d '{}' | jq -r '.success, .data.risk_level' | head -2
echo ""

echo "7. Early Risk Detection:"
curl -s -X POST "$BASE_URL/api/ai/risk-detect" -H "Content-Type: application/json" -d '{}' | jq -r '.success, .data.risk_indicators[0]' | head -2
echo ""

echo "8. Advanced Mood Analytics:"
curl -s -X POST "$BASE_URL/api/ai/analytics" -H "Content-Type: application/json" -d '{}' | jq -r '.success, .data.summary' | head -2
echo ""

echo "=== All Tests Complete ==="
