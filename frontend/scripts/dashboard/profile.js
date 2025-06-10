
// DOM Elements
const profileForm = document.getElementById('profileForm');
const profileImage = document.getElementById('profilePreview');
const imageInput = document.getElementById('profileImage');
const cancelButton = document.querySelector('.cancel-button');
const inputs = profileForm.querySelectorAll('input');

// Form State
let isFormChanged = false;
let originalData = {};

// Check Authentication
if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
}

// Initialize Form
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch profile data
        const profile = await apiCall(API_CONFIG.ENDPOINTS.GET_PROFILE);
        
        // Populate form with profile data
        document.getElementById('displayName').value = profile.displayName || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('specialization').value = profile.specialization || '';
        document.getElementById('phoneNumber').value = profile.phoneNumber || '';
        
        // Handle profile image
        profileImage.onerror = () => {
            profileImage.src = 'assets/images/team/image 1.png';
        };
        if (profile.imageUrl) {
            // Ensure imageUrl is in the correct format
            const currentImageUrl = profile.imageUrl.startsWith('/') ? profile.imageUrl : '/images/Doctors/' + profile.imageUrl.split('/').pop();
            profileImage.src = API_CONFIG.BASE_URL + currentImageUrl;
            profileImage.dataset.originalSrc = profileImage.src;
            // Set the hidden input with the correct format
            const imageUrlInput = document.getElementById('imageUrl');
            if (imageUrlInput) {
                imageUrlInput.value = currentImageUrl;
            }
        } else {
            profileImage.src = 'assets/images/team/image 1.png';
        }

        // Store original data for cancellation
        inputs.forEach(input => {
            originalData[input.name] = input.value;
        });

        // Handle image upload
        setupImageUpload();

        // Setup form change detection
        setupFormChangeDetection();

        // Setup form submission
        setupFormSubmission();

        // Setup cancel button
        setupCancelButton();
    } catch (error) {
        showErrorMessage('Failed to load profile data. Please try again later.');
        console.error('Profile load error:', error);
    }
});

// Image Upload Handler
async function setupImageUpload() {
    imageInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showErrorMessage('Please select an image file');
            return;
        }

        try {
            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                profileImage.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Upload to server
            const formData = new FormData();
            formData.append('profileImage', file);

            const uploadResponse = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_PROFILE_IMAGE}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: formData
                }
            );

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }

            const uploadData = await uploadResponse.json();
            console.log('[PROFILE.JS - UPLOAD] Raw response from UPLOAD_IMAGE:', uploadData);
            
            // Update hidden input with new image URL
            const imageUrlInput = document.getElementById('imageUrl');
            if (imageUrlInput) {
                imageUrlInput.value = uploadData.imageUrl;
                console.log('[PROFILE.JS - UPLOAD] Set hidden #imageUrl input to:', imageUrlInput.value);
                // Don't update originalSrc yet since changes aren't saved
                // Just keep the preview showing until save/cancel
            }

            isFormChanged = true;
            updateFormState();

        } catch (error) {
            showErrorMessage('Failed to upload image. Please try again.');
            console.error('Image upload error:', error);
            
            // Revert to original image if exists
            if (profileImage.dataset.originalSrc) {
                profileImage.src = profileImage.dataset.originalSrc;
            }
        }
    });
}

// Form Change Detection
function setupFormChangeDetection() {
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            isFormChanged = true;
            updateFormState();
            
                    // Add active class to input group if it exists
                    const inputGroup = input.closest('.input-group');
                    if (inputGroup) {
                        inputGroup.classList.add('active');
                    }
                });

                input.addEventListener('blur', () => {
                    const inputGroup = input.closest('.input-group');
                    if (inputGroup) {
                        inputGroup.classList.remove('active');
                    }
        });
    });
}

