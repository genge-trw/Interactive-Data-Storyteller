from flask import Flask, request, jsonify
import joblib
import os
import requests # Added for making HTTP requests

app = Flask(__name__)

# Define the path to the trained model
# Assuming the model file is in the same directory as this script
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'tuned_sentiment_model.joblib')
tuned_pipeline = None

def load_model():
    """Loads the pre-trained sentiment analysis pipeline."""
    global tuned_pipeline
    try:
        tuned_pipeline = joblib.load(MODEL_PATH)
        print(f"Model loaded successfully from {MODEL_PATH}")
    except FileNotFoundError:
        print(f"Error: Model file not found at {MODEL_PATH}. Please ensure the model is trained and saved.")
        tuned_pipeline = None
    except Exception as e:
        print(f"Error loading model: {e}")
        tuned_pipeline = None

# Load the model when the application starts
with app.app_context():
    load_model()

@app.route('/analyze_sentiment', methods=['POST'])
def analyze_sentiment():
    if tuned_pipeline is None:
        return jsonify({"error": "Model not loaded. Please check server logs."}), 500

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "Invalid request. 'text' field is required."}), 400

    texts = data['text']
    if not isinstance(texts, list):
        texts = [texts] # Ensure it's a list for the pipeline

    # Basic input validation for security
    if not all(isinstance(item, str) for item in texts):
        return jsonify({"error": "Invalid input. 'text' must be a string or a list of strings."}), 400

    try:
        predictions = tuned_pipeline.predict(texts)
        return jsonify({"sentiments": predictions.tolist()})
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": "Error during sentiment prediction."}), 500

@app.route('/api/gemini', methods=['POST'])
def gemini_proxy():
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY environment variable not set."}), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        model = data.get('model', 'gemini-pro') # Default to gemini-pro if not specified
        contents = data.get('contents')
        generation_config = data.get('generationConfig')

        if not contents:
            return jsonify({"error": "Missing 'contents' in request body."}), 400

        gemini_api_url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={GEMINI_API_KEY}"

        headers = {
            'Content-Type': 'application/json'
        }

        payload = {
            'contents': contents
        }
        if generation_config:
            payload['generationConfig'] = generation_config

        response = requests.post(gemini_api_url, headers=headers, json=payload)
        response.raise_for_status() # Raise an exception for HTTP errors

        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": f"Error communicating with Gemini API: {e}"}), 500
    except Exception as e:
        print(f"Proxy server error: {e}")
        return jsonify({"error": f"Internal proxy server error: {e}"}), 500

@app.route('/status', methods=['GET'])
def status():
    if tuned_pipeline is not None:
        return jsonify({"status": "Model loaded and ready."}), 200
    else:
        return jsonify({"status": "Model not loaded."}), 503

if __name__ == '__main__':
    # For development, run with: python model_api.py
    # For production, use a WSGI server like Gunicorn
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
