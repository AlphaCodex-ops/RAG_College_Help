#!/usr/bin/env bash
set -euo pipefail

EMAIL=${1:-}
ROLE=${2:-STUDENT}
PROFILE=${AWS_PROFILE:-chaamp}
STACK=${STACK:-chaamp-dev}

if [[ -z "$EMAIL" ]]; then
  echo "usage: set-role.sh <email> <ADMIN|STAFF|STUDENT>"
  exit 1
fi

POOL=$(aws cloudformation describe-stacks --stack-name "$STACK" --profile "$PROFILE" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)

for g in STUDENT STAFF ADMIN; do
  aws cognito-idp admin-remove-user-from-group --user-pool-id "$POOL" --username "$EMAIL" --group-name "$g" --profile "$PROFILE" 2>/dev/null || true
done

aws cognito-idp admin-add-user-to-group --user-pool-id "$POOL" --username "$EMAIL" --group-name "$ROLE" --profile "$PROFILE"
printf '%s is now %s (sign out and in again to refresh the token)\n' "$EMAIL" "$ROLE"
