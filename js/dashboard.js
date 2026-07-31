/**
 * Nutrislims Health Camp Screening Tool - Dashboard Analytics (Light Theme)
 * Real-time Chart.js Visualizations & Camp Overview Metrics
 */

const DashboardModule = {
  goalsChartInstance: null,
  bmiChartInstance: null,
  lifestyleChartInstance: null,

  init() {
    this.renderMetrics();
    this.renderCharts();
    this.renderRecentPatients();
    this.renderCommonIssues();
  },

  renderMetrics() {
    const patients = DatabaseManager.getAllPatients();
    const total = patients.length;

    if (total === 0) {
      document.getElementById('stat-total').innerText = '0';
      document.getElementById('stat-today').innerText = '0';
      document.getElementById('stat-top-goal').innerText = '--';
      document.getElementById('stat-avg-age').innerText = '0 yrs';
      document.getElementById('stat-avg-bmi').innerText = '0.0';
      if (document.getElementById('stat-avg-bmr')) document.getElementById('stat-avg-bmr').innerText = '0 kcal';
      document.getElementById('stat-avg-protein').innerText = '0 g';
      document.getElementById('stat-avg-water').innerText = '0.0 L';
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = patients.filter(p => p.createdAt && p.createdAt.startsWith(todayStr)).length;

    // Top consultation goal calculation
    const goalCounts = {};
    patients.forEach(p => {
      const g = p.patientGoal || 'Lose Weight';
      goalCounts[g] = (goalCounts[g] || 0) + 1;
    });

    let topGoal = 'Lose Weight';
    let maxCount = 0;
    Object.keys(goalCounts).forEach(g => {
      if (goalCounts[g] > maxCount) {
        maxCount = goalCounts[g];
        topGoal = g;
      }
    });

    const sumAge = patients.reduce((acc, p) => acc + (parseInt(p.age) || 0), 0);
    const sumBMI = patients.reduce((acc, p) => acc + (parseFloat(p.bmi) || 0), 0);
    const sumBMR = patients.reduce((acc, p) => acc + (parseInt(p.bmr) || 0), 0);
    const sumProtein = patients.reduce((acc, p) => acc + (parseInt(p.proteinRequirement) || 0), 0);
    const sumWater = patients.reduce((acc, p) => acc + (parseFloat(p.waterRequirement) || 0), 0);

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-today').innerText = todayCount;
    document.getElementById('stat-top-goal').innerText = topGoal;
    document.getElementById('stat-avg-age').innerText = Math.round(sumAge / total) + ' yrs';

    document.getElementById('stat-avg-bmi').innerText = (sumBMI / total).toFixed(1);
    if (document.getElementById('stat-avg-bmr')) document.getElementById('stat-avg-bmr').innerText = Math.round(sumBMR / total) + ' kcal';
    document.getElementById('stat-avg-protein').innerText = Math.round(sumProtein / total) + ' g';
    document.getElementById('stat-avg-water').innerText = (sumWater / total).toFixed(1) + ' L';
  },

  renderCharts() {
    const patients = DatabaseManager.getAllPatients();

    // 1. Patient Goals Breakdown Chart
    const goalCounts = {
      'Lose Weight': 0,
      'Maintain Weight': 0,
      'Gain Weight': 0,
      'Healthy Lifestyle': 0
    };

    patients.forEach(p => {
      const g = p.patientGoal || 'Lose Weight';
      if (goalCounts[g] !== undefined) {
        goalCounts[g]++;
      } else {
        goalCounts['Lose Weight']++;
      }
    });

    const goalsCanvas = document.getElementById('chart-goals-dist');
    if (goalsCanvas) {
      if (this.goalsChartInstance) this.goalsChartInstance.destroy();
      this.goalsChartInstance = new Chart(goalsCanvas, {
        type: 'pie',
        data: {
          labels: Object.keys(goalCounts),
          datasets: [{
            data: Object.values(goalCounts),
            backgroundColor: [
              '#059669', // Lose Weight (Green)
              '#2563EB', // Maintain Weight (Blue)
              '#D97706', // Gain Weight (Amber)
              '#DC2626'  // Healthy Lifestyle (Red)
            ],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#334155', font: { family: 'Inter', size: 11, weight: '600' } } },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const total = patients.length || 1;
                  const val = context.raw || 0;
                  const pct = Math.round((val / total) * 100);
                  return `${context.label}: ${val} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // 2. BMI Distribution Chart
    const bmiCounts = {
      'Underweight': 0,
      'Normal Weight': 0,
      'Overweight (At Risk)': 0,
      'Obese Class I': 0,
      'Obese Class II': 0
    };

    patients.forEach(p => {
      if (p.bmiCategory && bmiCounts[p.bmiCategory] !== undefined) {
        bmiCounts[p.bmiCategory]++;
      }
    });

    const bmiCanvas = document.getElementById('chart-bmi-dist');
    if (bmiCanvas) {
      if (this.bmiChartInstance) this.bmiChartInstance.destroy();
      this.bmiChartInstance = new Chart(bmiCanvas, {
        type: 'doughnut',
        data: {
          labels: Object.keys(bmiCounts),
          datasets: [{
            data: Object.values(bmiCounts),
            backgroundColor: [
              '#2563EB', // Underweight (Blue)
              '#059669', // Normal (Green)
              '#D97706', // Overweight (Yellow/Amber)
              '#EA580C', // Obese I (Orange)
              '#DC2626'  // Obese II (Red)
            ],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#334155', font: { family: 'Inter', size: 11, weight: '600' } } },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const total = patients.length || 1;
                  const val = context.raw || 0;
                  const pct = Math.round((val / total) * 100);
                  return `${context.label}: ${val} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // 3. Lifestyle Breakdown Chart
    let lowActivity = 0, lowFruitVeg = 0, lowWater = 0, lowSleep = 0, highSugary = 0;

    patients.forEach(p => {
      if (p.activity === 'Never') lowActivity++;
      if (p.fruitVeg === 'Less than 2 servings/day') lowFruitVeg++;
      if (p.water === 'Less than 1 L/day' || (p.water && p.water.includes('1–2 Glasses'))) lowWater++;
      if (p.sleep === 'Less than 6 hours') lowSleep++;
      if (p.sugaryDrinks === 'Daily') highSugary++;
    });

    const lifestyleCanvas = document.getElementById('chart-lifestyle-breakdown');
    if (lifestyleCanvas) {
      if (this.lifestyleChartInstance) this.lifestyleChartInstance.destroy();
      this.lifestyleChartInstance = new Chart(lifestyleCanvas, {
        type: 'bar',
        data: {
          labels: ['Sedentary', 'Low Veg (<2)', 'Low Hydration', 'Poor Sleep', 'Sugary Drinks'],
          datasets: [{
            label: 'Affected Participants',
            data: [lowActivity, lowFruitVeg, lowWater, lowSleep, highSugary],
            backgroundColor: '#059669',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: '#64748B', stepSize: 1 }, grid: { color: '#F1F5F9' } },
            y: { ticks: { color: '#334155', font: { family: 'Inter', size: 11, weight: '600' } }, grid: { display: false } }
          }
        }
      });
    }
  },

  renderRecentPatients() {
    const tbody = document.getElementById('dashboard-recent-table');
    if (!tbody) return;

    const patients = DatabaseManager.getAllPatients().slice(0, 5);

    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No assessments conducted yet. Click "+ New Assessment" to start.</td></tr>`;
      return;
    }

    tbody.innerHTML = patients.map(p => `
      <tr>
        <td><strong class="text-success">${p.id}</strong></td>
        <td>
          <div class="fw-700 text-slate-900">${p.name}</div>
          <small class="text-muted">${p.gender}, ${p.age} yrs</small>
        </td>
        <td>${p.mobile}</td>
        <td><span class="badge bg-success-subtle text-success border border-success">${p.patientGoal || 'Lose Weight'}</span></td>
        <td>
          <span class="fw-700">${p.bmi}</span>
          <br><small class="badge ${p.bmiCategoryClass}">${p.bmiCategory}</small>
        </td>
        <td><strong class="text-slate-900">${p.bmr} kcal</strong></td>
        <td>
          <button class="btn btn-sm btn-outline-success fw-600" onclick="App.viewPatientReport('${p.id}')">
            <i class="lucide-file-text"></i> Report
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderCommonIssues() {
    const container = document.getElementById('common-issues-list');
    if (!container) return;

    const patients = DatabaseManager.getAllPatients();
    const total = patients.length || 1;

    const issues = [
      { name: 'Low Physical Activity (Sedentary)', count: patients.filter(p => p.activity === 'Never').length, color: 'bg-danger' },
      { name: 'Inadequate Fruit & Vegetable Intake', count: patients.filter(p => p.fruitVeg === 'Less than 2 servings/day').length, color: 'bg-warning' },
      { name: 'Sub-optimal Daily Hydration (<4 glasses)', count: patients.filter(p => p.water && (p.water.includes('1–2 Glasses') || p.water.includes('3–4 Glasses'))).length, color: 'bg-info' },
      { name: 'Sleep Deprivation (<6 hours)', count: patients.filter(p => p.sleep === 'Less than 6 hours').length, color: 'bg-secondary' },
      { name: 'Overweight / Obesity Prevalence', count: patients.filter(p => p.bmi >= 23.0).length, color: 'bg-danger' }
    ];

    issues.sort((a, b) => b.count - a.count);

    container.innerHTML = issues.map((iss, idx) => {
      const pct = Math.round((iss.count / total) * 100);
      return `
        <div class="issue-item mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span class="fw-600 text-slate-800">${idx + 1}. ${iss.name}</span>
            <span class="badge bg-slate-100 text-slate-700 border">${iss.count} participants (${pct}%)</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar ${iss.color}" role="progressbar" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.DashboardModule = DashboardModule;
