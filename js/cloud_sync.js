/**
 * Nutrislims Health Camp Screening Tool - Cloud Data Sync Engine
 * Real-time Auto-Sync to Google Sheets (Excel Format) & Supabase
 */

const CLOUD_SYNC_KEY = 'nutrislims_cloud_sync_config_v1';

const CloudSyncModule = {
  getConfig() {
    const defaultConfig = {
      enabled: false,
      googleWebhookUrl: '',
      supabaseUrl: '',
      supabaseKey: '',
      provider: 'google' // 'google' or 'supabase'
    };
    try {
      const saved = localStorage.getItem(CLOUD_SYNC_KEY);
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch (e) {
      return defaultConfig;
    }
  },

  saveConfig(config) {
    localStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(config));
  },

  /**
   * Automatically triggered whenever a patient assessment is saved.
   */
  async syncPatientRecord(patientRecord) {
    const config = this.getConfig();
    if (!config.enabled || !config.googleWebhookUrl) {
      return;
    }

    try {
      if (config.provider === 'google' && config.googleWebhookUrl) {
        await this.postToGoogleSheets(config.googleWebhookUrl, patientRecord);
      }
    } catch (error) {
      console.warn('Cloud sync background error:', error);
    }
  },

  /**
   * POST patient assessment to Google Apps Script Webhook
   */
  async postToGoogleSheets(webhookUrl, record) {
    const payload = {
      id: record.id,
      dateFormatted: record.dateFormatted || new Date().toLocaleDateString('en-IN'),
      timeFormatted: record.timeFormatted || new Date().toLocaleTimeString('en-IN'),
      name: record.name,
      age: record.age,
      gender: record.gender,
      mobile: record.mobile,
      dietType: record.dietType,
      medicalCondition: record.medicalCondition,
      height: record.height,
      weight: record.weight,
      waistCm: record.waistCm || 'N/A',
      bmi: record.bmi,
      bmiCategory: record.bmiCategory,
      bmr: record.bmr,
      tdee: record.tdee,
      patientGoal: record.patientGoal,
      proteinRequirement: record.proteinRequirement,
      waterRequirement: record.waterRequirement,
      activity: record.activity,
      fruitVeg: record.fruitVeg,
      water: record.water,
      sleep: record.sleep
    };

    // Google Apps Script accepts no-cors or simple POST JSON payloads
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  },

  /**
   * Bulk Sync all existing LocalStorage records to Google Sheets
   */
  async syncAllLocalRecords() {
    const config = this.getConfig();
    if (!config.googleWebhookUrl) {
      App.showToast('Please save your Google Sheets Webhook URL first.', 'warning');
      return;
    }

    const patients = DatabaseManager.getAllPatients();
    if (patients.length === 0) {
      App.showToast('No patient records found to sync.', 'info');
      return;
    }

    App.showToast(`Syncing ${patients.length} patient records to Google Sheets...`, 'info');
    let successCount = 0;

    for (const patient of patients) {
      try {
        await this.postToGoogleSheets(config.googleWebhookUrl, patient);
        successCount++;
      } catch (e) {
        console.error('Failed to sync record:', patient.id, e);
      }
    }

    App.showToast(`✅ Successfully synced ${successCount} records to Google Sheets!`, 'success');
  }
};

window.CloudSyncModule = CloudSyncModule;
