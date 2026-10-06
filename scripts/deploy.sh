#!/usr/bin/env bash
set -euo pipefail

AWS_REGION=${AWS_REGION:-ap-south-1}
STACK_NAME=${STACK_NAME:-chaamp-dev}

sam build --template template.yaml --region "$AWS_REGION"
sam deploy --template-file .aws-sam/build/template.yaml --stack-name "$STACK_NAME" --resolve-s3 --region "$AWS_REGION" --capabilities CAPABILITY_IAM
