#!/bin/bash

# Start the Celery worker in the background with 1 concurrent worker to save RAM on the free tier
celery -A config worker --concurrency=1 --loglevel=info &

# Start the Django web server in the foreground
daphne -b 0.0.0.0 -p $PORT config.asgi:application
