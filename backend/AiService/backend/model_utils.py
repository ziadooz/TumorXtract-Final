import numpy as np
import tensorflow as tf
# Configure TensorFlow
tf.keras.mixed_precision.set_global_policy('float32')

from tensorflow.keras.models import load_model
from tensorflow.keras.utils import img_to_array
from PIL import Image
import io
import base64
import cv2
import gc
import logging
import os
from datetime import datetime

# Configure logging
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, f'model_utils_{datetime.now().strftime("%Y%m%d")}.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
logging.getLogger().addHandler(console_handler)

class ModelError(Exception):
    """Base class for model-related errors"""
    pass

class ModelLoadError(ModelError):
    """Error loading model from file"""
    pass

class ModelPredictionError(ModelError):
    """Error during model prediction"""
    pass

class CustomConv2DTranspose(tf.keras.layers.Conv2DTranspose):
    def __init__(self, filters, kernel_size, strides=(1, 1), padding='valid',
                 output_padding=None, data_format=None, dilation_rate=(1, 1),
                 activation=None, use_bias=True, kernel_initializer='glorot_uniform',
                 bias_initializer='zeros', kernel_regularizer=None,
                 bias_regularizer=None, activity_regularizer=None,
                 kernel_constraint=None, bias_constraint=None, groups=1, **kwargs):
        # Ignore the groups parameter
        super().__init__(
            filters=filters,
            kernel_size=kernel_size,
            strides=strides,
            padding=padding,
            output_padding=output_padding,
            data_format=data_format,
            dilation_rate=dilation_rate,
            activation=activation,
            use_bias=use_bias,
            kernel_initializer=kernel_initializer,
            bias_initializer=bias_initializer,
            kernel_regularizer=kernel_regularizer,
            bias_regularizer=bias_regularizer,
            activity_regularizer=activity_regularizer,
            kernel_constraint=kernel_constraint,
            bias_constraint=bias_constraint,
            **kwargs
        )

def custom_load_model(model_path):
    """Load model with custom objects and handle incompatible parameters."""
    try:
        logging.info(f"Loading model from {model_path}")
        
        if not os.path.exists(model_path):
            raise ModelLoadError(f"Model file not found: {model_path}")

        print("\nDebug - Attempting to load model...")
        
        with tf.keras.utils.custom_object_scope({'Conv2DTranspose': CustomConv2DTranspose}):
            print("Debug - Loading model with custom Conv2DTranspose layer...")
            model = load_model(model_path, compile=False)
            print("Debug - Model loaded successfully")
            
        logging.info(f"Successfully loaded model: {model.name}")
        return model

    except tf.errors.NotFoundError:
        error_msg = f"Model file not found or inaccessible: {model_path}"
        logging.error(error_msg)
        raise ModelLoadError(error_msg)
        
    except Exception as e:
        logging.error(f"Unexpected error loading model: {str(e)}")
        raise ModelLoadError(f"Failed to load model: {str(e)}")

class TumorSegmenter:
    def __init__(self, model_path):
        """Initialize the tumor segmenter with a trained model."""
        try:
            logging.info("Initializing TumorSegmenter")
            self.model = custom_load_model(model_path)
            self.target_size = (256, 256)
            logging.info(f"TumorSegmenter initialized successfully")
            
        except Exception as e:
            logging.error(f"Failed to initialize segmentation model: {str(e)}")
            raise ModelLoadError(str(e))

    def preprocess_image(self, image):
        """Preprocess the image for segmentation."""
        try:
            if isinstance(image, str):
                image = Image.open(image)
            elif isinstance(image, bytes):
                image = Image.open(io.BytesIO(image))
            
            # Convert to RGB if necessary and resize
            image = image.convert('RGB')
            image = image.resize(self.target_size)
            
            # Convert to numpy array and normalize
            img_array = np.array(image) / 255.0
            return np.expand_dims(img_array, axis=0)
            
        except Exception as e:
            logging.error(f"Error preprocessing image: {str(e)}")
            raise ModelPredictionError(f"Failed to preprocess image: {str(e)}")

    def create_overlay(self, original_img, mask, alpha=0.5):
        """Create a colored overlay of the segmentation mask on the original image."""
        try:
            # Convert original image to PIL if needed
            if isinstance(original_img, np.ndarray):
                original_img = Image.fromarray(original_img)
            
            # Resize original to match mask size
            original_img = original_img.resize(self.target_size)
            original_rgba = original_img.convert('RGBA')
            
            # Create red overlay
            overlay = Image.new('RGBA', self.target_size, (255, 0, 0, int(255 * alpha)))
            
            # Create mask for overlay
            mask_img = Image.fromarray((mask * 255).astype('uint8')).convert('L')
            
            # Composite images
            result = Image.composite(overlay, original_rgba, mask_img)
            return np.array(result)
            
        except Exception as e:
            logging.error(f"Error creating overlay: {str(e)}")
            raise ModelPredictionError(f"Failed to create overlay: {str(e)}")

    def predict(self, image):
        """Generate segmentation mask for the image."""
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image)
            
            # Generate prediction
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Convert to binary mask
            mask = (predictions[0, ..., 0] > 0.5).astype(np.uint8)
            
            return mask
            
        except Exception as e:
            logging.error(f"Error during segmentation: {str(e)}")
            raise ModelPredictionError(f"Segmentation failed: {str(e)}")

