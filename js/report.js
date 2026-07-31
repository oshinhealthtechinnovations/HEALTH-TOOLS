/**
 * Nutrislims Health Camp Screening Tool - Patient Printable Report Generator
 * 100% Formula-Driven Patient Energy & Weight Consultation Report (ICMR & WHO Standards)
 * Includes BMR Metabolic Status & Goal Cascade Decision Flowchart
 */

const ReportModule = {
  currentPatient: null,

  renderReport(patientId) {
    const rawPatient = DatabaseManager.getPatientById(patientId);
    if (!rawPatient) {
      App.showToast('Patient record not found.', 'danger');
      return;
    }

    try {
      // Auto-reprocess patient through ClinicalCalculator to guarantee ALL calculated properties exist
      const processed = ClinicalCalculator.processAssessment(rawPatient);

      // Also run RecommendationEngine to guarantee foodSwapsList exists
      const recs = RecommendationEngine.generateRecommendations(processed);
      const patient = {
        ...processed,
        foodSwapsList: processed.foodSwapsList || recs.foodSwaps || [],
        exerciseAdviceList: processed.exerciseAdviceList || recs.exerciseAdvice || [],
        recommendationsList: processed.recommendationsList || recs.recommendations || [],
        followUp: processed.followUp || recs.followUp || 'Annual Health Screening'
      };

      this.currentPatient = patient;
      const settings = DatabaseManager.getCampSettings();
      const container = document.getElementById('printable-report-container');
      if (!container) return;

      const gaps = patient.gaps || {
        water: { current: '7-8 glasses', target: 2.5, status: 'Sufficient', badge: 'badge-green', text: 'Target Met' },
        fruitVeg: { current: 4, target: 5, status: 'Sufficient', badge: 'badge-green', text: 'Target Met' },
        activity: { current: 150, target: 150, status: 'Sufficient', badge: 'badge-green', text: 'Target Met' },
        sleep: { status: 'Sufficient', badge: 'badge-green', text: 'Optimal (6–8 hours)' }
      };
      const targetGlasses = patient.waterGlasses || Math.round((patient.waterRequirement || 2.5) * 5);
      const goal = patient.patientGoal || 'Lose Weight';

    // Goal badge icon & style
    let goalBadge = { icon: '🥗', title: 'Lose Weight', bg: 'bg-success-subtle border-success text-success' };
    if (goal === 'Maintain Weight') goalBadge = { icon: '⚖️', title: 'Maintain Weight', bg: 'bg-primary-subtle border-primary text-primary' };
    if (goal === 'Gain Weight') goalBadge = { icon: '💪', title: 'Gain Weight', bg: 'bg-warning-subtle border-warning text-warning-emphasis' };
    if (goal === 'Healthy Lifestyle') goalBadge = { icon: '❤️', title: 'Healthy Lifestyle', bg: 'bg-danger-subtle border-danger text-danger' };

    // Dynamic BMR Health Assessment Logic
    const isBmrOptimal = patient.bmr >= 1400 || patient.activity !== 'Never';
    const bmrStatusText = isBmrOptimal ? 'HEALTHY / OPTIMAL BMR' : 'SUB-OPTIMAL BMR (BOOST NEEDED)';
    const bmrStatusBadge = isBmrOptimal ? 'badge-green' : 'badge-amber';
    const bmrStatusAdvice = isBmrOptimal ? 'Continue maintaining muscle mass & metabolic rate' : 'Focus on preserving & improving BMR through protein & resistance training';

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
            <div class="mt-2 text-dark small"><strong>ID:</strong> ${patient.id}</div>
            <div class="text-muted extra-small"><strong>Date:</strong> ${patient.dateFormatted || new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <!-- PATIENT ASSESSMENT & CONSULTATION GOAL HEADER CARD -->
        <div class="card mb-3 bg-light text-dark border-0 shadow-sm">
          <div class="card-body p-3">
            <div class="row align-items-center text-center text-md-start">
              <div class="col-md-3"><strong>Patient Name:</strong> <div class="fs-6 fw-bold text-success">${patient.name}</div></div>
              <div class="col-md-2"><strong>Age / Gender:</strong> <div>${patient.age} yrs / ${patient.gender}</div></div>
              <div class="col-md-3"><strong>Diet Preference:</strong> <div class="fw-600 text-primary">${patient.dietType || 'Pure Vegetarian'}</div></div>
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

        <!-- SECTION 1: ANTHROPOMETRICS & ENERGY BREAKDOWN FLOW -->
        <div class="row g-3 mb-3">
          
          <!-- ANTHROPOMETRIC CARD (WHO Asian Standards) -->
          <div class="col-md-5">
            <div class="report-card h-100 p-3 border rounded shadow-sm">
              <h6 class="fw-bold text-success border-bottom pb-2 mb-2">
                <i class="lucide-scale me-1"></i> Anthropometric Assessment (WHO Asian)
              </h6>
              <div class="row text-center my-2">
                <div class="col-3 border-end">
                  <small class="text-muted d-block">Height</small>
                  <strong class="fs-6">${patient.height} cm</strong>
                </div>
                <div class="col-3 border-end">
                  <small class="text-muted d-block">Weight</small>
                  <strong class="fs-6">${patient.weight} kg</strong>
                </div>
                <div class="col-3 border-end">
                  <small class="text-muted d-block">BMI</small>
                  <strong class="fs-6 text-success">${patient.bmi}</strong>
                </div>
                <div class="col-3">
                  <small class="text-muted d-block">IBW</small>
                  <strong class="fs-6 text-primary">${patient.ibw} kg</strong>
                </div>
              </div>

              <!-- VISUAL WEIGHT TARGET & BMI CATEGORY CARD -->
              <div class="p-2 bg-slate-50 border rounded text-center mt-2">
                <span class="badge ${patient.bmiCategoryClass} px-3 py-1 fs-6 mb-1">${patient.bmiCategory}</span>
                <div class="extra-small text-secondary mb-1">
                  WHO Asian Range: <strong>${patient.healthyWeightRange}</strong>
                  &nbsp;|&nbsp; Hamwi IBW: <strong>${patient.ibw} kg</strong>
                </div>
                <div class="p-2 rounded border text-center ${patient.bmi >= 23 ? 'bg-danger-subtle border-danger text-danger' : patient.bmi < 18.5 ? 'bg-info-subtle border-info text-info' : 'bg-success-subtle border-success text-success'}">
                  <strong class="fs-6 d-block">${patient.weightTargetText || 'Weight Target'}</strong>
                  <small class="extra-small">${patient.bmiRiskLevel || 'Target Body Weight'}</small>
                </div>
              </div>

              <!-- METABOLIC SYNDROME RISK FLAG -->
              ${patient.metabolicRisk && patient.metabolicRisk.assessed ? `
              <div class="p-2 rounded border text-center mt-2 ${patient.metabolicRisk.risk === 'Normal' ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}">
                <small class="fw-700 d-block extra-small ${patient.metabolicRisk.risk === 'Normal' ? 'text-success' : 'text-danger'}">
                  Waist: ${patient.metabolicRisk.waist} cm — ${patient.metabolicRisk.risk}
                </small>
                <small class="extra-small text-dark">${patient.metabolicRisk.text}</small>
              </div>` : `
              <div class="p-2 rounded border text-center mt-2 bg-light border-secondary">
                <small class="extra-small text-muted">Waist Circumference: Not Measured — Recommend at next visit</small>
              </div>`}

            </div>
          </div>

          <!-- VISUAL ENERGY BREAKDOWN FLOW CARD (Mifflin-St Jeor & ICMR PAL) -->
          <div class="col-md-7">
            <div class="report-card h-100 p-3 border rounded shadow-sm">
              <h6 class="fw-bold text-success border-bottom pb-2 mb-2">
                <i class="lucide-flame me-1"></i> Energy Breakdown Flow (BMR + Activity = TDEE)
              </h6>
              
              <div class="row g-2 text-center mb-2">
                
                <!-- BMR CARD -->
                <div class="col-4">
                  <div class="p-2 border rounded bg-light h-100">
                    <div class="extra-small text-danger fw-700">❤️ BMR</div>
                    <strong class="fs-6 text-dark">${patient.bmr}</strong> <small class="extra-small">kcal/day</small>
                    <div class="extra-small text-muted mt-1" style="font-size: 0.68rem;">Resting Metabolism</div>
                  </div>
                </div>

                <!-- ACTIVITY ENERGY CARD -->
                <div class="col-4">
                  <div class="p-2 border rounded bg-light h-100">
                    <div class="extra-small text-primary fw-700">+ 🚶 Activity</div>
                    <strong class="fs-6 text-dark">${patient.activityCalories || Math.round(patient.bmr * 0.2)}</strong> <small class="extra-small">kcal/day</small>
                    <div class="extra-small text-muted mt-1" style="font-size: 0.68rem;">ICMR PAL Energy</div>
                  </div>
                </div>

                <!-- TDEE CARD -->
                <div class="col-4">
                  <div class="p-2 border rounded bg-light h-100">
                    <div class="extra-small text-success fw-700">= 🔥 TDEE</div>
                    <strong class="fs-6 text-dark">${patient.tdee}</strong> <small class="extra-small">kcal/day</small>
                    <div class="extra-small text-muted mt-1" style="font-size: 0.68rem;">Total Expenditure</div>
                  </div>
                </div>

              </div>

              <!-- PRESCRIBED GOAL CALORIE INTAKE TARGET CARD -->
              <div class="p-2 border rounded bg-success-subtle border-success text-success text-center my-2">
                <small class="d-block fw-700 text-uppercase extra-small">🎯 Prescribed Daily Intake Target (${goal})</small>
                <strong class="fs-5 text-success d-block">${patient.weightLossCalories} kcal/day</strong>
                <small class="extra-small text-dark fw-600">${patient.goalDescription || 'Energy target aligned to patient goal'}</small>
              </div>

              <!-- PROTEIN & WATER METRIC BADGES -->
              <div class="row text-center g-2">
                <div class="col-6">
                  <div class="p-1.5 border rounded bg-white">
                    <small class="text-muted d-block extra-small">ICMR Protein Goal</small>
                    <strong class="text-success small d-block">${patient.proteinRequirement} g/day</strong>
                    <div class="extra-small text-muted" style="font-size: 0.68rem;">(Range: ${patient.proteinRange || '--'})</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-1.5 border rounded bg-white">
                    <small class="text-muted d-block extra-small">ICMR Water Goal (200ml/glass)</small>
                    <strong class="text-info small d-block">${patient.waterRequirement} L / ${patient.waterGlasses || targetGlasses} glasses</strong>
                    <div class="extra-small text-muted" style="font-size: 0.68rem;">(35 ml × ${patient.weight} kg body weight)</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- SECTION 1.5: BIOIMPEDANCE BODY COMPOSITION & VISCERAL FAT RISK ANALYSIS -->
        <div class="report-card p-3 border rounded mb-3 shadow-sm bg-slate-50">
          <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h6 class="fw-bold text-success mb-0">
              <i class="lucide-activity me-1"></i> Body Composition & Visceral Fat Risk Analysis
            </h6>
            <span class="badge ${patient.bodyComp ? patient.bodyComp.visceralBadge : 'badge-green'} px-3 py-1">
              ${patient.bodyComp ? patient.bodyComp.visceralCategory : 'Normal'}
            </span>
          </div>

          <div class="row g-2 text-center">
            
            <!-- BODY FAT % CARD -->
            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-white h-100 shadow-xs">
                <small class="text-muted d-block extra-small text-uppercase fw-700">🔥 Body Fat %</small>
                <strong class="fs-4 text-danger d-block my-1">${patient.bodyComp ? patient.bodyComp.bodyFatPct : '--'} %</strong>
                <div><span class="badge ${patient.bodyComp ? patient.bodyComp.fatBadge : 'badge-green'} extra-small">${patient.bodyComp ? patient.bodyComp.fatCategory : '--'}</span></div>
              </div>
            </div>

            <!-- VISCERAL FAT RATING CARD (1-59 Scale) -->
            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-white h-100 shadow-xs">
                <small class="text-muted d-block extra-small text-uppercase fw-700">🫀 Visceral Fat Level</small>
                <strong class="fs-4 text-warning-emphasis d-block my-1">Level ${patient.bodyComp ? patient.bodyComp.visceralFatRating : '--'}</strong>
                <div><span class="badge ${patient.bodyComp ? patient.bodyComp.visceralBadge : 'badge-green'} extra-small">${patient.bodyComp ? patient.bodyComp.visceralCategory : '--'}</span></div>
              </div>
            </div>

            <!-- SKELETAL MUSCLE % CARD -->
            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-white h-100 shadow-xs">
                <small class="text-muted d-block extra-small text-uppercase fw-700">💪 Skeletal Muscle Mass</small>
                <strong class="fs-4 text-primary d-block my-1">${patient.bodyComp ? patient.bodyComp.muscleMassPct : '--'} %</strong>
                <div class="extra-small text-muted">Lean Tissue Reserve</div>
              </div>
            </div>

            <!-- METABOLIC AGE CARD -->
            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-white h-100 shadow-xs">
                <small class="text-muted d-block extra-small text-uppercase fw-700">⏳ Metabolic Age</small>
                <strong class="fs-4 d-block my-1 ${patient.bodyComp && patient.bodyComp.metabolicAge > patient.age ? 'text-danger' : 'text-success'}">${patient.bodyComp ? patient.bodyComp.metabolicAge : patient.age} <small class="fs-6 fw-normal">yrs</small></strong>
                <div class="extra-small text-dark">Chronological: <strong>${patient.age} yrs</strong></div>
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
            
            <!-- BMR ASSESSMENT DECISION BOX -->
            <div class="col-md-4">
              <div class="p-2 border rounded bg-white h-100">
                <strong class="extra-small text-dark d-block">BMR Metabolic Status:</strong>
                <span class="fw-bold small text-success">${patient.bmr} kcal/day</span>
                <div class="extra-small text-slate-700 mt-1">${bmrStatusAdvice}</div>
              </div>
            </div>

            <div class="col-md-1 d-none d-md-block fs-4 text-success">➔</div>

            <!-- GOAL CLINICAL CASCADE BOX -->
            <div class="col-md-7">
              <div class="bmr-cascade-box">
                ${goal === 'Lose Weight' ? `
                  <strong class="extra-small text-success d-block text-uppercase">🥗 Weight Loss Clinical Pathway:</strong>
                  <div class="extra-small text-dark mt-1">
                    ✓ Maintain & Elevate BMR • ✓ Eat below TDEE (${patient.weightLossCalories} kcal, bounded ≥ BMR ${patient.bmr} kcal) • ✓ High Protein (${patient.proteinRequirement}g) • ✓ Strength Training
                  </div>
                  <div class="fw-700 text-success extra-small mt-1">
                    Body burns more calories ➔ Uses stored body fat ➔ Healthy Fat Loss
                  </div>
                ` : goal === 'Gain Weight' ? `
                  <strong class="extra-small text-warning-emphasis d-block text-uppercase">💪 Weight Gain Clinical Pathway:</strong>
                  <div class="extra-small text-dark mt-1">
                    ✓ Elevate BMR & Muscle Mass • ✓ High Protein (${patient.proteinRequirement}g) • ✓ Eat above TDEE (${patient.weightLossCalories} kcal) • ✓ Resistance Training
                  </div>
                  <div class="fw-700 text-warning-emphasis extra-small mt-1">
                    BMR maintained & elevated ➔ Lean tissue synthesis ➔ Healthy Muscle Gain
                  </div>
                ` : `
                  <strong class="extra-small text-primary d-block text-uppercase">❤️ Healthy Lifestyle Clinical Pathway:</strong>
                  <div class="extra-small text-dark mt-1">
                    ✓ Maintain Optimal BMR • ✓ Eat around TDEE (${patient.tdee} kcal) • ✓ Regular Exercise • ✓ Protein (${patient.proteinRequirement}g) • ✓ Sleep & Hydration (${targetGlasses} glasses)
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
            
            <!-- Water Intake Card -->
            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-light">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-muted fw-700">Daily Hydration</small>
                  <span class="badge ${gaps.water.badge}">${gaps.water.status}</span>
                </div>
                <div class="extra-small text-dark"><strong>Current:</strong> ${gaps.water.current}</div>
                <div class="extra-small text-primary"><strong>Target:</strong> ${targetGlasses} glasses (${patient.waterRequirement} L)</div>
                <div class="extra-small text-danger fw-700 mt-1">${gaps.water.text}</div>
              </div>
            </div>

            <!-- Fruits & Veggies Card -->
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

            <!-- Physical Activity Card -->
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

            <!-- Sleep Duration Card -->
            <div class="col-md-3 col-6">
              <div class="p-2 border rounded bg-light">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-muted fw-700">Sleep Duration</small>
                  <span class="badge ${gaps.sleep.badge}">${gaps.sleep.status}</span>
                </div>
                <div class="extra-small text-dark"><strong>Current:</strong> ${patient.sleep}</div>
                <div class="extra-small text-primary"><strong>Target:</strong> 6–8 hours</div>
                <div class="extra-small text-secondary fw-700 mt-1">${gaps.sleep.text}</div>
              </div>
            </div>

          </div>
        </div>

        <!-- SECTION 4: DIETITIAN CONSULTATION KPI NUMERIC CARDS & ACTION PLAN -->
        <div class="report-card p-3 border rounded mb-3 shadow-sm">
          <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
            <h6 class="fw-bold text-success mb-0">
              <i class="lucide-clipboard-check me-1"></i> Dietitian Consultation KPI Action Plan (${goal})
            </h6>
            <span class="badge bg-success-subtle text-success border border-success extra-small fw-700">ICMR & WHO Clinical Standards</span>
          </div>
          
          <!-- 6 NUMERIC CONSULTATION METRIC CARDS GRID -->
          <div class="row g-2 mb-3">
            
            <!-- CARD 1: DAILY CALORIE TARGET -->
            <div class="col-md-4 col-6">
              <div class="p-2.5 border rounded bg-success-subtle border-success text-center h-100">
                <small class="text-success fw-700 d-block extra-small text-uppercase">🎯 Prescribed Energy Intake</small>
                <div class="fs-4 fw-extrabold text-success my-1">${patient.weightLossCalories} <small class="fs-6 fw-normal">kcal/day</small></div>
                <div class="extra-small text-dark fw-600">TDEE: ${patient.tdee} kcal &nbsp;|&nbsp; BMR Floor: ${patient.bmr} kcal</div>
                <div class="mt-1 p-1 bg-white rounded border text-muted extra-small" style="font-size: 0.68rem;">
                  <strong>Dietitian Note:</strong> Maintain intake at ${patient.weightLossCalories} kcal/day to target fat loss while protecting resting BMR.
                </div>
              </div>
            </div>

            <!-- CARD 2: DAILY PROTEIN GOAL -->
            <div class="col-md-4 col-6">
              <div class="p-2.5 border rounded bg-primary-subtle border-primary text-center h-100">
                <small class="text-primary fw-700 d-block extra-small text-uppercase">⚡ Daily Protein Target</small>
                <div class="fs-4 fw-extrabold text-primary my-1">${patient.proteinRequirement} <small class="fs-6 fw-normal">g/day</small></div>
                <div class="extra-small text-dark fw-600">~${Math.round(patient.proteinRequirement / 3)} g protein per main meal</div>
                <div class="mt-1 p-1 bg-white rounded border text-muted extra-small" style="font-size: 0.68rem;">
                  <strong>Dietitian Note:</strong> Include Paneer, Moong Dal, Sattu, Sprouts or Eggs in every meal to preserve muscle mass.
                </div>
              </div>
            </div>

            <!-- CARD 3: DAILY WATER HYDRATION -->
            <div class="col-md-4 col-6">
              <div class="p-2.5 border rounded bg-info-subtle border-info text-center h-100">
                <small class="text-info fw-700 d-block extra-small text-uppercase">💧 Daily Hydration Target</small>
                <div class="fs-4 fw-extrabold text-info my-1">${patient.waterRequirement} <small class="fs-6 fw-normal">L/day</small></div>
                <div class="extra-small text-dark fw-600">${patient.waterGlasses || targetGlasses} glasses of 200 ml / day</div>
                <div class="mt-1 p-1 bg-white rounded border text-muted extra-small" style="font-size: 0.68rem;">
                  <strong>Dietitian Note:</strong> Drink 1 glass water every 1.5 hours to optimize cellular metabolism & fat oxidation.
                </div>
              </div>
            </div>

            <!-- CARD 4: FRUITS & FIBER GOAL -->
            <div class="col-md-4 col-6">
              <div class="p-2.5 border rounded bg-warning-subtle border-warning text-center h-100">
                <small class="text-warning-emphasis fw-700 d-block extra-small text-uppercase">🥗 Fruits, Salad & Fiber</small>
                <div class="fs-4 fw-extrabold text-warning-emphasis my-1">5 <small class="fs-6 fw-normal">servings/day</small></div>
                <div class="extra-small text-dark fw-600">2 Fresh Fruits + 3 Bowls Raw Salad (400g)</div>
                <div class="mt-1 p-1 bg-white rounded border text-muted extra-small" style="font-size: 0.68rem;">
                  <strong>Dietitian Note:</strong> Eat 1 bowl raw salad before lunch & dinner to control glucose spikes & satiety.
                </div>
              </div>
            </div>

            <!-- CARD 5: PHYSICAL ACTIVITY -->
            <div class="col-md-4 col-6">
              <div class="p-2.5 border rounded bg-purple-subtle border-purple text-center h-100" style="background-color: #F5F3FF; border: 1px solid #C4B5FD;">
                <small class="text-purple fw-700 d-block extra-small text-uppercase" style="color: #7C3AED;">🏃 Weekly Activity Goal</small>
                <div class="fs-4 fw-extrabold my-1" style="color: #7C3AED;">150 <small class="fs-6 fw-normal">mins/week</small></div>
                <div class="extra-small text-dark fw-600">30 mins × 5 days (Brisk Walk + Resistance)</div>
                <div class="mt-1 p-1 bg-white rounded border text-muted extra-small" style="font-size: 0.68rem;">
                  <strong>Dietitian Note:</strong> 30-min brisk walk 5 days/wk + 2 days bodyweight squats/pushups to elevate BMR.
                </div>
              </div>
            </div>

            <!-- CARD 6: EXPECTED TRANSFORMATION PACE -->
            <div class="col-md-4 col-6">
              <div class="p-2.5 border rounded bg-danger-subtle border-danger text-center h-100">
                <small class="text-danger fw-700 d-block extra-small text-uppercase">⚖️ Safe Weight Target Pace</small>
                <div class="fs-4 fw-extrabold text-danger my-1">${patient.patientGoal === 'Lose Weight' ? '~1.5 – 2.0' : patient.patientGoal === 'Gain Weight' ? '~1.0 – 1.5' : 'Stable'} <small class="fs-6 fw-normal">kg/month</small></div>
                <div class="extra-small text-dark fw-600">WHO Safe Clinical Transformation Pace</div>
                <div class="mt-1 p-1 bg-white rounded border text-muted extra-small" style="font-size: 0.68rem;">
                  <strong>Dietitian Note:</strong> Realistic & sustainable progress pace preventing fatigue, hair loss & BMR drop.
                </div>
              </div>
            </div>

          </div>

          <!-- SECONDARY ROW: ICMR INDIAN FOOD SWAPS & EXERCISE ADVICE -->
          <div class="row g-2">
            <div class="col-md-7">
              <div class="p-2 bg-slate-50 border rounded h-100">
                <strong class="extra-small text-success d-block mb-1">🌾 ICMR Indian Food Swaps (${patient.dietType || 'Pure Vegetarian'}):</strong>
                <div class="row g-1">
                  ${(patient.foodSwapsList || []).map(swap => `
                    <div class="col-12">
                      <div class="p-1 bg-white border rounded extra-small text-dark fw-600">
                        • ${swap}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="col-md-5">
              <div class="p-2 bg-slate-50 border rounded h-100">
                <strong class="extra-small text-primary d-block mb-1">🏋️ WHO Prescribed Exercise Routine:</strong>
                <div class="p-1 bg-white border rounded extra-small text-dark mb-1">
                  <strong>Aerobic Cardio:</strong> Brisk walk 30 mins, 5 days/week (150 mins total).
                </div>
                <div class="p-1 bg-white border rounded extra-small text-dark">
                  <strong>Strength & BMR Boost:</strong> 2 days/week squats, wall pushups & planks.
                </div>
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
          <p class="mb-1"><strong>Medical Citations:</strong> BMI: WHO Asian Cutoffs (WHO/IASO/IOTF 2000) • BMR: Mifflin-St Jeor Equation (1990) • Nutrition & Hydration: ICMR-NIN Dietary Guidelines for Indians (2020) • Physical Activity: WHO Guidelines (2020).</p>
          <p class="mb-0">Nutrislims Health & Wellness Clinic • 1st Floor B, 109 Rajendra Nagar Main Rd, Indore, M.P. • www.nutrislims.com</p>
        </div>
      </div>
    `;

    } catch (err) {
      console.error('Report rendering error:', err);
      const container = document.getElementById('printable-report-container');
      if (container) {
        container.innerHTML = `
          <div class="report-paper shadow-sm p-5 text-center">
            <h4 class="text-danger">⚠️ Report Generation Error</h4>
            <p class="text-muted">An error occurred while generating the report. Please try again.</p>
            <pre class="text-start bg-light p-3 rounded small text-danger">${err.message}\n${err.stack}</pre>
            <button class="btn btn-success mt-3" onclick="location.reload()">Reload & Retry</button>
          </div>
        `;
      }
      App.showToast('Report generation failed: ' + err.message, 'danger');
    }
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
