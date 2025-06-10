// Check authentication first
if (!authUtils.requireAuth()) {
    // requireAuth will redirect to login if not authenticated
    throw new Error('Authentication required');
}

// DOM Elements
const searchInput = document.getElementById('searchPatients');
const patientsTable = document.querySelector('.patients-table tbody');
const pagination = document.querySelector('.pagination');
const pageInfo = document.querySelector('.page-info');


// Modal Elements (will be initialized after DOM load)
let modal, modalOverlay, closeModalBtn, modalEditBtn, tabButtons, tabPanes;
let modalAvatar, modalName, modalId, modalDateOfBirth, modalGender;
let modalSymptoms, modalMedicalHistory, modalLastVisit, modalPhone, modalEmail, modalAddress;
// Analysis Info Elements (new tab)
let modalTumorType, modalConfidenceScore;
// MRI Image Elements
let modalMriImagesContainer, modalOriginalMri, modalMaskMri, noMriMessage;

// State Management
let currentPatient = null;
let isModalLoading = false;
let activeTabId = 'personal';
let currentPage = 1;
let pageSize = 5; // Default page size, can be adjusted based on API response or preference
let totalPatients = 0;


// Validate modal elements are ready
function validateModalElements() {
    if (!modal) {
        throw new Error('Modal container not initialized');
    }

    const requiredElements = {
        modalAvatar: 'Patient avatar',
        modalName: 'Patient name',
        modalId: 'Patient ID',
        modalDateOfBirth: 'Date of birth',
        modalGender: 'Gender',
        modalTumorType: 'Tumor type',
        modalConfidenceScore: 'Confidence score',
        modalSymptoms: 'Symptoms',
        modalMedicalHistory: 'Medical history',
        modalLastVisit: 'Last visit',
        modalPhone: 'Phone',
        modalEmail: 'Email',
        modalAddress: 'Address'
    };

    const missingElements = Object.entries(requiredElements)
        .filter(([key]) => !eval(key))
        .map(([, label]) => label);

    if (missingElements.length > 0) {
        throw new Error(`Missing modal elements: ${missingElements.join(', ')}`);
    }

    return true;
}

