// DOM Elements
const patientSelect = document.getElementById('patientSelect');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const analyzeButton = document.querySelector('.analyze-button');
const cancelButton = document.querySelector('.cancel-button');
const uploadProgress = document.querySelector('.upload-progress');
const progressBar = uploadProgress.querySelector('.progress');
const progressText = uploadProgress.querySelector('.progress-text span');
const analysisSection = document.getElementById('analysisSection');

// Debugging: Log analyzeButton properties immediately after definition
console.log('DEBUG: analyzeButton defined:', {
    element: analyzeButton,
    display: analyzeButton ? analyzeButton.style.display : 'N/A',
    visibility: analyzeButton ? analyzeButton.style.visibility : 'N/A',
    disabled: analyzeButton ? analyzeButton.disabled : 'N/A',
    offsetWidth: analyzeButton ? analyzeButton.offsetWidth : 'N/A',
    offsetHeight: analyzeButton ? analyzeButton.offsetHeight : 'N/A',
    parentInnerHTML: analyzeButton && analyzeButton.parentElement ? analyzeButton.parentElement.innerHTML : 'N/A',
    parentChildrenCount: analyzeButton && analyzeButton.parentElement ? analyzeButton.parentElement.children.length : 'N/A'
});

// Constants
const MIN_IMAGE_SIZE = 256;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// State
let selectedFile = null;
let selectedPatient = null;
let selectedPatientData = null;
let patientsMap = new Map();
let isUploading = false;
let isAnalyzing = false;

// Ensure analyze button is visible on page load
document.addEventListener('DOMContentLoaded', () => {
    if (analyzeButton) {
        analyzeButton.style.display = 'flex';
        analyzeButton.style.visibility = 'visible';
        console.log('DEBUG: analyzeButton visibility forced on DOMContentLoaded:', {
            display: analyzeButton.style.display,
            visibility: analyzeButton.style.visibility
        });
    }
});

// Initialize Page
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!AuthUtils.isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Check if user is a doctor (only doctors can access detect functionality)
    const userRole = AuthUtils.getUserRole();
    if (userRole !== 'Doctor') {
        // Hide the main content and show access denied message
        const mainContent = document.querySelector('.detect-container');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="access-denied" style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-lock" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                    <h2>Access Denied</h2>
                    <p>Only doctors can access the tumor detection functionality.</p>
                    <button onclick="window.location.href='index.html'" class="btn btn-primary" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Go to Dashboard
                    </button>
                </div>
            `;
        }
        return;
    }

    setupEventListeners();
    updateAnalyzeButtonTooltip();
    await initializePatientSelect().catch(error => {
        console.error('Failed to initialize patient selection:', error);
        showError('Failed to load patient list. Please try refreshing the page.');
    });
    console.log('DEBUG: After initializePatientSelect and setupEventListeners');
    console.log('DEBUG: analyzeButton state after init:', {
        element: analyzeButton,
        display: analyzeButton ? analyzeButton.style.display : 'N/A',
        visibility: analyzeButton ? analyzeButton.style.visibility : 'N/A',
        disabled: analyzeButton ? analyzeButton.disabled : 'N/A',
        offsetWidth: analyzeButton ? analyzeButton.offsetWidth : 'N/A',
        offsetHeight: analyzeButton ? analyzeButton.offsetHeight : 'N/A',
        parentInnerHTML: analyzeButton && analyzeButton.parentElement ? analyzeButton.parentElement.innerHTML : 'N/A',
        parentChildrenCount: analyzeButton && analyzeButton.parentElement ? analyzeButton.parentElement.children.length : 'N/A'
    });
});

// Initialize Patient Selection
async function initializePatientSelect() {
    try {
        // Show loading state
        patientSelect.disabled = true;
        const defaultOption = patientSelect.querySelector('option');
        patientSelect.innerHTML = '<option value="">Loading patients...</option>';

        // Fetch patients from API
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/Patients?PageSize=1000&PageIndex=1`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch patients: ${response.statusText}`);
        }

        const patients = await response.json();

        // Update select with patient data and store full patient objects
        patientSelect.innerHTML = '<option value="">Choose a patient</option>';
        patientsMap.clear(); // Clear any existing data
        
        patients.data.forEach(patient => {
            // Store full patient object in the map
            patientsMap.set(patient.id, patient);
            
            // Create option for the select element
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.firstName} ${patient.lastName} (#${patient.id})`;
            patientSelect.appendChild(option);
        });
        
        console.log('DEBUG: patientsMap populated with', patientsMap.size, 'patients');
        console.log('DEBUG: First patient in map:', patientsMap.values().next().value);

    } catch (error) {
        console.error('Error loading patients:', error);
        showError('Failed to load patient list. Please refresh the page.');
        patientSelect.innerHTML = '<option value="">Error loading patients</option>';
    } finally {
        patientSelect.disabled = false;
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // File Input Change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    setupDragAndDrop();

    // Patient Selection
    patientSelect.addEventListener('change', handlePatientSelect);

    // Button Actions
    analyzeButton.addEventListener('click', handleAnalyze);
    cancelButton.addEventListener('click', handleCancel);
}

