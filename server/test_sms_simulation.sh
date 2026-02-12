#!/bin/bash
# Test the SMS Simulation Endpoint

echo "Testing SMS Simulation Endpoint..."
echo "Sending request to /api/simulate/alert with a test phone number..."

curl -X POST http://localhost:5000/api/simulate/alert \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9188833298",
    "userId": "auto" 
  }'

echo -e "\n\nCheck server logs for SMS output."
