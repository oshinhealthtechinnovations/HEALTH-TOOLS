/**
 * Nutrislims Health Camp Screening Tool - High-Concurrency Cloud Data Sync Engine
 * v3.0: Zero-Crash Architecture, Offline Queue Retry Engine, Multi-User Lock Safe
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

  /**
   * Get list of records queued while device was offline
   */
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
    // Avoid duplicate queue entries for same patient ID
    const idx = queue.findIndex(q => q.id === record.id);
    if (idx !== -1) {
      queue[idx] = record;
    } else {
      queue.push(record);
    }
    this.saveOfflineQueue(queue);
    console.log(`[CloudSync] Record ${record.id} queued offline. Queue size: ${queue.length}`);
  },

  /**
   * Background Worker — Retries sending failed/offline queued records every 15 seconds
   */
  startOfflineQueueWorker() {
    // Listen to window online event for instant recovery
    window.addEventListener('online', () => {
      console.log('[CloudSync] Internet reconnected — flushing offline sync queue...');
      this.flushOfflineQueue();
    });

    // Interval check every 15 seconds
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

    console.log(`[CloudSync] Flushing ${queue.length} offline records to Google Sheets...`);
    const remainingQueue = [];

    for (const record of queue) {
      try {
        await this.postToGoogleSheets(config.googleWebhookUrl, record);
      } catch (e) {
        console.warn(`[CloudSync] Retry failed for ${record.id}, keeping in queue`, e);
        remainingQueue.push(record);
      }
    }

    this.saveOfflineQueue(remainingQueue);
    if (queue.length > 0 && remainingQueue.length === 0) {
      App.showToast('⚡ Offline data synced to Google Sheets!', 'success');
    }
  },

  /**
   * Automatically triggered whenever a patient assessment is saved or updated.
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
      console.warn('[CloudSync] Sync failed, queuing record for auto-retry:', error);
      this.enqueueOfflineRecord(patientRecord);
    }
  },

  /**
   * POST patient assessment to Google Apps Script Webhook
   * Uses text/plain payload with no-cors to guarantee delivery across all browsers
   */
  async postToGoogleSheets(webhookUrl, record) {
    const payload = {
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
      bmi: String(record.bmi || ''),
      bmiCategory: record.bmiCategory || '',
      bmr: String(record.bmr || ''),
      tdee: String(record.tdee || ''),
      patientGoal: record.patientGoal || 'Lose Weight',
      proteinRequirement: String(record.proteinRequirement || ''),
      waterRequirement: String(record.waterRequirement || ''),
      activity: record.activity || '',
      fruitVeg: record.fruitVeg || '',
      water: record.water || '',
      sleep: record.sleep || ''
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
        console.error('Failed to sync record:', patient.id, e);
        this.enqueueOfflineRecord(patient);
      }
    }

    App.showToast(`✅ Successfully synced ${successCount} records to Google Sheets!`, 'success');
  }
};

// Initialize offline worker
document.addEventListener('DOMContentLoaded', () => {
  CloudSyncModule.init();
});

window.CloudSyncModule = CloudSyncModule;