// Initialize Modal Elements
function initializeModalElements() {
    return new Promise((resolve, reject) => {
        try {
            modal = document.getElementById('patientModal');
            if (!modal) throw new Error('Modal element not found');

            modalOverlay = modal.querySelector('.modal-overlay');
            closeModalBtn = document.getElementById('closeModal');
            modalEditBtn = document.getElementById('modalEditButton');
            tabButtons = document.querySelectorAll('.tab-btn');
            tabPanes = document.querySelectorAll('.tab-pane');

            // Modal Content Elements
            modalAvatar = modal.querySelector('.patient-modal-avatar');
            modalName = modal.querySelector('.patient-modal-name');
            modalId = modal.querySelector('.patient-modal-id');
            modalDateOfBirth = document.getElementById('modalDateOfBirth');
            modalGender = document.getElementById('modalGender');
            modalTumorType = document.getElementById('modalTumorType');
            modalConfidenceScore = document.getElementById('modalConfidenceScore');
            modalSymptoms = document.getElementById('modalSymptoms');
            modalMedicalHistory = document.getElementById('modalMedicalHistory');
            modalLastVisit = document.getElementById('modalLastVisit');
            modalPhone = document.getElementById('modalPhone');
            modalEmail = document.getElementById('modalEmail');
            modalAddress = document.getElementById('modalAddress');

            // MRI Image Elements
            modalMriImagesContainer = modal.querySelector('.mri-images-container');
            modalOriginalMri = document.getElementById('modalOriginalMri');
            modalMaskMri = document.getElementById('modalMaskMri');
            noMriMessage = document.getElementById('noMriMessage');

            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

// Tab Management
function switchTab(tabId) {
    if (isModalLoading || activeTabId === tabId) return;

    activeTabId = tabId;

    // Update tab buttons
    tabButtons.forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    // Update tab panes
    tabPanes.forEach(pane => {
        const isActive = pane.id === tabId;
        if (isActive) {
            pane.classList.add('active');
            pane.setAttribute('aria-hidden', 'false');
            pane.style.display = 'block';
            requestAnimationFrame(() => {
                pane.style.opacity = '1';
                pane.style.visibility = 'visible';
                pane.style.transform = 'translateX(0)';
            });
        } else {
            pane.style.opacity = '0';
            pane.style.visibility = 'hidden';
            pane.style.transform = 'translateX(20px)';
            setTimeout(() => {
                if (!pane.classList.contains('active')) {
                    pane.style.display = 'none';
                }
            }, 300);
            pane.classList.remove('active');
            pane.setAttribute('aria-hidden', 'true');
        }
    });
}

function resetTabs() {
    activeTabId = 'personal';
    tabButtons.forEach(btn => {
        const isActive = btn.dataset.tab === activeTabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });
    tabPanes.forEach(pane => {
        const isActive = pane.id === activeTabId;
        pane.classList.toggle('active', isActive);
        pane.setAttribute('aria-hidden', !isActive);
        if (isActive) {
            pane.style.display = 'block';
            pane.style.opacity = '1';
            pane.style.visibility = 'visible';
            pane.style.transform = 'translateX(0)';
        } else {
            pane.style.display = 'none';
            pane.style.opacity = '0';
            pane.style.visibility = 'hidden';
            pane.style.transform = 'translateX(20px)';
        }
    });
}

// Modal State Management
function showModal() {
    if (!modal) return;
    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
    
    requestAnimationFrame(() => {
        modal.querySelector('.modal-content').style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    });
}

function hideModal() {
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    content.style.opacity = '0';
    content.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetTabs();
        currentPatient = null;
    }, 300);
}

function setModalLoading(loading) {
    isModalLoading = loading;
    if (loading) {
        modal.classList.add('modal-loading');
    } else {
        modal.classList.remove('modal-loading');
    }
}

// Setup Modal Event Listeners
function setupModalListeners() {
    if (!modal) return;

    // Close button
    closeModalBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal();
    });

    // Overlay click
    modalOverlay?.addEventListener('click', hideModal);

    // Tab Functionality
    tabButtons?.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchTab(tabId);
        });
    });

    // Prevent modal close when clicking content
    modal.querySelector('.modal-content')?.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // ESC key handling
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            hideModal();
        }
    });
}

// Patient Data Management
async function viewPatient(id) {
    try {
        // Validate modal elements before proceeding
        validateModalElements();
        
        if (isModalLoading) return;
        setModalLoading(true);
        showModal();

        console.log('Loading patient data:', { id });

        // Fetch patient data from API
        const patient = await apiCall(`${API_CONFIG.ENDPOINTS.GET_PATIENT_BY_ID}/${id}`);
        if (!patient) {
            throw new Error('Patient not found');
        }

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone'];
        const missingFields = requiredFields.filter(field => !patient[field]);
        if (missingFields.length > 0) {
            throw new Error(`Patient data incomplete: missing ${missingFields.join(', ')}`);
        }

        console.log('Patient found:', { id: patient.id, name: `${patient.firstName} ${patient.lastName}` });
        currentPatient = patient;

        try {
            // Sequential data population
            await Promise.all([
                updatePatientBasicInfo(patient),
                updatePatientAnalysisInfo(patient),
                updatePatientMedicalInfo(patient),
                updatePatientContactInfo(patient)
            ]);

            // Setup edit button
            modalEditBtn.onclick = () => editPatient(id);
            resetTabs();
            console.log('Patient data loaded successfully');

        } catch (updateError) {
            throw new Error(`Error updating modal: ${updateError.message}`);
        }

    } catch (error) {
        console.error('Error displaying patient data:', error);
        alert(`Unable to display patient details: ${error.message}`);
        hideModal();
    } finally {
        setModalLoading(false);
    }
}

// Update Modal Sections
function updatePatientBasicInfo(patient) {
    // Use a default avatar if none provided
    modalAvatar.src = patient.avatar || 'assets/images/team/image 2.png';
    modalAvatar.onerror = () => {
        modalAvatar.src = 'assets/images/team/image 2.png';
    };
    
    modalName.textContent = `${patient.firstName} ${patient.lastName}`;
    modalId.textContent = `#${patient.id}`;
    modalDateOfBirth.textContent = formatDate(patient.dateOfBirth);
    modalGender.textContent = patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1);
}

