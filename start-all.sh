#!/bin/bash
# Run both server and frontend in parallel
(cd server && npm run dev) &
(cd ai-smart-writer-frontend && npm start) &
wait
