/**
 * Nutrislims Health Camp Screening Tool - Cloud Data Sync Engine
 * Real-time Auto-Sync to Google Sheets (Excel Format) & Supabase
 * v2.2: Dual-Trigger Sync (Step 1 Instant Sync + Step 2 Full Report Sync)
 */

const CLOUD_SYNC_KEY = 'nutrislims_cloud_sync_config_v1';

const CloudSyncModule = {
  getConfig() {
    const defaultConfig = {
      enabled: true,
      googleWebhookUrl: 'https://script.google.com/macros/s/AKfycbx_flHP41jS3CBiGiMD8VMhp7WCqpBJc9EImAkQBTaL-6fZWMLh1poD1a62n6nv7d4/exec',
      supabaseUrl: '',
      supabaseKey: '',
      provider: 'google'
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
   * Automatically triggered whenever a patient assessment is saved or updated.
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
   * Uses text/plain payload with no-cors to guarantee delivery across all browsers
   */
  async postToGoogleSheets(webhookUrl, record) {
    const payload = {
      id: record.id || ('NSC-' + Date.now().toString().slice(-4)),
      dateFormatted: record.dateFormatted || new Date().toLocaleDateString('en-IN'),
      timeFormatted: record.timeFormatted || new Date().toLocaleTimeString('en-IN'),
      name: record.name || 'Anonymous',
      age: record.age || '',
      gender: record.gender || 'Male',
      mobile: record.mobile || '',
      dietType: record.dietType || 'Pure Vegetarian',
      medicalCondition: record.medicalCondition || 'None',
      height: record.height || '',
      weight: record.weight || '',
      waistCm: record.waistCm || 'N/A',
      bmi: record.bmi || '',
      bmiCategory: record.bmiCategory || '',
      bmr: record.bmr || '',
      tdee: record.tdee || '',
      patientGoal: record.patientGoal || 'Lose Weight',
      proteinRequirement: record.proteinRequirement || '',
      waterRequirement: record.waterRequirement || '',
      activity: record.activity || '',
      fruitVeg: record.fruitVeg || '',
      water: record.water || '',
      sleep: record.sleep || ''
    };

    // Send as text/plain stringified JSON to prevent CORS preflight blockage
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
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

    App.showToast(`✅ Successfully synced ${successCount} records to Google Sheets! Check your spreadsheet!`, 'success');
  }
};

window.CloudSyncModule = CloudSyncModule;