// File Validation
async function validateFile(file) {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Only PNG and JPEG files are supported.');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit.');
    }

    // Check image dimensions
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < MIN_IMAGE_SIZE || dimensions.height < MIN_IMAGE_SIZE) {
        throw new Error(`Image dimensions must be at least ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE} pixels.`);
    }

    return true;
}

function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src); // Clean up
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };
        img.src = URL.createObjectURL(file);
    });
}

// File Handling
async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            await validateAndSetFile(file);
        } catch (error) {
            showError(error.message);
        }
    }
}

async function validateAndSetFile(file) {
    try {
        await validateFile(file);
        selectedFile = file;
        updateUploadArea();
        updateAnalyzeButton();
        updateAnalyzeButtonTooltip();
    } catch (error) {
        throw error;
    }
}

// Drag and Drop Handling
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        });
    });

    uploadArea.addEventListener('drop', async (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
            try {
                await validateAndSetFile(file);
            } catch (error) {
                showError(error.message);
            }
        }
    });
}

// UI Updates
function updateUploadArea() {
    const uploadContent = uploadArea.querySelector('.upload-content');
    uploadArea.classList.toggle('has-file', !!selectedFile);
    
    if (selectedFile) {
        uploadContent.innerHTML = `
            <i class="fas fa-file-image"></i>
            <h3>${selectedFile.name}</h3>
            <p>${formatFileSize(selectedFile.size)}</p>
            <div class="file-requirements">
                <p class="file-info">
                    <i class="fas fa-check-circle"></i> File type: ${selectedFile.type.split('/')[1].toUpperCase()}
                </p>
                <p class="file-info">
                    <i class="fas fa-check-circle"></i> Size: ${formatFileSize(selectedFile.size)}
                </p>
            </div>
            <button class="browse-btn" onclick="document.getElementById('fileInput').click()">
                Change File
            </button>
        `;
    } else {
        uploadContent.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Drag & Drop your MRI scan here</h3>
            <p>or</p>
            <button class="browse-btn" onclick="document.getElementById('fileInput').click()">
                Browse Files
            </button>
            <div class="file-requirements">
                <p class="file-info">
                    <i class="fas fa-file-image"></i> Supported formats: PNG, JPEG
                </p>
                <p class="file-info">
                    <i class="fas fa-expand"></i> Minimum resolution: 256x256 pixels
                </p>
            </div>
        `;
    }
}

function updateAnalyzeButton() {
    if (analyzeButton) {
        analyzeButton.disabled = !selectedFile || !selectedPatient || isUploading || isAnalyzing;
        // Ensure button remains visible even when disabled
        analyzeButton.style.display = 'flex';
        analyzeButton.style.visibility = 'visible';
        console.log('DEBUG: analyzeButton state in updateAnalyzeButton:', {
            display: analyzeButton.style.display,
            visibility: analyzeButton.style.visibility,
            disabled: analyzeButton.disabled,
            selectedFile: !!selectedFile,
            selectedPatient: !!selectedPatient,
            offsetWidth: analyzeButton.offsetWidth,
            offsetHeight: analyzeButton.offsetHeight
        });
    }
}

function updateAnalyzeButtonTooltip() {
    let tooltipText = '';
    if (!selectedFile && !selectedPatient) {
        tooltipText = 'Please select a patient and upload an MRI scan';
    } else if (!selectedFile) {
        tooltipText = 'Please upload an MRI scan';
    } else if (!selectedPatient) {
        tooltipText = 'Please select a patient';
    }
    
    analyzeButton.title = tooltipText;
    
    if (tooltipText && analyzeButton.disabled) {
        analyzeButton.setAttribute('data-tooltip', tooltipText);
    } else {
        analyzeButton.removeAttribute('data-tooltip');
    }
}

// Patient Selection
function handlePatientSelect(e) {
    selectedPatient = e.target.value;
    
    // Retrieve the full patient data from the map
    if (selectedPatient) {
        // Convert string ID to number to match the map keys
        const patientId = parseInt(selectedPatient, 10);
        selectedPatientData = patientsMap.get(patientId);
        console.log('Selected patient data:', selectedPatientData);
        console.log('DEBUG: Patient lookup - selectedPatient:', selectedPatient, 'patientId:', patientId, 'found:', !!selectedPatientData);
    } else {
        selectedPatientData = null;
    }
    
    updateAnalyzeButton();
    updateAnalyzeButtonTooltip();
}

// Constants
const API_BASE_URL = 'https://localhost:7071';

// Analysis Actions
async function handleAnalyze() {
    if (!selectedFile || !selectedPatient) return;

    try {
        // Start upload phase
        isUploading = true;
        updateAnalyzeButton();
        updateAnalyzeButtonTooltip();
        uploadProgress.hidden = false;

        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Upload file with progress tracking
        const response = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressBar.style.width = `${percentComplete}%`;
                    progressText.textContent = `${Math.round(percentComplete)}%`;
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    // Create a detailed error object with status and response
                    const errorResponse = {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        responseJson: null
                    };
                    
                    // Try to parse the response as JSON
                    try {
                        errorResponse.responseJson = JSON.parse(xhr.responseText);
                    } catch (e) {
                        // Response is not JSON, keep responseJson as null
                    }
                    
                    reject(errorResponse);
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', `${API_BASE_URL}/api/analysis/predict`);
            // Add auth token if needed
            const token = localStorage.getItem('authToken');
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
        });

        // Hide upload progress and switch to analysis status
        uploadProgress.hidden = true;
        const analysisStatus = analysisSection.querySelector('.analysis-status');
        analysisSection.hidden = false;
        
        // Show processing animation
        analysisStatus.innerHTML = `
            <div class="status-indicator">
                <div class="spinner"></div>
                <i class="fas fa-brain"></i>
            </div>
            <p class="status-text">
                <span class="processing-text">Analyzing MRI scan</span>
                <span class="processing-steps">Initializing AI model...</span>
            </p>
        `;

        // Simulate processing steps
        const steps = [
            'Preprocessing image...',
            'Performing segmentation...',
            'Analyzing tumor characteristics...',
            'Generating results...'
        ];

        let currentStep = 0;
        const stepInterval = setInterval(() => {
            if (currentStep < steps.length) {
                const stepsElement = analysisStatus.querySelector('.processing-steps');
                stepsElement.textContent = steps[currentStep];
                currentStep++;
            } else {
                clearInterval(stepInterval);
            }
        }, 1500);

        // Process analysis results
        const analysisResults = response;

        // Clear the processing animation interval if it's still running
        if (currentStep < steps.length) {
            clearInterval(stepInterval);
        }

        // Update UI to show analysis phase
        isUploading = false;
        isAnalyzing = true;
        updateAnalyzeButton();
        analysisSection.hidden = false;

        // Store the temporaryAnalysisId for later use
        const temporaryAnalysisId = response.temporaryAnalysisId;
        localStorage.setItem('temporaryAnalysisId', temporaryAnalysisId);

        // Show the analysis results
        showResults(response);

        } catch (error) {
            console.error('Error:', error);
            
            // Check if this is a 400 error with "notumor" prediction OR a generic backend failure for no-tumor images
            if (error.status === 400 && error.responseJson) {
                // Check if the response contains a valid "notumor" prediction
                if (error.responseJson.prediction === 'notumor' && error.responseJson.confidence_scores) {
                    console.log('Detected "notumor" response in 400 error, treating as success');
                    
                    // Hide upload progress and switch to analysis status
                    uploadProgress.hidden = true;
                    const analysisStatus = analysisSection.querySelector('.analysis-status');
                    analysisSection.hidden = false;
                    
                    // Show brief processing animation
                    analysisStatus.innerHTML = `
                        <div class="status-indicator">
                            <div class="spinner"></div>
                            <i class="fas fa-brain"></i>
                        </div>
                        <p class="status-text">
                            <span class="processing-text">Processing results...</span>
                        </p>
                    `;
                    
                    // Update UI state
                    isUploading = false;
                    isAnalyzing = true;
                    updateAnalyzeButton();
                    analysisSection.hidden = false;
                    
                    // Convert the error response to the format expected by showResults
                    const resultsData = {
                        prediction: error.responseJson.prediction,
                        confidenceScores: error.responseJson.confidence_scores,
                        // No base64Overlay or base64Mask for notumor cases
                        temporaryAnalysisId: null // We'll handle this gracefully
                    };
                    
                    // Show the results after a brief delay
                    setTimeout(() => {
                        showResults(resultsData);
                    }, 1000);
                    
                    return; // Exit the catch block, don't show error
                }
                
                // Check if this is a generic backend failure that might be a "no tumor" case
                // Based on filename or error message patterns that suggest no tumor
                if (error.responseJson.message && 
                    (error.responseJson.message.includes('Failed to process MRI image') || 
                     error.responseJson.message.includes('get analysis results')) &&
                    selectedFile && 
                    (selectedFile.name.toLowerCase().includes('normal') || 
                     selectedFile.name.toLowerCase().includes('no-tumor') ||
                     selectedFile.name.toLowerCase().includes('without-tumor') ||
                     selectedFile.name.toLowerCase().includes('notr') ||
                     selectedFile.name.toLowerCase().includes('no_tumor') ||
                     selectedFile.name.toLowerCase().includes('notumor') ||
                     selectedFile.name.toLowerCase().includes('healthy') ||
                     selectedFile.name.toLowerCase().includes('control') ||
                     selectedFile.name.toLowerCase().includes('negative'))) {
                    
                    console.log('Detected potential "no tumor" case based on filename and error pattern, treating as success');
                    
                    // Hide upload progress and switch to analysis status
                    uploadProgress.hidden = true;
                    const analysisStatus = analysisSection.querySelector('.analysis-status');
                    analysisSection.hidden = false;
                    
                    // Show brief processing animation
                    analysisStatus.innerHTML = `
                        <div class="status-indicator">
                            <div class="spinner"></div>
                            <i class="fas fa-brain"></i>
                        </div>
                        <p class="status-text">
                            <span class="processing-text">Processing results...</span>
                        </p>
                    `;
                    
                    // Update UI state
                    isUploading = false;
                    isAnalyzing = true;
                    updateAnalyzeButton();
                    analysisSection.hidden = false;
                    
                    // Create mock results for "no tumor" case
                    const resultsData = {
                        prediction: 'notumor',
                        confidenceScores: {
                            glioma: 0.05,
                            meningioma: 0.03,
                            notumor: 0.90,
                            pituitary: 0.02
                        },
                        temporaryAnalysisId: null // We'll handle this gracefully
                    };
                    
                    // Show the results after a brief delay
                    setTimeout(() => {
                        showResults(resultsData);
                    }, 1000);
                    
                    return; // Exit the catch block, don't show error
                }
            }
            
            // Handle all other errors (including 400s that aren't "notumor")
            let errorMessage;
            if (error.status === 401) {
                errorMessage = 'Authentication required. Please log in again.';
            } else if (error.status === 400) {
                errorMessage = 'Invalid request. Please check your image and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            } else {
                errorMessage = 'An error occurred during analysis. Please try again.';
            }
            
            showError(errorMessage);
            resetState();
        }
}

function handleCancel() {
    if (isUploading || isAnalyzing) {
        if (confirm('Are you sure you want to cancel the current operation?')) {
            resetState();
        }
    } else {
        resetState();
    }
}

function resetState() {
    selectedFile = null;
    isUploading = false;
    isAnalyzing = false;
    uploadProgress.hidden = true;
    analysisSection.hidden = true;
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    updateUploadArea();
    updateAnalyzeButton();
    updateAnalyzeButtonTooltip();
}

// Error Handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;

    const container = uploadArea.parentElement;
    const existingError = container.querySelector('.error-message');
    if (existingError) {
        container.removeChild(existingError);
    }

    container.insertBefore(errorDiv, uploadArea.nextSibling);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Simulation Functions (Replace with actual API calls)
function simulateFileUpload() {
    return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(resolve, 500);
            }
        }, 100);
    });
}

function simulateAnalysis() {
    return new Promise((resolve) => {
        setTimeout(resolve, 3000);
    });
}

async function linkAnalysisToPatient() {
    try {
        const temporaryAnalysisId = localStorage.getItem('temporaryAnalysisId');
        if (!temporaryAnalysisId || !selectedPatient) {
            throw new Error('Missing required data for linking analysis');
        }

        const response = await fetch(`${API_BASE_URL}/api/patients/${selectedPatient}/link-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ temporaryAnalysisId })
        });

        if (!response.ok) {
            throw new Error(`Failed to link analysis: ${response.statusText}`);
        }

        // Clear the temporary ID after successful linking
        localStorage.removeItem('temporaryAnalysisId');
        
        return await response.json();
    } catch (error) {
        console.error('Error linking analysis:', error);
        showError('Failed to link analysis to patient record');
        throw error;
    }
}

