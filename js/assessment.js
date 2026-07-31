/**
 * Nutrislims Health Camp Screening Tool - Assessment Form Module
 * v2.1: Auto-draft save on New Assessment, full form reset, smooth UX
 */

const AssessmentModule = {
  currentStep: 1,
  _draftKey: 'nutrislims_assessment_draft',

  init() {
    this.bindEvents();
    this.bindOtherDropdowns();
    this.updateStepUI();
    // Restore any saved draft on re-visit (but NOT if editing existing patient)
    const editId = document.getElementById('patient-edit-id');
    if (editId && !editId.value) {
      this.restoreDraft();
    }
  },

  convertFeetToCm() {
    const feetEl = document.getElementById('height-feet');
    const inchesEl = document.getElementById('height-inches');
    const heightCmEl = document.getElementById('patient-height');

    const feet = parseFloat(feetEl?.value) || 0;
    const inches = parseFloat(inchesEl?.value) || 0;

    if (feet > 0) {
      const totalInches = (feet * 12) + inches;
      const cm = parseFloat((totalInches * 2.54).toFixed(1));
      if (heightCmEl) heightCmEl.value = cm;
    }
  },

  /**
   * Called by the + New Assessment button in the header.
   * Saves any in-progress draft, clears the form, and navigates to step 1.
   */
  startNewAssessment() {
    // Clear any draft from memory/localStorage so new form is 100% empty
    try { localStorage.removeItem(this._draftKey); } catch(e) {}
    
    // Clear all form inputs and force view back to Step 1
    this.clearForm();
    App.switchTab('assessment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    App.showToast('Form cleared for new patient assessment.', 'info');
  },

  /**
   * Save current form values as a draft to localStorage.
   */
  saveDraft() {
    try {
      const formData = this.getFormData();
      localStorage.setItem(this._draftKey, JSON.stringify(formData));
    } catch (e) {}
  },

  /**
   * Restore last saved draft into the form fields.
   */
  restoreDraft() {
    try {
      const raw = localStorage.getItem(this._draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || !draft.name) return; // Only restore if there's actual data

      if (document.getElementById('patient-name')) document.getElementById('patient-name').value = draft.name || '';
      if (document.getElementById('patient-age')) document.getElementById('patient-age').value = draft.age || '';
      if (document.getElementById('patient-gender')) document.getElementById('patient-gender').value = draft.gender || 'Male';
      if (document.getElementById('patient-mobile')) document.getElementById('patient-mobile').value = draft.mobile || '';
      if (document.getElementById('patient-height')) document.getElementById('patient-height').value = draft.height || '';
      if (document.getElementById('patient-weight')) document.getElementById('patient-weight').value = draft.weight || '';
      if (document.getElementById('patient-waist')) document.getElementById('patient-waist').value = draft.waistCm || '';

      App.showToast('Draft restored from last session.', 'info');
    } catch (e) {}
  },

  /**
   * Completely clear the assessment form — all fields, step indicators, other-inputs, force Step 1.
   */
  clearForm() {
    const form = document.getElementById('assessment-form');
    if (form) form.reset();

    // Explicitly clear all input elements
    const fieldIds = ['patient-edit-id', 'height-feet', 'height-inches', 'patient-height', 'patient-weight', 'patient-waist', 'patient-visceral-fat', 'patient-name', 'patient-age', 'patient-mobile'];
    fieldIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    // Reset dropdown defaults
    if (document.getElementById('patient-gender')) document.getElementById('patient-gender').value = 'Male';
    if (document.getElementById('patient-diet-type')) document.getElementById('patient-diet-type').value = 'Pure Vegetarian';
    if (document.getElementById('patient-medical-condition')) document.getElementById('patient-medical-condition').value = 'None';
    if (document.getElementById('lifestyle-activity')) document.getElementById('lifestyle-activity').value = 'Never';
    if (document.getElementById('lifestyle-fruitveg')) document.getElementById('lifestyle-fruitveg').value = 'Less than 2 servings/day';
    if (document.getElementById('lifestyle-water')) document.getElementById('lifestyle-water').value = '7–8 Glasses/day';
    if (document.getElementById('lifestyle-sleep')) document.getElementById('lifestyle-sleep').value = '6–8 hours';

    // Hide all "Other (Specify...)" write-in fields
    const otherInputs = document.querySelectorAll('input[id$="-other"]');
    otherInputs.forEach(i => { i.style.display = 'none'; i.value = ''; });

    // Remove any validation error highlights
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    // Delete draft from localStorage so old data never re-populates
    try { localStorage.removeItem(this._draftKey); } catch(e) {}

    // Force step indicator to Step 1
    this.currentStep = 1;
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

    // Realistic Height Check (50 cm - 250 cm)
    const heightEl = document.getElementById('patient-height');
    if (heightEl && heightEl.value) {
      const h = parseFloat(heightEl.value);
      if (h < 50 || h > 250) {
        heightEl.classList.add('is-invalid');
        App.showToast('Please enter a realistic height between 50 cm and 250 cm (e.g. 170 cm)', 'warning');
        return false;
      }
    }

    // Realistic Weight Check (15 kg - 300 kg)
    const weightEl = document.getElementById('patient-weight');
    if (weightEl && weightEl.value) {
      const w = parseFloat(weightEl.value);
      if (w < 15 || w > 300) {
        weightEl.classList.add('is-invalid');
        App.showToast('Please enter a realistic weight between 15 kg and 300 kg (e.g. 70 kg)', 'warning');
        return false;
      }
    }

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
      waistCm: document.getElementById('patient-waist')?.value || '',
      visceralFat: document.getElementById('patient-visceral-fat')?.value || '',
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
    this.clearForm();
  },

  saveAssessment() {
    if (!this.validateCurrentStep()) return;

    const formData = this.getFormData();
    const savedRecord = DatabaseManager.savePatient(formData);

    // Clear draft after successful save
    try { localStorage.removeItem(this._draftKey); } catch(e) {}

    App.showToast(`✅ Assessment saved! Patient ID: ${savedRecord.id}`, 'success');

    // Clear the form ready for the next patient
    this.clearForm();

    // Redirect to the patient's printable report view
    App.viewPatientReport(savedRecord.id);
  }
};

window.AssessmentModule = AssessmentModule;
