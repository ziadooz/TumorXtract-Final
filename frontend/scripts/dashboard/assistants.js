// Assistant Management JavaScript

class AssistantManager {
    constructor() {
        this.assistants = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.isEditing = false;
        this.currentEditId = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAssistants();
    }

    bindEvents() {
        // Form controls
        document.getElementById('addAssistantBtn').addEventListener('click', () => this.showForm());
        document.getElementById('closeFormBtn').addEventListener('click', () => this.hideForm());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());
        document.getElementById('assistantForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Search functionality
        document.getElementById('searchAssistants').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Close form when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('assistant-form-container')) {
                this.hideForm();
            }
        });
    }

    async loadAssistants() {
        try {
            console.log('Loading assistants from API...');
            
            // Get auth token
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error('No auth token found');
                this.showError('Authentication required. Please log in.');
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/api/Assistants`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.showError('Session expired. Please log in again.');
                    // Redirect to login
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.assistants = await response.json();
            console.log('Loaded assistants:', this.assistants);
            
            this.renderAssistants();
            this.updatePagination();

        } catch (error) {
            console.error('Error loading assistants:', error);
            this.showError('Failed to load assistants. Please try again.');
            
            // Show empty state with error message
            this.renderEmptyState('Failed to load assistants');
        }
    }

    renderAssistants() {
        const tbody = document.querySelector('.assistants-table tbody');
        
        if (!this.assistants || this.assistants.length === 0) {
            this.renderEmptyState();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const assistantsToShow = this.assistants.slice(startIndex, endIndex);

        tbody.innerHTML = assistantsToShow.map(assistant => `
            <tr>
                <td>${this.escapeHtml(assistant.displayName || 'N/A')}</td>
                <td>${this.escapeHtml(assistant.email || 'N/A')}</td>
                <td>${this.escapeHtml(assistant.addressClinic || 'N/A')}</td>
                <td>
                    <div class="permission-tags">
                        ${this.renderPermissionTags(assistant)}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="assistantManager.editAssistant('${assistant.id}')">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="assistantManager.deleteAssistant('${assistant.id}')">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPermissionTags(assistant) {
        const permissions = [];
        
        if (assistant.canReadPatients) permissions.push('Read');
        if (assistant.canCreatePatients) permissions.push('Create');
        if (assistant.canUpdatePatients) permissions.push('Update');
        if (assistant.canDeletePatients) permissions.push('Delete');

        if (permissions.length === 0) {
            return '<span class="permission-tag">No Permissions</span>';
        }

        return permissions.map(permission => 
            `<span class="permission-tag">${permission}</span>`
        ).join('');
    }

    renderEmptyState(message = 'No assistants found') {
        const tbody = document.querySelector('.assistants-table tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-user-nurse"></i>
                    <h3>${message}</h3>
                    <p>Click "Add New Assistant" to create your first assistant account.</p>
                </td>
            </tr>
        `;
    }

    showForm(assistant = null) {
        const container = document.getElementById('assistantFormContainer');
        const form = document.getElementById('assistantForm');
        const title = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');

        // Reset form
        form.reset();

        if (assistant) {
            // Editing mode
            this.isEditing = true;
            this.currentEditId = assistant.id;
            title.textContent = 'Edit Assistant';
            submitBtn.textContent = 'Update Assistant';

            // Populate form fields
            document.getElementById('displayName').value = assistant.displayName || '';
            document.getElementById('email').value = assistant.email || '';
            document.getElementById('addressClinic').value = assistant.addressClinic || '';
            
            // Hide password field in edit mode
            const passwordGroup = document.getElementById('password').closest('.form-group');
            passwordGroup.style.display = 'none';

            // Set permissions
            document.getElementById('canReadPatients').checked = assistant.canReadPatients || false;
            document.getElementById('canCreatePatients').checked = assistant.canCreatePatients || false;
            document.getElementById('canUpdatePatients').checked = assistant.canUpdatePatients || false;
            document.getElementById('canDeletePatients').checked = assistant.canDeletePatients || false;
        } else {
            // Creating mode
            this.isEditing = false;
            this.currentEditId = null;
            title.textContent = 'Create New Assistant';
            submitBtn.textContent = 'Create Assistant';

            // Show password field in create mode
            const passwordGroup = document.getElementById('password').closest('.form-group');
            passwordGroup.style.display = 'flex';
        }

        container.style.display = 'block';
        document.getElementById('displayName').focus();
    }

    hideForm() {
        const container = document.getElementById('assistantFormContainer');
        container.style.display = 'none';
        this.isEditing = false;
        this.currentEditId = null;
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const assistantData = {
            displayName: formData.get('displayName'),
            email: formData.get('email'),
            addressClinic: formData.get('addressClinic'),
            canReadPatients: formData.has('canReadPatients'),
            canCreatePatients: formData.has('canCreatePatients'),
            canUpdatePatients: formData.has('canUpdatePatients'),
            canDeletePatients: formData.has('canDeletePatients')
        };

        // Add password only for new assistants
        if (!this.isEditing) {
            assistantData.password = formData.get('password');
        }

        try {
            const token = localStorage.getItem('authToken');
            let url = `${API_CONFIG.BASE_URL}/api/Assistants`;
            let method = 'POST';

            if (this.isEditing) {
                url += `/${this.currentEditId}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(assistantData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showSuccess(this.isEditing ? 'Assistant updated successfully!' : 'Assistant created successfully!');
            this.hideForm();
            await this.loadAssistants();

        } catch (error) {
            console.error('Error saving assistant:', error);
            this.showError(this.isEditing ? 'Failed to update assistant.' : 'Failed to create assistant.');
        }
    }

    async editAssistant(id) {
        const assistant = this.assistants.find(a => a.id === id);
        if (assistant) {
            this.showForm(assistant);
        }
    }

    async deleteAssistant(id) {
        const assistant = this.assistants.find(a => a.id === id);
        if (!assistant) return;

        if (!confirm(`Are you sure you want to delete assistant "${assistant.displayName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/Assistants/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showSuccess('Assistant deleted successfully!');
            await this.loadAssistants();

        } catch (error) {
            console.error('Error deleting assistant:', error);
            this.showError('Failed to delete assistant.');
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.renderAssistants();
            return;
        }

        const filteredAssistants = this.assistants.filter(assistant => 
            assistant.displayName?.toLowerCase().includes(query.toLowerCase()) ||
            assistant.email?.toLowerCase().includes(query.toLowerCase()) ||
            assistant.addressClinic?.toLowerCase().includes(query.toLowerCase())
        );

        // Temporarily store filtered results
        const originalAssistants = this.assistants;
        this.assistants = filteredAssistants;
        this.renderAssistants();
        this.assistants = originalAssistants;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.assistants.length / this.itemsPerPage);
        const pageInfo = document.querySelector('.page-info');
        
        const startItem = ((this.currentPage - 1) * this.itemsPerPage) + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.assistants.length);
        
        pageInfo.innerHTML = `Showing <span>${startItem}-${endItem}</span> of <span>${this.assistants.length}</span> assistants`;
    }

    showSuccess(message) {
        // Create or update notification
        this.showNotification(message, 'success');
    }

    showError(message) {
        // Create or update notification
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 8px;
            padding: 1rem;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        // Add to document
        document.body.appendChild(notification);

        // Add event listener for close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        margin-left: auto;
        padding: 0 0.25rem;
        color: inherit;
    }
`;
document.head.appendChild(notificationStyles);

// Initialize when DOM is loaded
let assistantManager;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!AuthUtils.isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Check if user is a doctor (only doctors can manage assistants)
    const userRole = AuthUtils.getUserRole();
    if (userRole !== 'Doctor') {
        document.querySelector('.assistants-content').innerHTML = `
            <div class="access-denied">
                <i class="fas fa-lock" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <h2>Access Denied</h2>
                <p>Only doctors can manage assistant accounts.</p>
                <button onclick="window.location.href='index.html'" class="btn btn-primary">
                    Go to Dashboard
                </button>
            </div>
        `;
        return;
    }

    assistantManager = new AssistantManager();
    console.log('Assistant manager initialized');
});
