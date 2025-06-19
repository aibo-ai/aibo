#!/bin/bash
# Setup script for basic Azure AI Search index for Query Intent Analyzer

echo "Setting up basic Azure AI Search index for Query Intent Analyzer..."

# Variables from .env file
RESOURCE_GROUP="marketing-rg"
SEARCH_SERVICE_NAME="aibo-search"
SEARCH_INDEX_NAME="content-index"

# Get the Azure AI Search admin key
echo "Getting Azure AI Search admin key..."
SEARCH_ADMIN_KEY=$(az search admin-key show --resource-group $RESOURCE_GROUP --service-name $SEARCH_SERVICE_NAME --query primaryKey -o tsv)

# Create a JSON file for the basic index definition
cat > basic-index.json << EOF
{
  "name": "$SEARCH_INDEX_NAME",
  "fields": [
    {
      "name": "id",
      "type": "Edm.String",
      "key": true,
      "searchable": false,
      "filterable": true
    },
    {
      "name": "title",
      "type": "Edm.String",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "content",
      "type": "Edm.String",
      "searchable": true,
      "filterable": false
    },
    {
      "name": "url",
      "type": "Edm.String",
      "searchable": false,
      "filterable": true
    },
    {
      "name": "audience",
      "type": "Edm.String",
      "searchable": false,
      "filterable": true
    }
  ]
}
EOF

# Create the search index using the REST API
echo "Creating basic search index..."
curl -X PUT "https://$SEARCH_SERVICE_NAME.search.windows.net/indexes/$SEARCH_INDEX_NAME?api-version=2020-06-30" \
  -H "Content-Type: application/json" \
  -H "api-key: $SEARCH_ADMIN_KEY" \
  -d @basic-index.json

echo "Basic Azure AI Search index setup complete!"