class TumorDetector:
    def __init__(self, model_path):
        """Initialize the tumor detector with a trained model."""
        try:
            logging.info("Initializing TumorDetector")
            self.model = custom_load_model(model_path)
            self.class_names = ['glioma', 'meningioma', 'notumor', 'pituitary']
            self.target_size = (224, 224)
            logging.info("TumorDetector initialized successfully")
            
        except Exception as e:
            logging.error(f"Failed to initialize detection model: {str(e)}")
            raise ModelLoadError(str(e))

    def preprocess_image(self, image_file):
        """Preprocess the image for model prediction."""
        try:
            if isinstance(image_file, str):
                image = Image.open(image_file)
            elif isinstance(image_file, bytes):
                image = Image.open(io.BytesIO(image_file))
            else:
                image = image_file

            image = image.convert('RGB')
            image = image.resize(self.target_size)
            img_array = img_to_array(image)
            img_array = np.expand_dims(img_array, axis=0) / 255.0
            return img_array
            
        except Exception as e:
            logging.error(f"Error preprocessing image: {str(e)}")
            raise ModelPredictionError(str(e))

    def predict(self, image_file):
        """Predict the tumor class for a given image."""
        try:
            # Keep original image for segmentation
            if isinstance(image_file, str):
                original_img = Image.open(image_file)
            elif isinstance(image_file, bytes):
                original_img = Image.open(io.BytesIO(image_file))
            else:
                original_img = image_file
            
            # Preprocess and predict
            processed_image = self.preprocess_image(image_file)
            predictions = self.model.predict(processed_image, verbose=0)

            # Process results
            predicted_class = self.class_names[np.argmax(predictions[0])]
            confidence_scores = {
                class_name: float(prob)
                for class_name, prob in zip(self.class_names, predictions[0])
            }

            result = {
                'prediction': predicted_class,
                'confidence_scores': confidence_scores,
                'original_image': self.encode_image(np.array(original_img))
            }

            return result, original_img
            
        except Exception as e:
            logging.error(f"Error during detection: {str(e)}")
            raise ModelPredictionError(str(e))

    @staticmethod
    def encode_image(image_array):
        """Convert numpy array to base64 encoded string."""
        try:
            success, encoded_image = cv2.imencode('.png', cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR))
            if success:
                return base64.b64encode(encoded_image.tobytes()).decode('utf-8')
            raise ValueError("Failed to encode image")
        except Exception as e:
            logging.error(f"Error encoding image: {str(e)}")
            return None

class CombinedProcessor:
    def __init__(self, detector_model_path, segmenter_model_path):
        """Initialize both detector and segmenter."""
        try:
            logging.info("Initializing CombinedProcessor")
            self.detector = TumorDetector(detector_model_path)
            self.segmenter = TumorSegmenter(segmenter_model_path)
            logging.info("CombinedProcessor initialized successfully")
            
        except Exception as e:
            logging.error(f"Failed to initialize CombinedProcessor: {str(e)}")
            raise

    def process_image(self, image_file):
        """Process image through both detection and segmentation if needed."""
        try:
            # Run detection
            detection_result, original_img = self.detector.predict(image_file)
            
            # If tumor detected, run segmentation
            if detection_result['prediction'] != 'notumor':
                try:
                    mask = self.segmenter.predict(original_img)
                    overlay = self.segmenter.create_overlay(original_img, mask)
                    detection_result['segmentation'] = {
                        'mask': self.detector.encode_image(mask * 255),
                        'overlay': self.detector.encode_image(overlay)
                    }
                except Exception as e:
                    logging.error(f"Segmentation failed: {str(e)}")
                    detection_result['segmentation_error'] = str(e)

            return detection_result
            
        except Exception as e:
            logging.error(f"Error in combined processing: {str(e)}")
            raise ModelPredictionError(str(e))