function updatePatientAnalysisInfo(patient) {
    // Update analysis data (tumor type and confidence score)
    if (patient.analysis) {
        modalTumorType.textContent = patient.analysis.tumorType ? 
            patient.analysis.tumorType.charAt(0).toUpperCase() + patient.analysis.tumorType.slice(1) : 
            'Not specified';
        modalConfidenceScore.textContent = patient.analysis.confidence ? 
            `${(patient.analysis.confidence * 100).toFixed(2)}%` : 
            'Not available';
    } else {
        modalTumorType.textContent = 'Not specified';
        modalConfidenceScore.textContent = 'Not available';
    }

    // Display MRI Images (Original and Mask only)
    if (patient.analysis && patient.analysis.originalMriImagePath) {
        modalMriImagesContainer.style.display = 'block';
        noMriMessage.style.display = 'none';

        // Set original MRI image
        modalOriginalMri.src = patient.analysis.originalMriImagePath;
        modalOriginalMri.onerror = () => {
            modalOriginalMri.src = 'assets/images/team/image 2.png'; // Default fallback
        };

        // Set mask image (prefer maskImagePath over overlayImagePath)
        modalMaskMri.src = patient.analysis.maskImagePath || patient.analysis.overlayImagePath || patient.analysis.originalMriImagePath;
        modalMaskMri.onerror = () => {
            modalMaskMri.src = 'assets/images/team/image 2.png'; // Default fallback
        };

    } else {
        modalMriImagesContainer.style.display = 'none';
        noMriMessage.style.display = 'block';
    }
}

function updatePatientMedicalInfo(patient) {
    modalSymptoms.textContent = patient.primarySymptoms || 'None reported';
    modalMedicalHistory.textContent = patient.medicalHistory || 'No history available';
    modalLastVisit.textContent = formatDate(patient.lastVist);
}

function updatePatientContactInfo(patient) {
    modalPhone.textContent = patient.phone;
    modalEmail.textContent = patient.email;
    
    // Format address from address object
    if (patient.address) {
        const addressParts = [
            patient.address.street,
            patient.address.city,
            patient.address.state,
            patient.address.country
        ].filter(Boolean);
        
        modalAddress.textContent = addressParts.length ? addressParts.join(', ') : 'No address provided';
    } else {
        modalAddress.textContent = 'No address provided';
    }
}

// Navigation Functions
function editPatient(id) {
    if (isModalLoading) return;
    window.location.href = `add-patient.html?id=${id}`;
}

async function deletePatient(id) {
    if (isModalLoading) return;
    
    try {
        // Get patient details before deletion
        const patient = await apiCall(`${API_CONFIG.ENDPOINTS.GET_PATIENT_BY_ID}/${id}`);
        
        // Ask for confirmation with patient details
        const confirmMessage = `Are you sure you want to delete patient:\n\n` +
            `${patient.firstName} ${patient.lastName}\n` +
            `ID: ${patient.id}\n\n` +
            `This action cannot be undone.`;

        if (confirm(confirmMessage)) {
            console.log('Deleting patient:', { id });
            await apiCall(`${API_CONFIG.ENDPOINTS.DELETE_PATIENT}/${id}`, { method: 'DELETE' });
            
            // Refresh the patient list, staying on the current page and search term
            // If the current page becomes empty after deletion and it's not the first page,
            // ideally, we'd go to the previous page. This is a simpler reload for now.
            await loadPatients(currentPage, pageSize, searchInput.value.trim());
            
            hideModal();
            alert('Patient deleted successfully');
        }

    } catch (error) {
        console.error('Error deleting patient:', error);
        alert(`Unable to delete patient: ${error.message}`);
    }
}

// Search & Filter
searchInput?.addEventListener('input', debounce(async () => {
    const searchTerm = searchInput.value.trim();
    currentPage = 1; // Reset to first page for new search
    loadPatients(currentPage, pageSize, searchTerm);
}, 300));

