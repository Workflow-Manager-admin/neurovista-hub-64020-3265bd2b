#!/bin/bash
cd /home/kavia/workspace/code-generation/neurovista-hub-64020-3265bd2b/neurovista_hub
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

