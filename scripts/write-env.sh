#!/usr/bin/env bash
set -euo pipefail

STACK=${1:-chaamp-dev}
PROFILE=${AWS_PROFILE:-chaamp}

q() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK" \
    --profile "$PROFILE" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
    --output text
}

cat > frontend/.env.local <<EOF
VITE_API_URL=$(q ApiUrl)
VITE_COGNITO_USER_POOL_ID=$(q UserPoolId)
VITE_COGNITO_CLIENT_ID=$(q UserPoolClientId)
VITE_AWS_REGION=$(q Region)
EOF

echo "wrote frontend/.env.local"
