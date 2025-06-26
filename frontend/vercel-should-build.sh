#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "staging" || "$VERCEL_GIT_COMMIT_REF" == "master" || "$VERCEL_GIT_COMMIT_REF" == "ppr" ]] ; then
  # Proceed with the build
    echo "✅ - Build can proceed"
  exit 1;
fi

# Do not use quotations around the comparison here to allow wildcard matching
if [[  "$VERCEL_GIT_COMMIT_REF" == hemant_chourasia/* ]]
then
  # Proceed with the build
    echo "✅ - Build can proceed"
  exit 1;
fi

# Don't build
echo "🛑 - Build cancelled"
exit 0;
