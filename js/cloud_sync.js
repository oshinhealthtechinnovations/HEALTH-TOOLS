/**
 * Nutrislims Health Camp Screening Tool - Cloud Data Sync Engine
 * v3.1: Complete Input & Output Parameter Sync (Step 1 + Step 2)
 */

const CLOUD_SYNC_KEY = 'nutrislims_cloud_sync_config_v1';
const OFFLINE_QUEUE_KEY = 'nutrislims_offline_sync_queue_v1';

const CloudSyncModule = {
  retryIntervalId: null,

  init() {
    this.startOfflineQueueWorker();
  },

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

  getOfflineQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveOfflineQueue(queue) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  enqueueOfflineRecord(record) {
    const queue = this.getOfflineQueue();
    const idx = queue.findIndex(q => q.id === record.id);
    if (idx !== -1) {
      queue[idx] = record;
    } else {
      queue.push(record);
    }
    this.saveOfflineQueue(queue);
  },

  startOfflineQueueWorker() {
    window.addEventListener('online', () => {
      this.flushOfflineQueue();
    });

    if (!this.retryIntervalId) {
      this.retryIntervalId = setInterval(() => {
        this.flushOfflineQueue();
      }, 15000);
    }
  },

  async flushOfflineQueue() {
    const queue = this.getOfflineQueue();
    if (queue.length === 0 || !navigator.onLine) return;

    const config = this.getConfig();
    if (!config.enabled || !config.googleWebhookUrl) return;

    const remainingQueue = [];
    for (const record of queue) {
      try {
        await this.postToGoogleSheets(config.googleWebhookUrl, record);
      } catch (e) {
        remainingQueue.push(record);
      }
    }

    this.saveOfflineQueue(remainingQueue);
    if (queue.length > 0 && remainingQueue.length === 0) {
      App.showToast('⚡ Offline patient records auto-synced to Google Sheets!', 'success');
    }
  },

  /**
   * Automatically triggered on Step 1 Next button AND Step 2 Save Assessment button.
   */
  async syncPatientRecord(patientRecord) {
    const config = this.getConfig();
    if (!config.enabled || !config.googleWebhookUrl) {
      return;
    }

    if (!navigator.onLine) {
      this.enqueueOfflineRecord(patientRecord);
      return;
    }

    try {
      if (config.provider === 'google' && config.googleWebhookUrl) {
        await this.postToGoogleSheets(config.googleWebhookUrl, patientRecord);
      }
    } catch (error) {
      this.enqueueOfflineRecord(patientRecord);
    }
  },

  /**
   * POST patient assessment to Google Apps Script Webhook
   * Sends ALL Step 1 Inputs AND Step 2 Output Parameters
   */
  async postToGoogleSheets(webhookUrl, record) {
    const payload = {
      // Step 1 Inputs
      id: record.id || ('NSC-' + Date.now().toString(36).toUpperCase()),
      dateFormatted: record.dateFormatted || new Date().toLocaleDateString('en-IN'),
      timeFormatted: record.timeFormatted || new Date().toLocaleTimeString('en-IN'),
      name: record.name || 'Anonymous',
      age: String(record.age || ''),
      gender: record.gender || 'Male',
      mobile: String(record.mobile || ''),
      dietType: record.dietType || 'Pure Vegetarian',
      medicalCondition: record.medicalCondition || 'None',
      height: String(record.height || ''),
      weight: String(record.weight || ''),
      waistCm: String(record.waistCm || 'N/A'),
      activity: record.activity || '',
      fruitVeg: record.fruitVeg || '',
      water: record.water || '',
      sleep: record.sleep || '',
      sugaryDrinks: record.sugaryDrinks || '',

      // Step 2 Output Parameters
      bmi: String(record.bmi || ''),
      bmiCategory: record.bmiCategory || '',
      bmiRiskLevel: record.bmiRiskLevel || '',
      ibw: String(record.ibw || ''),
      healthyWeightRange: record.healthyWeightRange || '',
      weightTargetText: record.weightTargetText || '',
      bmr: String(record.bmr || ''),
      activityCalories: String(record.activityCalories || ''),
      tdee: String(record.tdee || ''),
      patientGoal: record.patientGoal || 'Lose Weight',
      weightLossCalories: String(record.weightLossCalories || ''),
      proteinRequirement: String(record.proteinRequirement || ''),
      waterRequirement: String(record.waterRequirement || ''),
      metabolicRiskText: record.metabolicRisk ? record.metabolicRisk.text : ''
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
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
        this.enqueueOfflineRecord(patient);
      }
    }

    App.showToast(`✅ Successfully synced ${successCount} records to Google Sheets!`, 'success');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CloudSyncModule.init();
});

window.CloudSyncModule = CloudSyncModule;
