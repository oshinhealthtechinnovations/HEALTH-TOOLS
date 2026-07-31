/**
 * Nutrislims Health Camp Screening Tool - Patient Printable Report Generator
 * 100% Formula-Driven Patient Energy & Weight Consultation Report (ICMR & WHO Standards)
 * Includes BMR Flowchart, WHtR, Body Composition (Fat %, LBM, FFMI), Health Score (0-100), Disease Predictions & Goal Timelines
 */

const ReportModule = {
  currentPatient: null,

  renderReport(patientId) {
    const patient = DatabaseManager.getPatientById(patientId);
    if (!patient) {
      App.showToast('Patient record not found.', 'danger');
      return;
    }

    this.currentPatient = patient;
    const settings = DatabaseManager.getCampSettings();
    const container = document.getElementById('printable-report-container');
    if (!container) return;

    const processed = ClinicalCalculator.processAssessment(patient);
    const gaps = processed.gaps || ClinicalCalculator.analyzeGaps(processed, processed.waterRequirement);
    const targetGlasses = Math.round(processed.waterRequirement * 4);
    const goal = processed.patientGoal || 'Lose Weight';

    // Goal badge icon & style
    let goalBadge = { icon: '🥗', title: 'Lose Weight', bg: 'bg-success-subtle border-success text-success' };
    if (goal === 'Maintain Weight') goalBadge = { icon: '⚖️', title: 'Maintain Weight', bg: 'bg-primary-subtle border-primary text-primary' };
    if (goal === 'Gain Weight') goalBadge = { icon: '💪', title: 'Gain Weight', bg: 'bg-warning-subtle border-warning text-warning-emphasis' };
    if (goal === 'Healthy Lifestyle') goalBadge = { icon: '❤️', title: 'Healthy Lifestyle', bg: 'bg-danger-subtle border-danger text-danger' };

    // Dynamic BMR Health Assessment Logic
    const isBmrOptimal = processed.bmr >= 1400 || processed.activity !== 'Never';
    const bmrStatusText = isBmrOptimal ? 'HEALTHY / OPTIMAL BMR' : 'SUB-OPTIMAL BMR (BOOST NEEDED)';
    const bmrStatusBadge = isBmrOptimal ? 'badge-green' : 'badge-amber';
    const bmrStatusAdvice = isBmrOptimal ? 'Continue maintaining muscle mass & metabolic rate' : 'Focus on preserving & improving BMR through protein & resistance training';

    // Severity index active indicator
    const severityIdx = processed.severityIndex || 1;
    const severityCategories = ['Underweight', 'Normal', 'Overweight', 'Obesity I', 'Obesity II'];

    container.innerHTML = `
      <div class="report-paper shadow-sm" id="report-paper-element">
        
        <!-- HEADER -->
        <div class="report-header d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom border-success border-2">
          <div class="d-flex align-items-center gap-3">
            <img src="assets/logo.png" alt="Nutrislims Logo" style="height: 65px; width: auto; object-fit: contain;">
            <div>
              <h3 class="fw-extrabold mb-0" style="color: #059669; font-family: 'Outfit', sans-serif;">Nutrislims</h3>
              <p class="mb-0 text-dark small fw-700">Health And Wellness Clinic • ${settings.dietitianName}</p>
              <p class="mb-0 text-muted extra-small">Indore, M.P. • Contact: ${settings.contactPhone}</p>
            </div>
          </div>
          <div class="text-end">
            <span class="badge bg-success-subtle text-success border border-success px-3 py-1 fw-700" style="font-size: 0.85rem;">
              PATIENT ENERGY & WEIGHT CONSULTATION
            </span>
            <div class="mt-2 text-dark small"><strong>ID:</strong> ${processed.id}</div>
            <div class="text-muted extra-small"><strong>Date:</strong> ${processed.dateFormatted || new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <!-- PATIENT ASSESSMENT & CONSULTATION GOAL HEADER CARD -->
        <div class="card mb-3 bg-light text-dark border-0 shadow-sm">
          <div class="card-body p-3">
            <div class="row align-items-center text-center text-md-start">
              <div class="col-md-3"><strong>Patient Name:</strong> <div class="fs-6 fw-bold text-success">${processed.name}</div></div>
              <div class="col-md-2"><strong>Age / Gender:</strong> <div>${processed.age} yrs / ${processed.gender}</div></div>
              <div class="col-md-3"><strong>Diet Preference:</strong> <div class="fw-600 text-primary">${processed.dietType || 'Pure Vegetarian'}</div></div>
              <div class="col-md-4 text-md-end">
                <strong>Patient Goal:</strong>
                <div>
                  <span class="badge ${goalBadge.bg} px-3 py-1 fs-6 fw-700 mt-1">
                    ${goalBadge.icon} ${goal}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TOP EXECUTIVE CARDS: OVERALL HEALTH SCORE & GOAL TIMELINE -->
        <div class="row g-3 mb-3">
          
          <!-- 1. OVERALL HEALTH SCORE CARD (0-100) -->
          <div class="col-md-6">
            <div class="report-card p-3 border rounded shadow-sm bg-slate-50 h-100">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold text-dark mb-0">⭐ Overall Health Score</h6>
                <span class="badge ${processed.healthScoreBadge} px-3 py-1 fs-6">${processed.healthScoreStatusText}</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <div class="display-5 fw-extrabold text-success mb-0" style="line-height: 1;">
                  ${processed.overallHealthScore}<span class="fs-6 text-muted font-normal"> / 100</span>
                </div>
                <div class="extra-small text-muted border-start ps-3">
                  <strong>Evaluated Clinical Factors:</strong><br>
                  BMI • Waist • Physical Activity • Water • Fruit/Veg • Sleep
                </div>
              </div>
            </div>
          </div>

          <!-- 8. ESTIMATED TIME TO GOAL & MOTIVATING TIMELINE -->
          <div class="col-md-6">
            <div class="report-card p-3 border rounded shadow-sm bg-success-subtle border-success h-100">
              <h6 class="fw-bold text-success mb-1">⏱️ Estimated Time to Consultation Goal</h6>
              ${processed.weightTargetKg > 0 ? `
                <div class="d-flex align-items-center justify-content-between my-1">
                  <div>
                    <span class="extra-small text-dark d-block">Target Weight Delta:</span>
                    <strong class="fs-5 text-danger">${processed.weightTargetText}</strong>
                  </div>
                  <div class="text-end">
                    <span class="extra-small text-dark d-block">Expected Duration:</span>
                    <strong class="fs-4 text-success">${processed.timeToGoalWeeks} Weeks</strong>
                  </div>
                </div>
                <div class="extra-small text-dark fw-600 border-top border-success-subtle pt-1 mt-1">
                  🎯 Safe Weight Loss Rate: <strong>0.5 kg / week (${processed.monthlyFatLoss} kg / month)</strong>
                </div>
              ` : `
                <div class="py-2 text-center text-success fw-700">
                  🎉 Patient is at Ideal Healthy Weight! Focus on Maintenance & Vitality.
                </div>
              `}
            </div>
          </div>

        </div>

        <!-- SECTION 1: ANTHROPOMETRICS, WHtR & BODY COMPOSITION -->
        <div class="row g-3 mb-3">
          
          <!-- ANTHROPOMETRIC & WHtR CARD (WHO Asian Standards) -->
          <div class="col-md-6">
            <div class="report-card h-100 p-3 border rounded shadow-sm">
              <h6 class="fw-bold text-success border-bottom pb-2 mb-2">
                <i class="lucide-scale me-1"></i> Anthropometrics & Waist-to-Height Ratio (WHtR)
              </h6>
              
              <div class="row text-center my-2 g-1">
                <div class="col-3 border-end">
                  <small class="text-muted d-block extra-small">Height</small>
                  <strong class="small">${processed.height} cm</strong>
                </div>
                <div class="col-3 border-end">
                  <small class="text-muted d-block extra-small">Weight</small>
                  <strong class="small">${processed.weight} kg</strong>
                </div>
                <div class="col-3 border-end">
                  <small class="text-muted d-block extra-small">BMI</small>
                  <strong class="small text-success">${processed.bmi}</strong>
                </div>
                <div class="col-3">
                  <small class="text-muted d-block extra-small">Waist</small>
                  <strong class="small text-primary">${processed.waist ? processed.waist + ' cm' : 'N/A'}</strong>
                </div>
              </div>

              <!-- 2. WHtR METRIC CARD -->
              <div class="p-2 border rounded bg-light mb-2">
                <div class="d-flex justify-content-between align-items-center">
                  <strong class="extra-small text-dark">Waist-to-Height Ratio (WHtR):</strong>
                  <span class="badge ${processed.whtrBadge} px-2 py-1">${processed.whtr ? processed.whtr : 'N/A'} — ${processed.whtrStatus}</span>
                </div>
                <div class="extra-small text-muted mt-1">${processed.whtrText}</div>
              </div>

              <!-- 13. OBESITY SEVERITY STEPPER -->
              <div class="p-2 bg-slate-50 border rounded">
                <small class="extra-small text-muted d-block mb-1 fw-700">Obesity Severity Classification:</small>
                <div class="d-flex justify-content-between text-center extra-small">
                  ${severityCategories.map((cat, idx) => `
                    <div class="px-1 py-1 border rounded ${idx === severityIdx ? 'bg-success text-white fw-bold' : 'bg-white text-muted'}" style="flex: 1; margin: 0 1px; font-size: 0.68rem;">
                      ${cat} ${idx === severityIdx ? '✔' : ''}
                    </div>
                  `).join('')}
                </div>
              </div>

            </div>
          </div>

          <!-- 3,4,5,6. CLINICAL BODY COMPOSITION ESTIMATES CARD -->
          <div class="col-md-6">
            <div class="report-card h-100 p-3 border rounded shadow-sm">
              <h6 class="fw-bold text-success border-bottom pb-2 mb-2">
                <i class="lucide-activity me-1"></i> Body Composition Estimates (Deurenberg Clinical)
              </h6>
              
              <div class="row g-2 text-center my-2">
                <div class="col-6">
                  <div class="p-2 border rounded bg-light">
                    <small class="text-muted d-block extra-small">Estimated Body Fat %</small>
                    <strong class="fs-5 text-danger">${processed.bodyFatPct}%</strong>
                    <div class="extra-small text-muted">${processed.bodyFatCategory}</div>
                  </div>
                </div>

                <div class="col-6">
                  <div class="p-2 border rounded bg-light">
                    <small class="text-muted d-block extra-small">Fat Free Mass Index (FFMI)</small>
                    <strong class="fs-5 text-primary">${processed.ffmi}</strong>
                    <div class="extra-small text-muted">${processed.ffmiStatus}</div>
                  </div>
                </div>

                <div class="col-6">
                  <div class="p-2 border rounded bg-white">
                    <small class="text-muted d-block extra-small">Total Fat Mass</small>
                    <strong class="small text-dark">${processed.fatMassKg} kg</strong>
                  </div>
                </div>

                <div class="col-6">
                  <div class="p-2 border rounded bg-white">
                    <small class="text-muted d-block extra-small">Lean Body Mass (LBM)</small>
                    <strong class="small text-success">${processed.leanMassKg} kg</strong>
                  </div>
                </div>
              </div>

              <!-- 9,10. IDEAL WEIGHT & HEALTHY WAIST TARGETS -->
              <div class="p-2 border rounded bg-success-subtle text-success extra-small">
                <strong>Ideal Weight Target:</strong> ${processed.healthyWeightRange} (Diff: ${processed.weightTargetText})<br>
                <strong>Healthy Waist Target:</strong> &lt;${processed.targetWaist} cm for ${processed.gender} (${processed.waistDiff > 0 ? '-' + processed.waistDiff + ' cm reduction needed' : 'Optimal'})
              </div>

            </div>
          </div>

        </div>

        <!-- 11,14. DASHBOARD GAUGES & ENERGY BREAKDOWN FLOW -->
        <div class="row g-3 mb-3">
          
          <!-- LEFT: DASHBOARD GAUGES CARD -->
          <div class="col-md-6">
            <div class="report-card p-3 border rounded shadow-sm h-100">
              <h6 class="fw-bold text-success border-bottom pb-2 mb-2">
                <i class="lucide-sliders me-1"></i> Interactive Clinical Dashboard Gauges
              </h6>

              <!-- BMI Gauge -->
              <div class="mb-2">
                <div class="d-flex justify-content-between extra-small fw-600 mb-1">
                  <span>BMI Index (${processed.bmi})</span>
                  <span class="badge ${processed.bmiCategoryClass}">${processed.bmiCategory}</span>
                </div>
                <div class="custom-progress-bg">
                  <div class="custom-progress-fill fill-green" style="width: ${Math.min(100, Math.max(15, (processed.bmi / 35) * 100))}%;"></div>
                </div>
              </div>

              <!-- Waist Risk Gauge -->
              <div class="mb-2">
                <div class="d-flex justify-content-between extra-small fw-600 mb-1">
                  <span>Waist Risk (${processed.waist ? processed.waist + ' cm' : 'N/A'})</span>
                  <span class="badge ${processed.whtrBadge}">${processed.whtrStatus}</span>
                </div>
                <div class="custom-progress-bg">
                  <div class="custom-progress-fill fill-amber" style="width: ${Math.min(100, Math.max(15, (processed.whtr / 0.7) * 100))}%;"></div>
                </div>
              </div>

              <!-- Body Fat Gauge -->
              <div class="mb-2">
                <div class="d-flex justify-content-between extra-small fw-600 mb-1">
                  <span>Body Fat % (${processed.bodyFatPct}%)</span>
                  <span class="text-muted extra-small">${processed.bodyFatCategory}</span>
                </div>
                <div class="custom-progress-bg">
                  <div class="custom-progress-fill fill-red" style="width: ${Math.min(100, Math.max(15, (processed.bodyFatPct / 45) * 100))}%;"></div>
                </div>
              </div>

              <!-- Hydration Gauge -->
              <div class="mb-2">
                <div class="d-flex justify-content-between extra-small fw-600 mb-1">
                  <span>Hydration (${gaps.water.current} / ${targetGlasses} glasses)</span>
                  <span class="badge ${gaps.water.badge}">${gaps.water.status}</span>
                </div>
                <div class="custom-progress-bg">
                  <div class="custom-progress-fill fill-blue" style="width: ${Math.min(100, (gaps.water.currentLiters / processed.waterRequirement) * 100)}%;"></div>
                </div>
              </div>

              <!-- Protein Goal Gauge -->
              <div>
                <div class="d-flex justify-content-between extra-small fw-600 mb-1">
                  <span>Protein Target (${processed.proteinRequirement} g/day)</span>
                  <span class="text-success extra-small">ICMR RDA Goal</span>
                </div>
                <div class="custom-progress-bg">
                  <div class="custom-progress-fill fill-purple" style="width: 85%;"></div>
                </div>
              </div>

            </div>
          </div>

          <!-- RIGHT: 11,12. DAILY ENERGY BUDGET & MONTHLY FAT LOSS CARD -->
          <div class="col-md-6">
            <div class="report-card p-3 border rounded shadow-sm h-100">
              <h6 class="fw-bold text-success border-bottom pb-2 mb-2">
                <i class="lucide-flame me-1"></i> Daily Energy Budget & Monthly Fat Loss
              </h6>

              <div class="row g-2 text-center mb-2">
                <div class="col-4">
                  <div class="p-2 border rounded bg-light">
                    <div class="extra-small text-danger fw-700">❤️ BMR</div>
                    <strong class="fs-6 text-dark">${processed.bmr}</strong> <small class="extra-small">kcal</small>
                  </div>
                </div>

                <div class="col-4">
                  <div class="p-2 border rounded bg-light">
                    <div class="extra-small text-success fw-700">🔥 Daily Need</div>
                    <strong class="fs-6 text-dark">${processed.tdee}</strong> <small class="extra-small">kcal</small>
                  </div>
                </div>

                <div class="col-4">
                  <div class="p-2 border rounded bg-light">
                    <div class="extra-small text-primary fw-700">🎯 Prescribed</div>
                    <strong class="fs-6 text-dark">${processed.weightLossCalories}</strong> <small class="extra-small">kcal</small>
                  </div>
                </div>
              </div>

              <div class="p-2 border rounded bg-success-subtle text-success text-center mb-2">
                <small class="d-block fw-700 text-uppercase extra-small">🎯 Daily Calorie Deficit Budget</small>
                <strong class="fs-4">${processed.dailyDeficitKcal} kcal / day</strong>
                <small class="d-block extra-small text-dark mt-1">Expected Monthly Fat Loss: <strong>${processed.monthlyFatLoss} kg / month</strong></small>
              </div>

              <!-- 15. CLINICAL DISEASE RISK PREDICTION PANEL -->
              <h6 class="extra-small fw-bold text-dark mb-1">Clinical Disease Risk Predictions:</h6>
              <div class="row g-1 text-center extra-small">
                <div class="col-3">
                  <div class="p-1 border rounded bg-white">
                    <div class="text-muted extra-small">Type 2 Diabetes</div>
                    <span class="badge ${processed.diseaseRisks.diabetes.badge}">${processed.diseaseRisks.diabetes.level}</span>
                  </div>
                </div>
                <div class="col-3">
                  <div class="p-1 border rounded bg-white">
                    <div class="text-muted extra-small">Hypertension</div>
                    <span class="badge ${processed.diseaseRisks.hypertension.badge}">${processed.diseaseRisks.hypertension.level}</span>
                  </div>
                </div>
                <div class="col-3">
                  <div class="p-1 border rounded bg-white">
                    <div class="text-muted extra-small">Heart Disease</div>
                    <span class="badge ${processed.diseaseRisks.heartDisease.badge}">${processed.diseaseRisks.heartDisease.level}</span>
                  </div>
                </div>
                <div class="col-3">
                  <div class="p-1 border rounded bg-white">
                    <div class="text-muted extra-small">Fatty Liver</div>
                    <span class="badge ${processed.diseaseRisks.fattyLiver.badge}">${processed.diseaseRisks.fattyLiver.level}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- SECTION 2: BMR METABOLIC STATUS & GOAL DECISION FLOWCHART CARD -->
        <div class="report-card p-3 border rounded mb-3 shadow-sm bmr-flowchart-card">
          <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h6 class="fw-bold text-success mb-0">
              <i class="lucide-activity me-1"></i> BMR Metabolic Status & Goal Pathway Decision Flow
            </h6>
            <span class="badge ${bmrStatusBadge} px-3 py-1">${bmrStatusText}</span>
          </div>

          <p class="extra-small text-muted mb-2">
            <em>Note: BMR is largely determined by age, sex, body size, and lean body mass. It is the minimum energy required to keep vital organs functioning.</em>
          </p>

          <div class="row g-2 align-items-center text-center">
            
            <div class="col-md-4">
              <div class="p-2 border rounded bg-white h-100">
                <strong class="extra-small text-dark d-block">BMR Metabolic Status:</strong>
                <span class="fw-bold small text-success">${processed.bmr} kcal/day</span>
                <div class="extra-small text-slate-700 mt-1">${bmrStatusAdvice}</div>
              </div>
            </div>

            <div class="col-md-1 d-none d-md-block fs-4 text-success">➔</div>

            <div class="col-md-7">
              <div class="bmr-cascade-box">
                ${goal === 'Lose Weight' ? `
                  <strong class="extra-small text-success d-block text-uppercase">🥗 Weight Loss Clinical Pathway:</strong>
                  <div class="extra-small text-dark mt-1">
                    ✓ Maintain & Elevate BMR • ✓ Eat below TDEE (${processed.weightLossCalories} kcal, bounded ≥ BMR ${processed.bmr} kcal) • ✓ High Protein (${processed.proteinRequirement}g) • ✓ Strength Training
                  </div>
                  <div class="fw-700 text-success extra-small mt-1">
                    Body burns more calories ➔ Uses stored body fat ➔ Healthy Fat Loss
                  </div>
                ` : goal === 'Gain Weight' ? `
                  <strong class="extra-small text-warning-emphasis d-block text-uppercase">💪 Weight Gain Clinical Pathway:</strong>
                  <div class="extra-small text-dark mt-1">
                    ✓ Elevate BMR & Muscle Mass • ✓ High Protein (${processed.proteinRequirement}g) • ✓ Eat above TDEE (${processed.weightLossCalories} kcal) • ✓ Resistance Training
                  </div>
                  <div class="fw-700 text-warning-emphasis extra-small mt-1">
                    BMR maintained & elevated ➔ Lean tissue synthesis ➔ Healthy Muscle Gain
                  </div>
                ` : `
                  <strong class="extra-small text-primary d-block text-uppercase">❤️ Healthy Lifestyle Clinical Pathway:</strong>
                  <div class="extra-small text-dark mt-1">
                    ✓ Maintain Optimal BMR • ✓ Eat around TDEE (${processed.tdee} kcal) • ✓ Regular Exercise • ✓ Protein (${processed.proteinRequirement}g) • ✓ Sleep & Hydration (${targetGlasses} glasses)
                  </div>
                  <div class="fw-700 text-primary extra-small mt-1">
                    Healthy Metabolism ➔ Reduced Oxidative Stress ➔ Lower Disease Risk
                  </div>
                `}
              </div>
            </div>

          </div>
        </div>

        <!-- SECTION 3: LIFESTYLE COMPARISON VISUAL CARDS -->
        <div class="report-card p-3 border rounded mb-3 shadow-sm">
          <h6 class="fw-bold text-success border-bottom pb-2 mb-2">
            <i class="lucide-git-compare me-1"></i> Lifestyle Intake vs. Guideline Requirement Comparison
          </h6>
          <div class="row g-2">
            
            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-light">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-muted fw-700">Daily Hydration</small>
                  <span class="badge ${gaps.water.badge}">${gaps.water.status}</span>
                </div>
                <div class="extra-small text-dark"><strong>Current:</strong> ${gaps.water.current}</div>
                <div class="extra-small text-primary"><strong>Target:</strong> ${targetGlasses} glasses (${processed.waterRequirement} L)</div>
                <div class="extra-small text-danger fw-700 mt-1">${gaps.water.text}</div>
              </div>
            </div>

            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-light">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-muted fw-700">Fruits & Veggies</small>
                  <span class="badge ${gaps.fruitVeg.badge}">${gaps.fruitVeg.status}</span>
                </div>
                <div class="extra-small text-dark"><strong>Current:</strong> ${gaps.fruitVeg.current} serv/day</div>
                <div class="extra-small text-primary"><strong>Target:</strong> ${gaps.fruitVeg.target} serv/day</div>
                <div class="extra-small text-danger fw-700 mt-1">${gaps.fruitVeg.text}</div>
              </div>
            </div>

            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-light">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-muted fw-700">Physical Activity</small>
                  <span class="badge ${gaps.activity.badge}">${gaps.activity.status}</span>
                </div>
                <div class="extra-small text-dark"><strong>Current:</strong> ${gaps.activity.current} min/wk</div>
                <div class="extra-small text-primary"><strong>Target:</strong> ${gaps.activity.target} min/wk</div>
                <div class="extra-small text-danger fw-700 mt-1">${gaps.activity.text}</div>
              </div>
            </div>

            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-light">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-muted fw-700">Sleep Duration</small>
                  <span class="badge ${gaps.sleep.badge}">${gaps.sleep.status}</span>
                </div>
                <div class="extra-small text-dark"><strong>Current:</strong> ${processed.sleep}</div>
                <div class="extra-small text-primary"><strong>Target:</strong> 6–8 hours</div>
                <div class="extra-small text-secondary fw-700 mt-1">${gaps.sleep.text}</div>
              </div>
            </div>

          </div>
        </div>

        <!-- SECTION 5: FOLLOW-UP & PROGRESS MONITORING CHECKLIST CARD -->
        <div class="report-card p-3 border rounded mb-3 shadow-sm bg-slate-50">
          <h6 class="fw-bold text-dark border-bottom pb-2 mb-2">
            <i class="lucide-calendar-check me-1 text-success"></i> Follow-Up & Progress Monitoring Protocol (Review Every 2–4 Weeks)
          </h6>
          <div class="row g-2 extra-small text-dark text-center">
            <div class="col-md-2 col-4"><div class="p-2 border rounded bg-white">✔ Body Weight</div></div>
            <div class="col-md-2 col-4"><div class="p-2 border rounded bg-white">✔ BMI Index</div></div>
            <div class="col-md-2 col-4"><div class="p-2 border rounded bg-white">✔ Waist Line</div></div>
            <div class="col-md-2 col-4"><div class="p-2 border rounded bg-white">✔ Calorie Intake</div></div>
            <div class="col-md-2 col-4"><div class="p-2 border rounded bg-white">✔ Protein Intake</div></div>
            <div class="col-md-2 col-4"><div class="p-2 border rounded bg-white">✔ Sleep & Water</div></div>
          </div>
        </div>

        <!-- FOOTER MEDICAL CITATIONS (ZERO ASSUMPTIONS) -->
        <div class="pt-2 border-top text-center text-muted extra-small">
          <p class="mb-1"><strong>Medical Citations:</strong> BMI & WHtR: WHO Asian Cutoffs (WHO 2000) • BMR & Body Comp: Mifflin-St Jeor (1990) & Deurenberg (1991) • Nutrition & Hydration: ICMR-NIN Guidelines (2020) • Physical Activity: WHO Guidelines (2020).</p>
          <p class="mb-0">Nutrislims Health & Wellness Clinic • 1st Floor B, 109 Rajendra Nagar Main Rd, Indore, M.P. • www.nutrislims.com</p>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  printReport() {
    window.print();
  },

  downloadPDF() {
    if (!this.currentPatient) return;
    const element = document.getElementById('report-paper-element');
    if (!element) return;

    App.showToast('Generating PDF report...', 'info');

    const opt = {
      margin:       [0.2, 0.2, 0.2, 0.2],
      filename:     `Nutrislims_Consultation_${this.currentPatient.name.replace(/\s+/g, '_')}_${this.currentPatient.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      html2pdf().set(opt).from(element).save().then(() => {
        App.showToast('PDF downloaded successfully!', 'success');
      });
    } else {
      App.showToast('PDF generator library is loading, defaulting to print view...', 'warning');
      window.print();
    }
  }
};

window.ReportModule = ReportModule;
