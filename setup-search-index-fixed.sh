#!/bin/bash
# Setup script for Azure AI Search index for Query Intent Analyzer

echo "Setting up Azure AI Search index for Query Intent Analyzer..."

# Variables from .env file
RESOURCE_GROUP="marketing-rg"
SEARCH_SERVICE_NAME="aibo-search"
SEARCH_INDEX_NAME="content-index"

# Get the Azure AI Search admin key
echo "Getting Azure AI Search admin key..."
SEARCH_ADMIN_KEY=$(az search admin-key show --resource-group $RESOURCE_GROUP --service-name $SEARCH_SERVICE_NAME --query primaryKey -o tsv)

# Create a JSON file for the index definition with updated schema
cat > search-index.json << EOF
{
  "name": "$SEARCH_INDEX_NAME",
  "fields": [
    {
      "name": "id",
      "type": "Edm.String",
      "key": true,
      "searchable": false,
      "filterable": true,
      "sortable": true,
      "facetable": false
    },
    {
      "name": "title",
      "type": "Edm.String",
      "searchable": true,
      "filterable": true,
      "sortable": true,
      "facetable": false
    },
    {
      "name": "content",
      "type": "Edm.String",
      "searchable": true,
      "filterable": false,
      "sortable": false,
      "facetable": false
    },
    {
      "name": "url",
      "type": "Edm.String",
      "searchable": false,
      "filterable": true,
      "sortable": false,
      "facetable": false
    },
    {
      "name": "snippet",
      "type": "Edm.String",
      "searchable": true,
      "filterable": false,
      "sortable": false,
      "facetable": false
    },
    {
      "name": "audience",
      "type": "Edm.String",
      "searchable": false,
      "filterable": true,
      "sortable": false,
      "facetable": true
    },
    {
      "name": "contentType",
      "type": "Edm.String",
      "searchable": false,
      "filterable": true,
      "sortable": false,
      "facetable": true
    },
    {
      "name": "timestamp",
      "type": "Edm.DateTimeOffset",
      "searchable": false,
      "filterable": true,
      "sortable": true,
      "facetable": false
    }
  ],
  "semanticSearch": {
    "configurations": [
      {
        "name": "default",
        "prioritizedFields": {
          "titleField": { "fieldName": "title" },
          "prioritizedContentFields": [
            { "fieldName": "content" },
            { "fieldName": "snippet" }
          ]
        }
      }
    ]
  }
}
EOF

# Create the search index using the REST API
echo "Creating search index..."
curl -X PUT "https://$SEARCH_SERVICE_NAME.search.windows.net/indexes/$SEARCH_INDEX_NAME?api-version=2023-11-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $SEARCH_ADMIN_KEY" \
  -d @search-index.json

echo "Azure AI Search index setup complete!"
