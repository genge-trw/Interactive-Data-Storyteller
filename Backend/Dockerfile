# Use a lightweight Python base image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app/backend

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Environment variables for configuration
# GEMINI_API_KEY: Your Google Gemini API key (REQUIRED for AI features)
# PORT: The port the Flask app will listen on (defaults to 5000)

# Command to run the application using Gunicorn (a production-ready WSGI server)
# The --bind 0.0.0.0:$PORT ensures it listens on all network interfaces and uses the configured port
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "model_api:app"]