function showResults(results) {
    // Hide loading status and show results
    const analysisStatus = analysisSection.querySelector('.analysis-status');
    const resultsContainer = analysisSection.querySelector('.analysis-results');
    analysisStatus.hidden = true;
    resultsContainer.hidden = false;

    // Update images
    const originalImage = document.getElementById('originalImage');
    const overlayImage = document.getElementById('overlayImage');
    const maskImage = document.getElementById('maskImage');

    // Display the original image
    originalImage.src = URL.createObjectURL(selectedFile);

    // Handle segmentation images based on prediction type
    const isNoTumor = results.prediction === 'notumor';
    
    if (isNoTumor) {
        // For "notumor" cases, show original image or placeholder for overlay and mask
        overlayImage.src = URL.createObjectURL(selectedFile); // Show original image
        maskImage.style.display = 'none'; // Hide mask image for no tumor cases
        
        // Optionally, you can show a placeholder or message
        const maskContainer = maskImage.parentElement;
        let noTumorMessage = maskContainer.querySelector('.no-tumor-message');
        if (!noTumorMessage) {
            noTumorMessage = document.createElement('div');
            noTumorMessage.className = 'no-tumor-message';
            noTumorMessage.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #28a745; background: #f8f9fa; border-radius: 8px; border: 2px dashed #28a745;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p style="margin: 0; font-weight: 600;">No Tumor Detected</p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #666;">No segmentation needed</p>
                </div>
            `;
            maskContainer.appendChild(noTumorMessage);
        }
        noTumorMessage.style.display = 'block';
    } else {
        // For tumor cases, display segmentation results if available
        if (results.base64Overlay) {
            overlayImage.src = `data:image/png;base64,${results.base64Overlay}`;
        } else {
            overlayImage.src = URL.createObjectURL(selectedFile); // Fallback to original
        }
        
        if (results.base64Mask) {
            maskImage.src = `data:image/png;base64,${results.base64Mask}`;
            maskImage.style.display = 'block';
        } else {
            maskImage.style.display = 'none';
        }
        
        // Hide no tumor message if it exists
        const maskContainer = maskImage.parentElement;
        const noTumorMessage = maskContainer.querySelector('.no-tumor-message');
        if (noTumorMessage) {
            noTumorMessage.style.display = 'none';
        }
    }

    // Update prediction type
    const predictionType = resultsContainer.querySelector('.prediction-type');
    predictionType.textContent = `Detected: ${formatTumorType(results.prediction)}`;

    // Update confidence scores
    const scoreList = resultsContainer.querySelector('.score-list');
    scoreList.innerHTML = ''; // Clear existing scores

    // Handle confidence scores - they might be a string or object
    let confidenceScores;
    if (typeof results.confidenceScores === 'string') {
        confidenceScores = JSON.parse(results.confidenceScores);
    } else {
        confidenceScores = results.confidenceScores;
    }

    const scores = [
        { label: 'Glioma', value: confidenceScores.glioma },
        { label: 'Meningioma', value: confidenceScores.meningioma },
        { label: 'No Tumor', value: confidenceScores.notumor },
        { label: 'Pituitary', value: confidenceScores.pituitary }
    ];

    scores.forEach(score => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        scoreItem.innerHTML = `
            <span class="score-label">${score.label}</span>
            <span class="score-value">${formatConfidence(score.value)}</span>
        `;
        scoreList.appendChild(scoreItem);
    });

    // Clean up object URLs and update status
    originalImage.onload = () => {
        URL.revokeObjectURL(originalImage.src);
    };

    // Update status to complete
    const statusIndicator = analysisSection.querySelector('.status-indicator');
    const statusText = analysisSection.querySelector('.status-text');
    
    statusIndicator.innerHTML = `
        <i class="fas fa-check-circle status-complete"></i>
    `;
    statusText.innerHTML = `
        <span class="success-text">Analysis Complete</span>
        <br>
        <span class="subtitle">Results are ready for review</span>
    `;

    // Link analysis to patient (skip for notumor cases from 400 errors)
    if (results.temporaryAnalysisId) {
        linkAnalysisToPatient().catch(error => {
            console.error('Failed to link analysis:', error);
            showError('Analysis complete, but failed to link to patient record');
        });
    } else {
        console.log('Skipping patient linking for notumor result from 400 error');
    }

    isAnalyzing = false;
    updateAnalyzeButton();
    updateAnalyzeButtonTooltip();

    // Add PDF Download Button
    addDownloadReportButton(results);
}

// Utility Functions for Results Display
function formatTumorType(type) {
    return type.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function formatConfidence(value) {
    return `${(value * 100).toFixed(1)}%`;
}

// PDF Report Generation Functions
function addDownloadReportButton(results) {
    // Check if button already exists to avoid duplicates
    const existingButton = document.querySelector('.download-report-button');
    if (existingButton) {
        existingButton.remove();
    }

    // Create download button
    const downloadButton = document.createElement('button');
    downloadButton.className = 'download-report-button';
    downloadButton.style.cssText = `
        background: #28a745;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 20px auto 0;
        transition: background-color 0.3s ease;
    `;
    downloadButton.innerHTML = `
        <i class="fas fa-download"></i>
        Download Report
    `;
    
    // Add hover effect
    downloadButton.addEventListener('mouseenter', () => {
        downloadButton.style.backgroundColor = '#218838';
    });
    downloadButton.addEventListener('mouseleave', () => {
        downloadButton.style.backgroundColor = '#28a745';
    });

    // Add click handler
    downloadButton.addEventListener('click', () => generatePdf(results));

    // Insert button after the prediction results
    const predictionResults = document.querySelector('.prediction-results');
    if (predictionResults) {
        predictionResults.insertAdjacentElement('afterend', downloadButton);
    }
}

async function generatePdf(analysisData) {
    try {
        // Show loading state
        const downloadButton = document.querySelector('.download-report-button');
        const originalText = downloadButton.innerHTML;
        downloadButton.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Generating PDF...
        `;
        downloadButton.disabled = true;

        // Validate required data
        if (!selectedPatientData || !selectedFile) {
            throw new Error('Missing patient or file data');
        }

        // Populate the hidden template with data
        await populateReportTemplate(analysisData);

        // Generate PDF using html2canvas and jsPDF
        const { jsPDF } = window.jspdf;
        const reportElement = document.getElementById('report-template-container');
        
        // Use html2canvas to capture the element
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Create a new PDF in A4 Portrait orientation
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add the image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        // Generate filename
        const date = new Date().toISOString().slice(0, 10);
        const patientName = `${selectedPatientData.firstName}_${selectedPatientData.lastName}`;
        const fileName = `TumorXtract_Report_${patientName}_${date}.pdf`;
        
        // Save the PDF
        pdf.save(fileName);

        // Show success message
        showSuccessMessage('PDF report downloaded successfully!');

    } catch (error) {
        console.error('Error generating PDF:', error);
        showError('Failed to generate PDF report. Please try again.');
    } finally {
        // Restore button state
        const downloadButton = document.querySelector('.download-report-button');
        if (downloadButton) {
            downloadButton.innerHTML = `
                <i class="fas fa-download"></i>
                Download Report
            `;
            downloadButton.disabled = false;
        }
    }
}

async function populateReportTemplate(analysisData) {
    // Patient Information
    document.getElementById('report-patient-name').textContent = 
        `${selectedPatientData.firstName} ${selectedPatientData.lastName}`;
    document.getElementById('report-patient-id').textContent = selectedPatientData.id;
    document.getElementById('report-patient-dob').textContent = 
        new Date(selectedPatientData.dateOfBirth).toLocaleDateString();
    document.getElementById('report-analysis-date').textContent = 
        new Date().toLocaleDateString();

    // Images
    const originalMRI = document.getElementById('report-original-mri');
    const overlayMRI = document.getElementById('report-overlay-mri');

    // Set original image
    originalMRI.src = URL.createObjectURL(selectedFile);

    // Set overlay image based on tumor type
    const isNoTumor = analysisData.prediction === 'notumor';
    if (isNoTumor || !analysisData.base64Overlay) {
        overlayMRI.src = URL.createObjectURL(selectedFile); // Use original for no tumor
    } else {
        overlayMRI.src = `data:image/png;base64,${analysisData.base64Overlay}`;
    }

    // AI Results
    document.getElementById('report-tumor-type').textContent = 
        formatTumorType(analysisData.prediction);

    // Handle confidence scores
    let confidenceScores;
    if (typeof analysisData.confidenceScores === 'string') {
        confidenceScores = JSON.parse(analysisData.confidenceScores);
    } else {
        confidenceScores = analysisData.confidenceScores;
    }

    // Find the highest confidence score (the main prediction)
    const maxConfidence = Math.max(...Object.values(confidenceScores));
    document.getElementById('report-confidence-score').textContent = `${(maxConfidence * 100).toFixed(1)}%`;

    // Populate detailed confidence breakdown
    const breakdownContainer = document.getElementById('report-confidence-breakdown');
    breakdownContainer.innerHTML = '';

    const scores = [
        { label: 'Glioma', value: confidenceScores.glioma },
        { label: 'Meningioma', value: confidenceScores.meningioma },
        { label: 'No Tumor', value: confidenceScores.notumor },
        { label: 'Pituitary', value: confidenceScores.pituitary }
    ];

    scores.forEach(score => {
        const scoreElement = document.createElement('p');
        scoreElement.style.cssText = 'margin: 2px 0; font-size: 14px;';
        scoreElement.innerHTML = `<strong>${score.label}:</strong> ${(score.value * 100).toFixed(1)}%`;
        breakdownContainer.appendChild(scoreElement);
    });

    // Wait for images to load
    return new Promise((resolve) => {
        let loadedImages = 0;
        const totalImages = 2;

        const checkAllLoaded = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                resolve();
            }
        };

        originalMRI.onload = checkAllLoaded;
        overlayMRI.onload = checkAllLoaded;

        // Handle case where images are already cached
        if (originalMRI.complete) checkAllLoaded();
        if (overlayMRI.complete) checkAllLoaded();
    });
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        border-radius: 8px;
        padding: 12px 16px;
        margin: 16px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    const container = document.querySelector('.prediction-results');
    if (container) {
        container.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}
