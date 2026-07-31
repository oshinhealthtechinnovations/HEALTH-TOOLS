/**
 * Nutrislims Health Camp Screening Tool - Patient Directory Module
 * Search, Filter, Pagination, and Table Rendering
 */

const PatientsModule = {
  currentPage: 1,
  pageSize: 10,
  filteredPatients: [],

  init() {
    this.bindEvents();
    this.loadPatients();
  },

  bindEvents() {
    const searchInput = document.getElementById('patient-search-input');
    const genderFilter = document.getElementById('filter-gender');
    const bmiFilter = document.getElementById('filter-bmi');

    if (searchInput) searchInput.addEventListener('input', () => this.applyFilters());
    if (genderFilter) genderFilter.addEventListener('change', () => this.applyFilters());
    if (bmiFilter) bmiFilter.addEventListener('change', () => this.applyFilters());
  },

  loadPatients() {
    this.filteredPatients = DatabaseManager.getAllPatients();
    this.currentPage = 1;
    this.renderTable();
  },

  applyFilters() {
    const query = document.getElementById('patient-search-input')?.value.toLowerCase().trim() || '';
    const gender = document.getElementById('filter-gender')?.value || '';
    const bmiCategory = document.getElementById('filter-bmi')?.value || '';

    let patients = DatabaseManager.getAllPatients();

    if (query) {
      patients = patients.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.mobile && p.mobile.includes(query)) ||
        (p.id && p.id.toLowerCase().includes(query))
      );
    }

    if (gender) {
      patients = patients.filter(p => p.gender === gender);
    }

    if (bmiCategory) {
      patients = patients.filter(p => p.bmiCategory === bmiCategory);
    }

    this.filteredPatients = patients;
    this.currentPage = 1;
    this.renderTable();
  },

  renderTable() {
    const tbody = document.getElementById('patient-table-body');
    if (!tbody) return;

    const total = this.filteredPatients.length;
    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No patient records found matching your filters.</td></tr>`;
      this.renderPagination(0);
      return;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, total);
    const pageData = this.filteredPatients.slice(start, end);

    tbody.innerHTML = pageData.map(p => `
      <tr>
        <td><strong class="text-success">${p.id}</strong></td>
        <td>
          <div class="fw-700 text-slate-900">${p.name}</div>
          <small class="text-muted">${p.dateFormatted || ''}</small>
        </td>
        <td>${p.age} yrs / ${p.gender}</td>
        <td>${p.mobile}</td>
        <td><span class="badge bg-success-subtle text-success border border-success">${p.patientGoal || 'Lose Weight'}</span></td>
        <td>${p.height} cm / <strong>${p.weight} kg</strong></td>
        <td><span class="badge ${p.bmiCategoryClass}">${p.bmiCategory}</span> <small class="text-muted">(${p.bmi})</small></td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-success fw-600" onclick="App.viewPatientReport('${p.id}')">
              Report
            </button>
            <button class="btn btn-outline-danger" onclick="PatientsModule.confirmDelete('${p.id}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    this.renderPagination(total);
  },

  renderPagination(total) {
    const container = document.getElementById('patient-pagination');
    if (!container) return;

    const totalPages = Math.ceil(total / this.pageSize);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `<div class="d-flex justify-content-between align-items-center mt-3">`;
    html += `<small class="text-muted">Showing ${((this.currentPage - 1) * this.pageSize) + 1} to ${Math.min(this.currentPage * this.pageSize, total)} of ${total} records</small>`;
    html += `<ul class="pagination pagination-sm mb-0">`;

    html += `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="PatientsModule.goToPage(${this.currentPage - 1}); return false;">Prev</a>
    </li>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="PatientsModule.goToPage(${i}); return false;">${i}</a>
      </li>`;
    }

    html += `<li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="PatientsModule.goToPage(${this.currentPage + 1}); return false;">Next</a>
    </li>`;

    html += `</ul></div>`;
    container.innerHTML = html;
  },

  goToPage(page) {
    this.currentPage = page;
    this.renderTable();
  },

  confirmDelete(id) {
    if (confirm(`Are you sure you want to delete patient record ${id}?`)) {
      DatabaseManager.deletePatient(id);
      App.showToast(`Patient record ${id} deleted.`, 'info');
      this.loadPatients();
      DashboardModule.init();
    }
  }
};

window.PatientsModule = PatientsModule;
