// Check authentication first
if (!authUtils.requireAuth()) {
    // requireAuth will redirect to login if not authenticated
    throw new Error('Authentication required');
}

// DOM Elements
const patientForm = document.getElementById('patientForm');
const submitButton = patientForm.querySelector('.submit-button');
const submitButtonText = submitButton.querySelector('.button-text');
const cancelButton = patientForm.querySelector('.cancel-button');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

// File Upload Elements
const mriImageInput = document.getElementById('mriImage');
const segmentationMaskInput = document.getElementById('segmentationMask');
const mriImageInfo = document.getElementById('mriImageInfo');
const segmentationMaskInfo = document.getElementById('segmentationMaskInfo');


// File Constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// API Constants
const API_BASE_URL = 'https://localhost:7071';

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('id');
const isEditMode = !!patientId;

// Store the current address ID for edit mode
let currentAddressId = 0;

// Update page content based on mode
if (isEditMode) {
    pageTitle.textContent = 'Edit Patient';
    pageSubtitle.textContent = 'Update patient information';
    submitButtonText.textContent = 'Save Changes';
    document.title = 'Edit Patient - TumorXtract';
}

// File Validation
function validateFile(file) {
    if (!file) return null;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Invalid file type. Only JPEG and PNG files are allowed.';
    }

    if (file.size > MAX_FILE_SIZE) {
        return 'File size exceeds 5MB limit.';
    }

    return null;
}

// Update File Info Display
function updateFileInfo(file, infoElement) {
    if (!file) {
        infoElement.innerHTML = '';
        return;
    }

    const error = validateFile(file);
    if (error) {
        infoElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error}`;
        infoElement.style.color = '#dc2626';
        return;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    infoElement.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${file.name} (${sizeMB} MB)
    `;
    infoElement.style.color = 'var(--secondary-color)';
}

// Form Validation
function validateForm(formData) {
    const errors = [];
    
    // Required fields (excluding AI section)
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'street', 'city', 'country'];
    
    requiredFields.forEach(field => {
        if (!formData.get(field)) {
            errors.push(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
        }
    });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.get('email') && !emailRegex.test(formData.get('email'))) {
        errors.push('Invalid email format');
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (formData.get('phone') && !phoneRegex.test(formData.get('phone'))) {
        errors.push('Invalid phone number format');
    }

    // AI section validation
    const tumorTypeInput = formData.get('tumorType');
    const confidenceScoreInput = formData.get('confidenceScore');
    const mriFile = mriImageInput.files[0];
    const maskFile = segmentationMaskInput.files[0];

    const anyAIFieldProvided = tumorTypeInput || confidenceScoreInput || mriFile || maskFile;

    if (anyAIFieldProvided) {
        // If any AI field is touched, then MRI, Mask, and TumorType become required
        if (!mriFile) {
            errors.push('MRI Image is required when providing AI analysis details.');
        } else {
            const mriError = validateFile(mriFile);
            if (mriError) errors.push(`MRI Image: ${mriError}`);
        }

        if (!maskFile) {
            errors.push('Segmentation Mask is required when providing AI analysis details.');
        } else {
            const maskError = validateFile(maskFile);
            if (maskError) errors.push(`Segmentation Mask: ${maskError}`);
        }
        
        if (!tumorTypeInput) {
            errors.push('Tumor Type is required when providing AI analysis details.');
        }

        // Validate confidence score format if provided
        if (confidenceScoreInput && (isNaN(parseFloat(confidenceScoreInput)) || parseFloat(confidenceScoreInput) < 0 || parseFloat(confidenceScoreInput) > 100)) {
            errors.push('Confidence score must be a number between 0 and 100.');
        }
    } else {
        // If no AI fields are provided, ensure no partial data that would require others
        // This case is mostly handled by the `anyAIFieldProvided` logic above.
        // Individual file validation for optional uploads if not part of "full AI section"
        if (mriFile) {
            const mriError = validateFile(mriFile);
            if (mriError) errors.push(`MRI Image: ${mriError}`);
        }
        if (maskFile) {
            const maskError = validateFile(maskFile);
            if (maskError) errors.push(`Segmentation Mask: ${maskError}`);
        }
    }

    return errors;
}

// Helper function to format date for input field
function formatDateForInput(dateStr) {
    try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error('Date format error:', e);
        return '';
    }
}


