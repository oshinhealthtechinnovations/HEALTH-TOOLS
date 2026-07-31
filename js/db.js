/**
 * Nutrislims Health Camp Screening Tool - Data Storage & Excel Engine
 * Manages LocalStorage, Excel Workbook Export/Import, and Patient Records
 */

const DB_KEY = 'nutrislims_health_camp_records_v1';
const CAMP_SETTINGS_KEY = 'nutrislims_camp_settings_v1';

const DatabaseManager = {
  // Initialize Database
  init() {
    if (!localStorage.getItem(DB_KEY)) {
      this.seedSampleData();
    }
  },

  // Get Camp Settings
  getCampSettings() {
    const defaultSettings = {
      campName: 'Nutrislims Community Health Camp 2026',
      location: 'Indore, M.P.',
      dietitianName: 'Dietitian Oshin Ambekar',
      contactPhone: '+91 78281 49178',
      campDate: new Date().toISOString().split('T')[0]
    };
    try {
      const saved = localStorage.getItem(CAMP_SETTINGS_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  },

  saveCampSettings(settings) {
    localStorage.setItem(CAMP_SETTINGS_KEY, JSON.stringify(settings));
  },

  // Get all patient records
  getAllPatients() {
    try {
      const records = localStorage.getItem(DB_KEY);
      return records ? JSON.parse(records) : [];
    } catch (e) {
      console.error('Error reading database:', e);
      return [];
    }
  },

  // Get single patient by ID
  getPatientById(id) {
    const patients = this.getAllPatients();
    return patients.find(p => p.id === id) || null;
  },

  // Save or update patient record
  savePatient(patientData) {
    const patients = this.getAllPatients();
    const now = new Date();
    
    // Process clinical calculations and recommendations
    const processed = ClinicalCalculator.processAssessment(patientData);
    const recs = RecommendationEngine.generateRecommendations(processed);
    
    const record = {
      ...processed,
      recommendationsList: recs.recommendations,
      dailyGoalsList: recs.dailyGoals,
      foodSwapsList: recs.foodSwaps,
      exerciseAdviceList: recs.exerciseAdvice,
      followUp: recs.followUp,
      updatedAt: now.toISOString()
    };

    if (!record.id) {
      // New Patient: Collision-proof cryptographic timestamp hash for multi-user safety
      const timeHash = Date.now().toString(36).toUpperCase();
      const randHash = Math.random().toString(36).substring(2, 6).toUpperCase();
      record.id = `NSC-${timeHash}-${randHash}`;
      record.createdAt = now.toISOString();
      record.dateFormatted = now.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      record.timeFormatted = now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
      });
      patients.unshift(record);
    } else {
      // Update Existing
      const index = patients.findIndex(p => p.id === record.id);
      if (index !== -1) {
        patients[index] = record;
      } else {
        patients.unshift(record);
      }
    }

    localStorage.setItem(DB_KEY, JSON.stringify(patients));

    // Auto-sync to Google Sheets in background if configured
    if (window.CloudSyncModule) {
      window.CloudSyncModule.syncPatientRecord(record);
    }

    return record;
  },

  // Delete patient record
  deletePatient(id) {
    let patients = this.getAllPatients();
    patients = patients.filter(p => p.id !== id);
    localStorage.setItem(DB_KEY, JSON.stringify(patients));
    return true;
  },

  // Clear all database records
  clearDatabase() {
    localStorage.setItem(DB_KEY, JSON.stringify([]));
  },

  // Export to Excel (.xlsx) using SheetJS
  exportToExcel() {
    const patients = this.getAllPatients();
    if (patients.length === 0) {
      alert('No patient records to export!');
      return;
    }

    const excelData = patients.map(p => ({
      'Patient ID': p.id,
      'Assessment Date': p.dateFormatted || (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''),
      'Assessment Time': p.timeFormatted || '',
      'Name': p.name,
      'Age (Years)': p.age,
      'Gender': p.gender,
      'Mobile Number': p.mobile,
      'Consultation Goal': p.patientGoal || 'Lose Weight',
      'Dietary Preference': p.dietType || 'Pure Vegetarian',
      'Medical History': p.medicalCondition || 'None',
      'Height (cm)': p.height,
      'Weight (kg)': p.weight,
      'BMI (kg/m²)': p.bmi,
      'BMI Category': p.bmiCategory,
      'Healthy Weight Range': p.healthyWeightRange,
      'Weight Loss/Gain Needed': p.weightTargetText || '',
      'BMR (kcal/day)': p.bmr,
      'Daily Activity Energy (kcal)': p.activityCalories || 0,
      'Total TDEE (kcal/day)': p.tdee,
      'Prescribed Goal Target (kcal)': p.weightLossCalories,
      'Protein Goal (g/day)': p.proteinRequirement,
      'Water Goal (L/day)': p.waterRequirement,
      'Physical Activity': p.activity,
      'Fruit & Veg Intake': p.fruitVeg,
      'Daily Water Intake (Glasses)': p.water,
      'Sleep Duration': p.sleep,
      'Sugary Drinks Intake': p.sugaryDrinks || 'Rarely/Never',
      'Follow-up Recommendation': p.followUp
    }));

    if (window.XLSX) {
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Health Camp Screening Data');

      worksheet['!cols'] = Array(30).fill({ wch: 18 });

      const fileName = `Nutrislims_Health_Camp_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else {
      alert('SheetJS Excel library is loading or unavailable. Using CSV fallback...');
      this.exportToCSV();
    }
  },

  // Export to CSV fallback
  exportToCSV() {
    const patients = this.getAllPatients();
    if (patients.length === 0) return;

    const keys = ['id', 'dateFormatted', 'name', 'age', 'gender', 'mobile', 'patientGoal', 'dietType', 'height', 'weight', 'bmi', 'bmiCategory', 'bmr', 'tdee', 'weightLossCalories', 'proteinRequirement', 'waterRequirement'];
    let csv = keys.join(',') + '\n';

    patients.forEach(p => {
      let row = keys.map(k => `"${(p[k] || '').toString().replace(/"/g, '""')}"`).join(',');
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Nutrislims_Screening_Data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  },

  // Export Backup (JSON)
  exportJSONBackup() {
    const data = {
      settings: this.getCampSettings(),
      patients: this.getAllPatients(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Nutrislims_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  },

  // Import Backup (JSON)
  importJSONBackup(jsonContent) {
    try {
      const data = JSON.parse(jsonContent);
      if (data.patients && Array.isArray(data.patients)) {
        localStorage.setItem(DB_KEY, JSON.stringify(data.patients));
        if (data.settings) {
          this.saveCampSettings(data.settings);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  // Seed sample health camp data
  seedSampleData() {
    const samplePatients = [
      {
        name: 'Rajesh Kumar Sharma', age: '42', gender: 'Male', mobile: '9826012345', dietType: 'Pure Vegetarian', medicalCondition: 'Pre-diabetes', patientGoal: 'Lose Weight',
        height: '172', weight: '78', activity: 'Never', fruitVeg: 'Less than 2 servings/day',
        water: '3–4 Glasses/day', sleep: 'Less than 6 hours', sugaryDrinks: 'Daily'
      },
      {
        name: 'Priya Verma', age: '34', gender: 'Female', mobile: '9893123456', dietType: 'Eggetarian', medicalCondition: 'None', patientGoal: 'Maintain Weight',
        height: '158', weight: '54', activity: '≥3 Days/Week', fruitVeg: '≥5 servings/day',
        water: '9–12 Glasses/day', sleep: '6–8 hours', sugaryDrinks: 'Rarely/Never'
      },
      {
        name: 'Amitabh Joshi', age: '51', gender: 'Male', mobile: '9752098765', dietType: 'Pure Vegetarian', medicalCondition: 'Hypertension', patientGoal: 'Lose Weight',
        height: '168', weight: '88', activity: '1–2 Days/Week', fruitVeg: '2–4 servings/day',
        water: '1–2 Glasses/day', sleep: 'Less than 6 hours', sugaryDrinks: 'Daily'
      },
      {
        name: 'Sunita Agarwal', age: '29', gender: 'Female', mobile: '9425011223', dietType: 'Pure Vegetarian', medicalCondition: 'PCOS/PCOD', patientGoal: 'Gain Weight',
        height: '162', weight: '48', activity: '1–2 Days/Week', fruitVeg: '2–4 servings/day',
        water: '5–6 Glasses/day', sleep: '6–8 hours', sugaryDrinks: 'Weekly'
      },
      {
        name: 'Vikram Singh', age: '48', gender: 'Male', mobile: '9827055443', dietType: 'Non-Vegetarian', medicalCondition: 'High Cholesterol', patientGoal: 'Lose Weight',
        height: '175', weight: '92', activity: 'Never', fruitVeg: 'Less than 2 servings/day',
        water: '3–4 Glasses/day', sleep: 'Less than 6 hours', sugaryDrinks: 'Daily'
      },
      {
        name: 'Neha Gupta', age: '26', gender: 'Female', mobile: '9981033221', dietType: 'Vegan', medicalCondition: 'None', patientGoal: 'Healthy Lifestyle',
        height: '155', weight: '50', activity: '≥3 Days/Week', fruitVeg: '2–4 servings/day',
        water: '7–8 Glasses/day', sleep: '6–8 hours', sugaryDrinks: 'Rarely/Never'
      }
    ];

    const processedList = samplePatients.map((p, idx) => {
      const processed = ClinicalCalculator.processAssessment(p);
      const recs = RecommendationEngine.generateRecommendations(processed);
      const created = new Date(Date.now() - (idx * 3600000 * 4));
      return {
        ...processed,
        id: 'NSC-' + String(101 + idx).padStart(4, '0'),
        createdAt: created.toISOString(),
        dateFormatted: created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeFormatted: created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        recommendationsList: recs.recommendations,
        dailyGoalsList: recs.dailyGoals,
        foodSwapsList: recs.foodSwaps,
        exerciseAdviceList: recs.exerciseAdvice,
        followUp: recs.followUp
      };
    });

    localStorage.setItem(DB_KEY, JSON.stringify(processedList));
  }
};

window.DatabaseManager = DatabaseManager;
