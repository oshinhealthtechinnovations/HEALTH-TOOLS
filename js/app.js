/**
 * Nutrislims Health Camp Screening Tool - Main Application Router & Controller
 */

const App = {
  currentTab: 'dashboard',

  init() {
    DatabaseManager.init();
    this.bindNavigation();
    this.bindAdminEvents();

    // Default tab
    this.switchTab('dashboard');

    // Init lucide icons if loaded
    if (window.lucide) {
      window.lucide.createIcons();
    }

    console.log('Nutrislims Health Camp Screening Tool initialized successfully.');
  },

  bindNavigation() {
    const navLinks = document.querySelectorAll('.nav-tab-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        if (tab === 'assessment') {
          AssessmentModule.startNewAssessment();
        } else if (tab) {
          this.switchTab(tab);
        }
      });
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Hide all view sections
    const views = document.querySelectorAll('.view-section');
    views.forEach(v => v.style.display = 'none');

    // Show target view
    const target = document.getElementById(`view-${tabId}`);
    if (target) {
      target.style.display = 'block';
    }

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-tab-link');
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-tab') === tabId);
    });

    // Refresh view specific modules
    if (tabId === 'dashboard') {
      DashboardModule.init();
    } else if (tabId === 'patients') {
      PatientsModule.init();
    } else if (tabId === 'assessment') {
      AssessmentModule.init();
    } else if (tabId === 'admin') {
      this.loadAdminSettings();
    }

    // Re-trigger lucide icons
    if (window.lucide) window.lucide.createIcons();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  viewPatientReport(patientId) {
    ReportModule.renderReport(patientId);
    this.switchTab('report');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type} animate-fade-in`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle-2';
    if (type === 'warning') icon = 'alert-triangle';
    if (type === 'danger') icon = 'alert-circle';

    toast.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="lucide-${icon}"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white ms-auto" onclick="this.parentElement.remove()"></button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  bindAdminEvents() {
    // Camp Settings Form
    const settingsForm = document.getElementById('camp-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const settings = {
          campName: document.getElementById('setting-camp-name').value,
          location: document.getElementById('setting-camp-location').value,
          dietitianName: document.getElementById('setting-dietitian').value,
          contactPhone: document.getElementById('setting-contact').value,
          campDate: document.getElementById('setting-date').value
        };
        DatabaseManager.saveCampSettings(settings);
        this.showToast('Camp settings saved successfully.', 'success');
      });
    }
  },

  loadAdminSettings() {
    const settings = DatabaseManager.getCampSettings();
    if (document.getElementById('setting-camp-name')) document.getElementById('setting-camp-name').value = settings.campName || '';
    if (document.getElementById('setting-camp-location')) document.getElementById('setting-camp-location').value = settings.location || '';
    if (document.getElementById('setting-dietitian')) document.getElementById('setting-dietitian').value = settings.dietitianName || '';
    if (document.getElementById('setting-contact')) document.getElementById('setting-contact').value = settings.contactPhone || '';
    if (document.getElementById('setting-date')) document.getElementById('setting-date').value = settings.campDate || '';

    // Update total count on admin panel
    const count = DatabaseManager.getAllPatients().length;
    if (document.getElementById('admin-patient-count')) {
      document.getElementById('admin-patient-count').innerText = `${count} Records Saved`;
    }
  },

  triggerJSONImport() {
    const fileInput = document.getElementById('backup-file-input');
    if (fileInput) fileInput.click();
  },

  handleJSONImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (DatabaseManager.importJSONBackup(content)) {
        this.showToast('Database restored successfully from backup!', 'success');
        this.switchTab('dashboard');
      } else {
        this.showToast('Invalid backup file format.', 'danger');
      }
    };
    reader.readAsText(file);
  },

  confirmClearAllData() {
    if (confirm('WARNING: Are you sure you want to delete ALL patient screening records? This action cannot be undone.')) {
      DatabaseManager.clearDatabase();
      this.showToast('Database wiped completely.', 'danger');
      this.switchTab('dashboard');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
