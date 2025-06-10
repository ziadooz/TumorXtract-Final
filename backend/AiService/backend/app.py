from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging
from datetime import datetime
from model_utils import CombinedProcessor, ModelError, ModelLoadError, ModelPredictionError

# Configure logging
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, f'app_{datetime.now().strftime("%Y%m%d")}.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Add console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
logging.getLogger().addHandler(console_handler)

# Get absolute paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')

# Initialize Flask app
app = Flask(__name__, 
           static_folder=FRONTEND_DIR,
           static_url_path='')
CORS(app)

# Initialize model paths
DETECTION_MODEL = os.path.join(MODEL_DIR, 'EfficientNet_model_Brain_Detection.h5')
SEGMENTATION_MODEL = os.path.join(MODEL_DIR, 'Model_Segmentation.h5')

# Initialize the processor with detailed logging
try:
    logging.info("Initializing models...")
    processor = CombinedProcessor(DETECTION_MODEL, SEGMENTATION_MODEL)
    logging.info("Models initialized successfully")
except ModelLoadError as e:
    logging.error(f"Error loading models: {str(e)}")
    processor = None
except Exception as e:
    logging.error(f"Unexpected error during initialization: {str(e)}")
    processor = None

@app.route('/')
def index():
    """Serve the frontend index page."""
    try:
        index_path = os.path.join(FRONTEND_DIR, 'index.html')
        logging.info(f"Attempting to serve index from: {index_path}")
        
        if os.path.exists(index_path):
            return send_from_directory(FRONTEND_DIR, 'index.html')
        
        error_msg = "Frontend files not found. Please check the frontend directory."
        logging.error(error_msg)
        return error_msg, 404
        
    except Exception as e:
        logging.error(f"Error serving index: {str(e)}")
        return str(e), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Check server and model health status."""
    try:
        status = {
            'server': 'running',
            'models': 'loaded' if processor is not None else 'not loaded',
            'timestamp': datetime.now().isoformat()
        }
        
        if processor is None:
            status['error'] = 'Models failed to load'
            return jsonify(status), 503
            
        return jsonify(status)
        
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        return jsonify({
            'server': 'error',
            'error': str(e)
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Process uploaded image and return predictions."""
    try:
        # Check if models are loaded
        if processor is None:
            return jsonify({
                'error': 'Models not initialized',
                'details': 'The system is not ready to process images'
            }), 503

        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Log processing attempt
        logging.info(f"Processing file: {file.filename}")
        
        # Read file contents
        file_bytes = file.read()
        
        # Process the image
        try:
            result = processor.process_image(file_bytes)
            logging.info("Image processed successfully")
            return jsonify(result)
            
        except ModelPredictionError as e:
            error_msg = f"Model prediction failed: {str(e)}"
            logging.error(error_msg)
            return jsonify({'error': error_msg}), 500
            
        except Exception as e:
            error_msg = f"Error processing image: {str(e)}"
            logging.error(error_msg)
            return jsonify({'error': error_msg}), 500

    except Exception as e:
        error_msg = f"Unexpected error in predict endpoint: {str(e)}"
        logging.error(error_msg)
        return jsonify({'error': error_msg}), 500

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files."""
    try:
        file_path = os.path.join(FRONTEND_DIR, filename)
        logging.info(f"Attempting to serve: {file_path}")
        
        if os.path.exists(file_path):
            return send_from_directory(FRONTEND_DIR, filename)
            
        logging.warning(f"File not found: {file_path}")
        return f"File {filename} not found", 404
        
    except Exception as e:
        logging.error(f"Error serving static file {filename}: {str(e)}")
        return str(e), 500

@app.errorhandler(Exception)
def handle_error(e):
    """Global error handler."""
    error_msg = f"Unhandled exception: {str(e)}"
    logging.error(error_msg)
    return jsonify({
        'error': 'Internal server error',
        'details': str(e)
    }), 500

if __name__ == '__main__':
    # Log startup information
    logging.info("=== Server Starting ===")
    logging.info(f"Frontend directory: {FRONTEND_DIR}")
    logging.info(f"Model directory: {MODEL_DIR}")
    logging.info(f"Detection model: {os.path.exists(DETECTION_MODEL)}")
    logging.info(f"Segmentation model: {os.path.exists(SEGMENTATION_MODEL)}")
    
    # Start the server
    app.run(host='0.0.0.0', port=5000, debug=True)
