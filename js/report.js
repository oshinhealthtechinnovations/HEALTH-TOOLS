/**
 * Nutrislims Health Camp Screening Tool - Patient Printable Report Generator
 * 100% Formula-Driven Patient Energy & Weight Consultation Report (ICMR & WHO Standards)
 * Includes BMR Metabolic Status & Goal Cascade Decision Flowchart
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

    const gaps = patient.gaps || ClinicalCalculator.analyzeGaps(patient, patient.waterRequirement);
    const targetGlasses = Math.round(patient.waterRequirement * 4);
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
                <div class="col-4 border-end">
                  <small class="text-muted d-block">Height</small>
                  <strong class="fs-5">${patient.height} cm</strong>
                </div>
                <div class="col-4 border-end">
                  <small class="text-muted d-block">Weight</small>
                  <strong class="fs-5">${patient.weight} kg</strong>
                </div>
                <div class="col-4">
                  <small class="text-muted d-block">BMI</small>
                  <strong class="fs-5 text-success">${patient.bmi}</strong>
                </div>
              </div>

              <!-- VISUAL WEIGHT TARGET CARD -->
              <div class="p-2 bg-slate-50 border rounded text-center mt-2">
                <span class="badge ${patient.bmiCategoryClass} px-3 py-1 fs-6 mb-1">${patient.bmiCategory}</span>
                <div class="extra-small text-secondary mb-1">
                  WHO Asian Range: <strong>${patient.healthyWeightRange}</strong>
                </div>
                <div class="p-2 rounded border text-center ${patient.bmi >= 23 ? 'bg-danger-subtle border-danger text-danger' : patient.bmi < 18.5 ? 'bg-info-subtle border-info text-info' : 'bg-success-subtle border-success text-success'}">
                  <strong class="fs-6 d-block">${patient.weightTargetText || 'Weight Target'}</strong>
                  <small class="extra-small">Formula Target Delta</small>
                </div>
              </div>

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

              <!-- PRESCRIBED GOAL CALORIE TARGET CARD (BMR-TARGETED CLINICAL PRESCRIPTION) -->
              <div class="p-2 border rounded bg-success-subtle text-success text-center mb-2">
                <small class="d-block fw-700 text-uppercase extra-small">🎯 Prescribed Goal Intake (${goal})</small>
                <strong class="fs-4">${patient.weightLossCalories} kcal/day</strong>
                <small class="d-block extra-small text-dark fw-600 mt-1">${patient.goalDescription || 'Target calories aligned to patient goal'}</small>
              </div>

              <!-- PROTEIN & WATER METRIC BADGES -->
              <div class="row text-center g-2">
                <div class="col-6">
                  <div class="p-1 border rounded bg-white">
                    <small class="text-muted d-block extra-small">ICMR Protein Goal</small>
                    <strong class="text-success small">${patient.proteinRequirement} g/day</strong>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-1 border rounded bg-white">
                    <small class="text-muted d-block extra-small">ICMR Water Goal</small>
                    <strong class="text-info small">${patient.waterRequirement} L (${targetGlasses} glasses)</strong>
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

        <!-- SECTION 4: PERSONALIZED NUTRITION & EXERCISE PRESCRIPTION CARDS -->
        <div class="report-card p-3 border rounded mb-3 shadow-sm">
          <h6 class="fw-bold text-success border-bottom pb-2 mb-2">
            <i class="lucide-clipboard-check me-1"></i> Personalized Nutrition & Lifestyle Action Plan (${goal})
          </h6>
          
          <div class="row g-3">
            
            <!-- LEFT COLUMN: DAILY ACTION CARDS -->
            <div class="col-md-6 border-end">
              <h6 class="small fw-bold text-dark mb-2">Goal-Based Clinical Actions:</h6>
              
              <div class="v-card mb-2 border-start border-success border-4">
                <strong class="d-block text-success extra-small">🎯 Calorie Strategy (${goal})</strong>
                <span class="extra-small text-dark">Target Intake: <strong>${patient.weightLossCalories} kcal/day</strong> (${patient.goalDescription || 'Aligned to patient goal'}).</span>
              </div>

              <div class="v-card mb-2 border-start border-primary border-4">
                <strong class="d-block text-primary extra-small">⚡ Protein Strategy (BMR Preservation)</strong>
                <span class="extra-small text-dark">Eat <strong>${patient.proteinRequirement} g/day</strong> (~${Math.round(patient.proteinRequirement / 3)}g protein per meal) to protect BMR & lean muscle.</span>
              </div>

              <div class="v-card mb-2 border-start border-info border-4">
                <strong class="d-block text-info extra-small">💧 Hydration Target (ICMR 35ml/kg)</strong>
                <span class="extra-small text-dark">Drink <strong>${targetGlasses} glasses (${patient.waterRequirement} L)/day</strong> to maintain cellular hydration.</span>
              </div>

              <div class="v-card border-start border-warning border-4">
                <strong class="d-block text-warning-emphasis extra-small">🥗 Fruits, Salads & Fiber Goal (ICMR 400g)</strong>
                <span class="extra-small text-dark">Eat <strong>5 servings/day</strong> (2 fresh fruits + 3 bowls raw salad/cooked veggies daily).</span>
              </div>

            </div>

            <!-- RIGHT COLUMN: FOOD SWAPS & EXERCISE CARDS -->
            <div class="col-md-6">
              <h6 class="small fw-bold text-dark mb-2">ICMR Indian Food Swaps (${patient.dietType || 'Pure Vegetarian'}):</h6>
              
              ${(patient.foodSwapsList || []).map(swap => `
                <div class="v-swap-item">
                  <span class="extra-small text-dark fw-600">${swap}</span>
                </div>
              `).join('')}

              <h6 class="small fw-bold text-dark mb-2 mt-3">WHO Prescribed Exercise Plan:</h6>
              <div class="v-exercise-card">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="lucide-activity text-primary"></i>
                  <strong class="extra-small text-primary">Aerobic Cardio Goal:</strong>
                </div>
                <div class="extra-small text-dark mb-2">Brisk walk 30 mins, 5 days/week (Target: 150 mins/week).</div>
                
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="lucide-dumbbell text-success"></i>
                  <strong class="extra-small text-success">Strength & BMR Boost:</strong>
                </div>
                <div class="extra-small text-dark">Include 2 days/week bodyweight squats, wall pushups & resistance exercises.</div>
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
