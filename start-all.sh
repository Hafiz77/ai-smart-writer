#!/bin/bash
# Run both server and frontend in parallel
(cd server && npm i && npm run dev) &
(cd ai-smart-writer-frontend && npm i && npm start) &
wait
