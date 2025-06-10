import unittest
import os
import sys
import logging
from PIL import Image
import numpy as np
import io
from model_utils import CombinedProcessor, ModelError, ModelLoadError
from app import app

class TestTumorDetection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.app = app.test_client()
        cls.model_dir = os.path.join(os.path.dirname(__file__), 'model')
        cls.detection_model = os.path.join(cls.model_dir, 'EfficientNet_model_Brain_Detection.h5')
        cls.segmentation_model = os.path.join(cls.model_dir, 'Model_Segmentation.h5')
        
        # Configure logging
        logging.basicConfig(
            filename='test_output.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        
    def setUp(self):
        """Create test data"""
        # Create a simple test image
        self.test_image = Image.new('RGB', (256, 256), color='white')
        img_byte_arr = io.BytesIO()
        self.test_image.save(img_byte_arr, format='PNG')
        self.test_image_bytes = img_byte_arr.getvalue()

    def test_model_files_exist(self):
        """Test if model files exist"""
        self.assertTrue(os.path.exists(self.detection_model), "Detection model file not found")
        self.assertTrue(os.path.exists(self.segmentation_model), "Segmentation model file not found")

    def test_model_loading(self):
        """Test model initialization"""
        try:
            processor = CombinedProcessor(self.detection_model, self.segmentation_model)
            self.assertIsNotNone(processor, "Processor should not be None")
            self.assertIsNotNone(processor.detector, "Detector should not be None")
            self.assertIsNotNone(processor.segmenter, "Segmenter should not be None")
        except Exception as e:
            self.fail(f"Model loading failed: {str(e)}")

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('status', data)
        self.assertIn('models', data)

    def test_predict_endpoint_no_file(self):
        """Test predict endpoint without file"""
        response = self.app.post('/predict')
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)

    def test_predict_endpoint_with_file(self):
        """Test predict endpoint with valid file"""
        data = {
            'file': (io.BytesIO(self.test_image_bytes), 'test.png')
        }
        response = self.app.post('/predict', 
                               content_type='multipart/form-data',
                               data=data)
        
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        
        # Check required fields in response
        self.assertIn('prediction', result)
        self.assertIn('confidence_scores', result)
        
        # Validate confidence scores
        scores = result['confidence_scores']
        self.assertEqual(len(scores), 4)  # Should have 4 classes
        self.assertTrue(all(0 <= score <= 1 for score in scores.values()))

    def test_model_error_handling(self):
        """Test error handling in model processing"""
        # Test with invalid image
        invalid_image = b'not an image'
        data = {
            'file': (io.BytesIO(invalid_image), 'invalid.png')
        }
        response = self.app.post('/predict',
                               content_type='multipart/form-data',
                               data=data)
        
        self.assertEqual(response.status_code, 500)
        data = response.get_json()
        self.assertIn('error', data)

def run_tests():
    """Run tests with detailed output"""
    # Configure test runner
    suite = unittest.TestLoader().loadTestsFromTestCase(TestTumorDetection)
    runner = unittest.TextTestRunner(verbosity=2)
    
    # Run tests
    print("\nRunning TumorXtract Model Tests...")
    print("=" * 50)
    result = runner.run(suite)
    
    # Print summary
    print("\nTest Summary:")
    print("-" * 50)
    print(f"Tests Run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print("=" * 50)
    
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
