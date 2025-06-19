#!/bin/bash

# Test script for Freshness Aggregator Function
# This script tests the deployed function with various queries

set -e  # Exit on any error

# Configuration
FUNCTION_APP_NAME="freshness-aggregator-func"
RESOURCE_GROUP="freshness-aggregator-rg"

echo "=== Freshness Aggregator Function Tests ==="

# Load configuration if available
if [ -f "azure-config.json" ]; then
    echo "Loading configuration from azure-config.json..."
    FUNCTION_APP_NAME=$(jq -r '.functionApp' azure-config.json)
    FUNCTION_URL=$(jq -r '.functionAppUrl' azure-config.json)
else
    echo "Warning: azure-config.json not found. Using default values."
    FUNCTION_URL="https://$FUNCTION_APP_NAME.azurewebsites.net"
fi

API_ENDPOINT="$FUNCTION_URL/api/freshness-aggregator"

echo "Testing Function App: $FUNCTION_APP_NAME"
echo "API Endpoint: $API_ENDPOINT"
echo ""

# Test 1: Basic query
echo "=== Test 1: Basic Query ==="
echo "Testing with query: 'azure functions'"
curl -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"query": "azure functions"}' \
    -w "\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n\n" || echo "Test 1 failed"

# Test 2: Query with options
echo "=== Test 2: Query with Options ==="
echo "Testing with query: 'cosmos' and custom options"
curl -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "cosmos",
        "options": {
            "maxResults": 3,
            "freshnessWeight": 0.6,
            "popularityWeight": 0.2,
            "contentTypes": ["documentation", "article"]
        }
    }' \
    -w "\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n\n" || echo "Test 2 failed"

# Test 3: Query with no results
echo "=== Test 3: Query with No Results ==="
echo "Testing with query that should return no results"
curl -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"query": "nonexistentquery12345"}' \
    -w "\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n\n" || echo "Test 3 failed"

# Test 4: Invalid request (missing query)
echo "=== Test 4: Invalid Request ==="
echo "Testing with missing query parameter"
curl -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"options": {"maxResults": 5}}' \
    -w "\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n\n" || echo "Test 4 failed"

# Test 5: GET request (should work with query parameter)
echo "=== Test 5: GET Request ==="
echo "Testing GET request (if supported)"
curl -X GET "$API_ENDPOINT?query=serverless" \
    -w "\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n\n" || echo "Test 5 failed (expected if GET not implemented)"

# Test 6: Performance test (multiple requests)
echo "=== Test 6: Performance Test ==="
echo "Testing multiple requests for caching behavior"
for i in {1..3}; do
    echo "Request $i:"
    curl -X POST "$API_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{"query": "performance test"}' \
        -w "Response Time: %{time_total}s\n" \
        -s -o /dev/null || echo "Performance test request $i failed"
done
echo ""

# Test 7: Large query
echo "=== Test 7: Large Query ==="
echo "Testing with a longer query"
curl -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "azure functions serverless computing cloud architecture microservices",
        "options": {
            "maxResults": 10,
            "freshnessWeight": 0.5,
            "popularityWeight": 0.3
        }
    }' \
    -w "\nStatus Code: %{http_code}\nResponse Time: %{time_total}s\n\n" || echo "Test 7 failed"

echo "=== All Tests Completed ==="
echo ""
echo "Additional Testing Commands:"
echo ""
echo "Monitor function logs:"
echo "az functionapp log tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "View Application Insights metrics:"
echo "az monitor app-insights metrics show --app freshness-insights --resource-group $RESOURCE_GROUP --metric requests/count"
echo ""
echo "Test with custom payload:"
echo "curl -X POST $API_ENDPOINT \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"query\": \"your-query-here\", \"options\": {\"maxResults\": 5}}'"
echo ""
echo "View function in Azure Portal:"
echo "https://portal.azure.com/#@/resource/subscriptions/[subscription-id]/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$FUNCTION_APP_NAME"