// Form Submission Handler
function setupFormSubmission() {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isFormChanged) return;

        const submitButton = profileForm.querySelector('.save-button');
        submitButton.classList.add('loading');

        try {
            // Validate form
            const { isValid, errors } = validateForm();
            if (!isValid) {
                Object.entries(errors).forEach(([field, message]) => {
                    const input = profileForm.querySelector(`#${field}`);
                    if (input) showErrorMessage(message, input);
                });
                return;
            }

            // Get form data
            const updateData = {
                displayName: profileForm.querySelector('#displayName').value,
                specialization: profileForm.querySelector('#specialization').value,
                phoneNumber: profileForm.querySelector('#phoneNumber').value,
                imageUrl: profileForm.querySelector('#imageUrl')?.value || null
            };

            console.log('[PROFILE.JS - SUBMIT] Data being sent to UPDATE_PROFILE:', JSON.stringify(updateData, null, 2));

            // Update profile
            const updateResponse = await apiCall(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
                method: 'PUT',
                body: JSON.stringify({
                    displayName: profileForm.querySelector('#displayName').value,
                    specialization: profileForm.querySelector('#specialization').value,
                    phoneNumber: profileForm.querySelector('#phoneNumber').value,
                    imageUrl: "/images/Doctors/" + profileForm.querySelector('#imageUrl')?.value.split('/').pop() // Make it match Postman format
                })
            });
            console.log('[PROFILE.JS - SUBMIT] Response from UPDATE_PROFILE:', updateResponse);

            // Update original data and image state
            inputs.forEach(input => {
                originalData[input.name] = input.value;
            });

            // Update profile image source after successful save
            // Since backend isn't returning imageUrl, use the one we sent
            const sentImageUrl = "/images/Doctors/" + profileForm.querySelector('#imageUrl')?.value.split('/').pop();
            if (sentImageUrl) {
                const newImageUrl = API_CONFIG.BASE_URL + sentImageUrl;
                profileImage.src = newImageUrl; // Update visible image
                profileImage.dataset.originalSrc = newImageUrl; // Update stored original
                // Also update the hidden input to match new format
                const imageUrlInput = document.getElementById('imageUrl');
                if (imageUrlInput) {
                    imageUrlInput.value = sentImageUrl;
                }
            } else {
                const defaultImage = 'assets/images/team/image 1.png';
                profileImage.src = defaultImage;
                profileImage.dataset.originalSrc = defaultImage;
            }

            // Update local storage with new display name
            localStorage.setItem('userDisplayName', updateData.displayName);

            // Show success message
            showSuccessMessage('Profile updated successfully');

            // Refresh user menu in header to show new image
            if (typeof window.updateUserMenu === 'function') {
                window.updateUserMenu();
            }

            // Reset form state
            isFormChanged = false;
            updateFormState();

        } catch (error) {
            showErrorMessage('Failed to update profile. Please try again.');
            console.error('Profile update error:', error);
        } finally {
            submitButton.classList.remove('loading');
        }
    });
}

// Cancel Button Handler
function setupCancelButton() {
    cancelButton?.addEventListener('click', () => {
        if (!isFormChanged || confirm('Are you sure you want to discard changes?')) {
            // Reset form to original values
            inputs.forEach(input => {
                input.value = originalData[input.name];
            });
            
            // Reset profile image if changed
            if (profileImage.dataset.originalSrc) {
                profileImage.src = profileImage.dataset.originalSrc;
            }

            isFormChanged = false;
            updateFormState();

            // Remove any error states
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        }
    });
}

// Form State Updates
function updateFormState() {
    const submitButton = profileForm.querySelector('.save-button');
    submitButton.disabled = !isFormChanged;
    
    if (isFormChanged) {
        window.onbeforeunload = () => true;
    } else {
        window.onbeforeunload = null;
    }
}

// Message Handlers
function showSuccessMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'success-message';
    messageElement.textContent = message;
    document.body.appendChild(messageElement);

    // Remove message after animation
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'error-message';
    messageElement.textContent = message;
    profileForm.insertBefore(messageElement, profileForm.firstChild);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Form Validation
function validateForm() {
    let isValid = true;
    const errors = {};

    // Name validation
    const nameInput = profileForm.querySelector('#displayName');
    if (nameInput && !nameInput.value.trim()) {
        errors.displayName = 'Name is required';
        isValid = false;
    }

    // Email validation
    const emailInput = profileForm.querySelector('#email');
    if (emailInput && !emailInput.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
    }

    // Phone validation
    const phoneInput = profileForm.querySelector('#phoneNumber');
    if (phoneInput && !phoneInput.value.match(/^01[0125][0-9]{8}$/)) {
        errors.phoneNumber = 'Please enter a valid Egyptian phone number';
        isValid = false;
    }

    // Specialization validation
    const specializationInput = profileForm.querySelector('#specialization');
    if (specializationInput && !specializationInput.value) {
        errors.specialization = 'Please select your specialization';
        isValid = false;
    }

    return { isValid, errors };
}

// Clean up on page unload
window.addEventListener('unload', () => {
    window.onbeforeunload = null;
});