// Load Patients
async function loadPatients(page = 1, size = 5, searchTerm = '') {
    try {
        const loadingOverlay = document.getElementById('pageLoadingOverlay');
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';


        let endpoint = `${API_CONFIG.ENDPOINTS.GET_PATIENTS}?PageIndex=${page}&PageSize=${size}`;
        if (searchTerm) {
            endpoint += `&Search=${encodeURIComponent(searchTerm)}`;
        }

        const responseData = await apiCall(endpoint);
        const patientList = responseData.data || [];
        totalPatients = responseData.count || 0;
        currentPage = responseData.pageIndex || page; // Use API's pageIndex if available
        pageSize = responseData.pageSize || size; // Use API's pageSize if available


        renderPatients(patientList);
        updatePageInfo(); 
        renderPaginationControls(); 

    } catch (error) {
        console.error('Error loading patients:', error);
        alert('Error loading patient data. Please try again.');
        renderPatients([]);
    } finally {
        const loadingOverlay = document.getElementById('pageLoadingOverlay');
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
}

// Table Rendering
function renderPatients(patients) {
    if (!patients || !Array.isArray(patients) || !patientsTable) return;

    patientsTable.innerHTML = patients.map(patient => `
        <tr>
            <td class="patient-name">
                <img src="${patient.avatar || 'assets/images/team/image 2.png'}" 
                     alt="Patient" 
                     class="patient-avatar"
                     onerror="this.src='assets/images/team/image 2.png'">
                <div class="patient-info">
                    <span class="name">${patient.firstName} ${patient.lastName}</span>
                    <span class="id">#${patient.id}</span>
                </div>
            </td>
            <td>${formatDate(patient.dateOfBirth)}</td>
            <td>${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</td>
            <td>
                <div class="contact-info">
                    <span>${patient.phone}</span>
                    <span>${patient.email}</span>
                </div>
            </td>
            <td>${patient.analysis?.tumorType ? 
                 (patient.analysis.tumorType.charAt(0).toUpperCase() + patient.analysis.tumorType.slice(1)) : 
                 'Not specified'}</td>
            <td>${formatDate(patient.lastVist)}</td>
            <td class="actions">
                <button class="action-btn view" title="View Details" onclick="viewPatient('${patient.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" title="Edit" onclick="editPatient('${patient.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" title="Delete" onclick="deletePatient('${patient.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Utility Functions
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Date format error:', e);
        return dateStr;
    }
}

function updatePageInfo() {
    if (!pageInfo || totalPatients === 0) {
        pageInfo.innerHTML = 'No patients found';
        return;
    }

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalPatients);

    pageInfo.innerHTML = `Showing <span>${startItem}-${endItem}</span> of <span>${totalPatients}</span> patients`;
}

// Render Pagination Controls
function renderPaginationControls() {
    if (!pagination || !totalPatients) {
        if(pagination) pagination.innerHTML = ''; // Clear if no patients
        return;
    }

    pagination.innerHTML = ''; // Clear existing controls
    const totalPages = Math.ceil(totalPatients / pageSize);

    if (totalPages <= 1) {
        return; // No pagination needed for single page
    }

    const ul = document.createElement('ul');
    ul.className = 'pagination-list';

    // Previous Button
    if (currentPage > 1) {
        const prevLi = document.createElement('li');
        prevLi.className = 'pagination-item prev';
        const prevLink = document.createElement('a');
        prevLink.href = '#';
        prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                loadPatients(currentPage - 1, pageSize, searchInput.value.trim());
            }
        });
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);
    }

    // Page Number Buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = 'pagination-item';
        if (i === currentPage) {
            pageLi.classList.add('active');
        }
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.dataset.page = i;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            const pageNum = parseInt(e.target.dataset.page);
            if (pageNum !== currentPage) {
                loadPatients(pageNum, pageSize, searchInput.value.trim());
            }
        });
        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }

    // Next Button
    if (currentPage < totalPages) {
        const nextLi = document.createElement('li');
        nextLi.className = 'pagination-item next';
        const nextLink = document.createElement('a');
        nextLink.href = '#';
        nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                loadPatients(currentPage + 1, pageSize, searchInput.value.trim());
            }
        });
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);
    }

    pagination.appendChild(ul);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize Page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing patient page...');

        // Initialize modal elements and listeners
        await initializeModalElements();
        setupModalListeners();
        
        // Load initial patient data
        await loadPatients(currentPage, pageSize);

        console.log('Page initialized successfully');

    } catch (error) {
        console.error('Error initializing page:', error);
        alert('Error initializing page. Some features may not work correctly.');
    }
});