// Load patient data in edit mode
async function loadPatientData() {
    if (!isEditMode) return;

    try {
        submitButton.classList.add('loading');
        
        // Get auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        // Fetch patient data from API
        const patient = await apiCall(`${API_CONFIG.ENDPOINTS.GET_PATIENT_BY_ID}/${patientId}`);

        if (!patient) {
            throw new Error('Patient not found');
        }

        // Fill form fields
        document.getElementById('patientId').value = patient.id;
        document.getElementById('firstName').value = patient.firstName;
        document.getElementById('lastName').value = patient.lastName;
        document.getElementById('dateOfBirth').value = formatDateForInput(patient.dateOfBirth);
        document.getElementById('gender').value = patient.gender.toLowerCase();
        document.getElementById('email').value = patient.email;
        document.getElementById('phone').value = patient.phone;

        // Address fields
        if (patient.address) {
            // Store the existing address ID for edit mode
            currentAddressId = patient.address.id || 0;
            
            document.getElementById('street').value = patient.address.street || '';
            document.getElementById('city').value = patient.address.city || '';
            document.getElementById('state').value = patient.address.state || '';
            document.getElementById('country').value = patient.address.country || '';
        }

        // Medical Information
        document.getElementById('symptoms').value = patient.primarySymptoms || '';
        document.getElementById('medicalHistory').value = patient.medicalHistory || '';

        // Analysis fields
        if (patient.analysis) {
            const tumorTypeSelect = document.getElementById('tumorType');
            if (patient.analysis.tumorType) {
                tumorTypeSelect.value = patient.analysis.tumorType.toLowerCase();
            }
            
            if (patient.analysis.confidence !== undefined && patient.analysis.confidence !== null) {
                document.getElementById('confidenceScore').value = patient.analysis.confidence;
            }

            // Show file info if files were previously uploaded
            if (patient.analysis.mriScane) { // Changed mriScan to mriScane
                mriImageInfo.innerHTML = '<i class="fas fa-check-circle"></i> Previous MRI image available';
                mriImageInfo.style.color = 'var(--secondary-color)';
            }

            if (patient.analysis.mask) {
                segmentationMaskInfo.innerHTML = '<i class="fas fa-check-circle"></i> Previous segmentation mask available';
                segmentationMaskInfo.style.color = 'var(--secondary-color)';
            }
        }

    } catch (error) {
        console.error('Error loading patient data:', error);
        alert(`Error loading patient data: ${error.message}`);
        window.location.href = 'patients.html';
    } finally {
        submitButton.classList.remove('loading');
    }
}

// Form Submission
patientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(patientForm);
    
    // Validate form
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
    }

    // Show loading state
    submitButton.classList.add('loading');
    submitButton.disabled = true;

    try {
        // Get auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        // Prepare patient data
        const patientData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            dateOfBirth: new Date(formData.get('dateOfBirth')).toISOString(),
            gender: formData.get('gender').charAt(0).toUpperCase() + formData.get('gender').slice(1), // Capitalize first letter
            email: formData.get('email'),
            phone: formData.get('phone'),
            primarySymptoms: formData.get('symptoms') || null,
            medicalHistory: formData.get('medicalHistory') || null,
            address: {
                id: currentAddressId, // Use existing address ID for edit mode, 0 for new addresses
                street: formData.get('street'),
                city: formData.get('city'),
                state: formData.get('state') || '',
                country: formData.get('country')
            },
            lastVist: new Date().toISOString(), // Current date for new patients
            analysis: null // Initialize as null
        };

        // Determine if any AI analysis data is provided
        const mriFileToSubmit = mriImageInput.files[0];
        const maskFileToSubmit = segmentationMaskInput.files[0];
        const tumorTypeToSubmit = formData.get('tumorType');
        const confidenceScoreToSubmit = formData.get('confidenceScore');

        const hasAnyAIData = mriFileToSubmit || maskFileToSubmit || tumorTypeToSubmit || confidenceScoreToSubmit;

        if (hasAnyAIData) {
            patientData.analysis = {
                mriScane: null,
                mask: null,
                tumorType: tumorTypeToSubmit || null, // Ensure null if empty string
                analysisDate: new Date().toISOString(),
                confidence: 0 // Default, will be updated
            };

            const rawConfidence = confidenceScoreToSubmit;
            let parsedConfidence = parseFloat(rawConfidence);
            if (!rawConfidence || isNaN(parsedConfidence)) {
                parsedConfidence = 0;
            }
            patientData.analysis.confidence = parsedConfidence;

            if (mriFileToSubmit) {
                patientData.analysis.mriScane = `/scans/${formData.get('firstName').toLowerCase()}_${formData.get('lastName').toLowerCase()}/mri.dicom`;
            }
            if (maskFileToSubmit) {
                patientData.analysis.mask = `/scans/${formData.get('firstName').toLowerCase()}_${formData.get('lastName').toLowerCase()}/mask.dicom`;
            }
        }
        // If no AI data, patientData.analysis remains null

        // Make API call
        if (isEditMode) {
            await apiCall(`${API_CONFIG.ENDPOINTS.UPDATE_PATIENT}/${patientId}`, {
                method: 'PUT',
                body: JSON.stringify(patientData)
            });
            alert('Patient updated successfully!');
        } else {
            await apiCall(API_CONFIG.ENDPOINTS.CREATE_PATIENT, {
                method: 'POST',
                body: JSON.stringify(patientData)
            });
            alert('Patient added successfully!');
        }

        // Redirect to patients list
        window.location.href = 'patients.html';

    } catch (error) {
        const errorMessage = isEditMode ? 'Error updating patient' : 'Error adding patient';
        alert(`${errorMessage}: ${error.message}`);
        console.error('Error:', error);

    } finally {
        // Reset button state
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
});

// File Input Handlers
mriImageInput.addEventListener('change', (e) => {
    updateFileInfo(e.target.files[0], mriImageInfo);
});

segmentationMaskInput.addEventListener('change', (e) => {
    updateFileInfo(e.target.files[0], segmentationMaskInfo);
});

// Cancel Button
cancelButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
        window.location.href = 'patients.html';
    }
});


// Form Input Enhancements
document.querySelectorAll('.input-group input, .input-group select, .input-group textarea').forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', () => {
        input.parentElement.classList.remove('focused');
    });

    input.addEventListener('input', () => {
        if (input.hasAttribute('required') && !input.value) {
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
        }

        if (input.id === 'confidenceScore') {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                input.value = Math.min(100, Math.max(0, value));
            }
        }
    });
});

// Initialize page
loadPatientData();
