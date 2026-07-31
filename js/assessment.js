/**
 * Nutrislims Health Camp Screening Tool - Assessment Form Module
 * Handles Custom "Other (Specify...)" Write-In Inputs, 2-Step Validation, Live Calculations, and Save
 */

const AssessmentModule = {
  currentStep: 1,

  init() {
    this.bindEvents();
    this.bindOtherDropdowns();
    this.updateStepUI();
  },

  bindEvents() {
    const form = document.getElementById('assessment-form');
    if (!form) return;

    // Real-time calculation triggers on input change
    const calcInputs = form.querySelectorAll('input, select');
    calcInputs.forEach(input => {
      input.addEventListener('input', () => this.updateLivePreview());
      input.addEventListener('change', () => this.updateLivePreview());
    });
  },

  bindOtherDropdowns() {
    const dropdowns = [
      { selectId: 'patient-diet-type', otherInputId: 'patient-diet-other' },
      { selectId: 'patient-medical-condition', otherInputId: 'patient-medical-other' },
      { selectId: 'lifestyle-activity', otherInputId: 'lifestyle-activity-other' },
      { selectId: 'lifestyle-fruitveg', otherInputId: 'lifestyle-fruitveg-other' },
      { selectId: 'lifestyle-water', otherInputId: 'lifestyle-water-other' },
      { selectId: 'lifestyle-sleep', otherInputId: 'lifestyle-sleep-other' },
      { selectId: 'lifestyle-sugary', otherInputId: 'lifestyle-sugary-other' }
    ];

    dropdowns.forEach(item => {
      const selectEl = document.getElementById(item.selectId);
      const otherInputEl = document.getElementById(item.otherInputId);

      if (selectEl && otherInputEl) {
        selectEl.addEventListener('change', () => {
          if (selectEl.value === 'Other') {
            otherInputEl.style.display = 'block';
            otherInputEl.focus();
          } else {
            otherInputEl.style.display = 'none';
            otherInputEl.value = '';
          }
        });
      }
    });
  },

  setStep(step) {
    if (step > this.currentStep && !this.validateCurrentStep()) {
      return;
    }
    this.currentStep = step;
    this.updateStepUI();
    if (step === 2) {
      this.updateLivePreview();
    }
  },

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < 2) {
        this.currentStep = 2;
        this.updateStepUI();
        this.updateLivePreview();
      }
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep = 1;
      this.updateStepUI();
    }
  },

  validateCurrentStep() {
    const stepEl = document.getElementById(`form-step-${this.currentStep}`);
    if (!stepEl) return true;

    const requiredInputs = stepEl.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        input.classList.add('is-invalid');
        isValid = false;
      } else {
        input.classList.remove('is-invalid');
      }
    });

    if (!isValid) {
      App.showToast('Please fill out all required fields marked with *', 'warning');
    }

    return isValid;
  },

  updateStepUI() {
    // Hide all step sections (2 steps total)
    for (let i = 1; i <= 2; i++) {
      const el = document.getElementById(`form-step-${i}`);
      const indicator = document.getElementById(`step-indicator-${i}`);
      if (el) el.style.display = (i === this.currentStep) ? 'block' : 'none';
      if (indicator) {
        indicator.classList.toggle('active', i === this.currentStep);
        indicator.classList.toggle('completed', i < this.currentStep);
      }
    }

    const assessmentSec = document.getElementById('view-assessment');
    if (assessmentSec) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  getFormData() {
    const getDropdownValue = (selectId, otherInputId) => {
      const sel = document.getElementById(selectId);
      const oth = document.getElementById(otherInputId);
      if (sel && sel.value === 'Other' && oth && oth.value.trim()) {
        return oth.value.trim();
      }
      return sel ? sel.value : '';
    };

    return {
      id: document.getElementById('patient-edit-id')?.value || '',
      name: document.getElementById('patient-name')?.value.trim() || '',
      age: document.getElementById('patient-age')?.value || '',
      gender: document.getElementById('patient-gender')?.value || 'Male',
      mobile: document.getElementById('patient-mobile')?.value.trim() || '',
      dietType: getDropdownValue('patient-diet-type', 'patient-diet-other') || 'Pure Vegetarian',
      medicalCondition: getDropdownValue('patient-medical-condition', 'patient-medical-other') || 'None',
      height: document.getElementById('patient-height')?.value || '',
      weight: document.getElementById('patient-weight')?.value || '',
      activity: getDropdownValue('lifestyle-activity', 'lifestyle-activity-other') || 'Never',
      fruitVeg: getDropdownValue('lifestyle-fruitveg', 'lifestyle-fruitveg-other') || 'Less than 2 servings/day',
      water: getDropdownValue('lifestyle-water', 'lifestyle-water-other') || '7–8 Glasses/day',
      sleep: getDropdownValue('lifestyle-sleep', 'lifestyle-sleep-other') || '6–8 hours',
      sugaryDrinks: getDropdownValue('lifestyle-sugary', 'lifestyle-sugary-other') || 'Rarely/Never'
    };
  },

  updateLivePreview() {
    const formData = this.getFormData();
    if (!formData.weight || !formData.height || !formData.age) return;

    const processed = ClinicalCalculator.processAssessment(formData);

    // Update Live UI cards
    const bmiVal = document.getElementById('preview-bmi');
    const bmiCat = document.getElementById('preview-bmi-category');
    const healthyRange = document.getElementById('preview-healthy-range');
    const autoGoalBadge = document.getElementById('preview-auto-goal');
    const goalDesc = document.getElementById('preview-goal-desc');
    const bmrVal = document.getElementById('preview-bmr');
    const weightLossVal = document.getElementById('preview-weight-loss');
    const proteinVal = document.getElementById('preview-protein');
    const waterVal = document.getElementById('preview-water');

    if (bmiVal) bmiVal.innerText = processed.bmi;
    if (bmiCat) {
      bmiCat.innerText = processed.bmiCategory;
      bmiCat.className = `badge ${processed.bmiCategoryClass}`;
    }
    if (healthyRange) {
      healthyRange.innerHTML = `${processed.healthyWeightRange}<br><span class="badge ${processed.weightTargetBadge} mt-1">${processed.weightTargetText}</span>`;
    }

    if (autoGoalBadge) {
      let icon = '🥗';
      if (processed.patientGoal === 'Gain Weight') icon = '💪';
      if (processed.patientGoal === 'Maintain Weight') icon = '⚖️';
      autoGoalBadge.innerHTML = `${icon} ${processed.patientGoal}`;
    }
    if (goalDesc) {
      goalDesc.innerText = processed.goalDescription;
    }

    if (bmrVal) bmrVal.innerText = `${processed.bmr} kcal`;
    if (weightLossVal) weightLossVal.innerText = `${processed.weightLossCalories} kcal/day`;
    if (proteinVal) proteinVal.innerText = `${processed.proteinRequirement} g/day`;
    if (waterVal) waterVal.innerText = `${processed.waterRequirement} L/day`;
  },

  resetForm() {
    const form = document.getElementById('assessment-form');
    if (form) form.reset();
    document.getElementById('patient-edit-id').value = '';
    
    // Hide all other text inputs
    const otherInputs = form.querySelectorAll('input[id$="-other"]');
    otherInputs.forEach(i => { i.style.display = 'none'; i.value = ''; });

    this.currentStep = 1;
    this.updateStepUI();
  },

  saveAssessment() {
    if (!this.validateCurrentStep()) return;

    const formData = this.getFormData();
    const savedRecord = DatabaseManager.savePatient(formData);

    App.showToast(`Assessment saved successfully! Patient ID: ${savedRecord.id}`, 'success');
    
    // Redirect to patient report view
    App.viewPatientReport(savedRecord.id);
  }
};

window.AssessmentModule = AssessmentModule;
