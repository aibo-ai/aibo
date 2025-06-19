#!/bin/bash

# Install dependencies if not already installed
echo "Installing dependencies..."
npm install axios dotenv typescript ts-node @types/node

# Create test directory if it doesn't exist
mkdir -p test

# Create a TypeScript config file if it doesn't exist
if [ ! -f tsconfig.json ]; then
  echo '{
    "compilerOptions": {
      "target": "es2018",
      "module": "commonjs",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "outDir": "./dist",
      "rootDir": "."
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules"]
  }' > tsconfig.json
fi

# Run the test
echo -e "\nRunning API connection tests...\n"
npx ts-node test/test-api-connections.ts

# Check if tests were successful
if [ $? -eq 0 ]; then
  echo -e "\n✅ All tests completed successfully!"
else
  echo -e "\n❌ Some tests failed. Check the output above for details."
  exit 1
fi
