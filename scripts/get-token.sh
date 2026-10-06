#!/usr/bin/env bash
set -euo pipefail

PROFILE=${AWS_PROFILE:-chaamp}
STACK=${STACK:-chaamp-dev}

q() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK" \
    --profile "$PROFILE" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
    --output text
}

aws cognito-idp admin-initiate-auth \
  --user-pool-id "$(q UserPoolId)" \
  --client-id "$(q UserPoolClientId)" \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters "USERNAME=${1}","PASSWORD=${2}" \
  --profile "$PROFILE" \
  --query 'AuthenticationResult.IdToken' \
  --output text
