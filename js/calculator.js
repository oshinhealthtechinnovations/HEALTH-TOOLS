/**
 * Nutrislims Health Camp Screening Tool - Clinical Calculator Engine
 * 100% Automatic Goal Decision Logic Based on WHO Asian BMI & ICMR Guidelines
 * Includes WHtR, Body Composition (Fat %, LBM, FFMI), Health Score (0-100), Disease Predictions & Goal Timelines
 */

const ClinicalCalculator = {
  /**
   * Calculate BMI and WHO Asian Classification (WHO/IASO/IOTF 2000)
   */
  calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

    let category = '';
    let categoryClass = '';
    let riskLevel = '';
    let severityIndex = 1;

    if (bmi < 18.5) {
      category = 'Underweight';
      categoryClass = 'badge-blue';
      riskLevel = 'Nutritional Deficit Risk';
      severityIndex = 0;
    } else if (bmi >= 18.5 && bmi <= 22.9) {
      category = 'Normal Weight';
      categoryClass = 'badge-green';
      riskLevel = 'Optimal / Healthy';
      severityIndex = 1;
    } else if (bmi >= 23.0 && bmi <= 24.9) {
      category = 'Overweight (At Risk)';
      categoryClass = 'badge-yellow';
      riskLevel = 'Moderate Health Risk';
      severityIndex = 2;
    } else if (bmi >= 25.0 && bmi <= 29.9) {
      category = 'Obese Class I';
      categoryClass = 'badge-orange';
      riskLevel = 'High Health Risk';
      severityIndex = 3;
    } else {
      category = 'Obese Class II';
      categoryClass = 'badge-red';
      riskLevel = 'Very High Health Risk';
      severityIndex = 4;
    }

    const minHealthyWeight = parseFloat((18.5 * heightM * heightM).toFixed(1));
    const maxHealthyWeight = parseFloat((22.9 * heightM * heightM).toFixed(1));

    let weightTargetText = '';
    let weightTargetBadge = 'badge-green';
    let weightTargetKg = 0;

    if (bmi >= 23.0) {
      const excess = parseFloat((weightKg - maxHealthyWeight).toFixed(1));
      weightTargetKg = excess;
      weightTargetText = `-${excess} kg Weight Loss Needed`;
      weightTargetBadge = 'badge-red';
    } else if (bmi < 18.5) {
      const deficit = parseFloat((minHealthyWeight - weightKg).toFixed(1));
      weightTargetKg = deficit;
      weightTargetText = `+${deficit} kg Weight Gain Needed`;
      weightTargetBadge = 'badge-blue';
    } else {
      weightTargetText = 'Ideal Weight Maintained';
      weightTargetBadge = 'badge-green';
    }

    return {
      bmi,
      category,
      categoryClass,
      riskLevel,
      severityIndex,
      healthyWeightRange: `${minHealthyWeight} kg – ${maxHealthyWeight} kg`,
      minHealthyWeight,
      maxHealthyWeight,
      weightTargetText,
      weightTargetBadge,
      weightTargetKg
    };
  },

  /**
   * Calculate Waist-to-Height Ratio (WHtR) - WHO Asian Cutoffs
   */
  calculateWHtR(waistCm, heightCm, gender) {
    const targetWaist = (gender === 'Female') ? 80 : 85;
    if (!waistCm || !heightCm) {
      return {
        whtr: 0,
        status: 'N/A',
        badge: 'badge-secondary',
        targetWaist,
        waistDiff: 0,
        text: 'Waist measurement not entered'
      };
    }

    const whtr = parseFloat((waistCm / heightCm).toFixed(2));
    let status = 'Healthy / Low Risk';
    let badge = 'badge-green';
    const waistDiff = Math.max(0, parseFloat((waistCm - targetWaist).toFixed(1)));

    if (whtr >= 0.50 && whtr < 0.58) {
      status = 'Increased Risk';
      badge = 'badge-orange';
    } else if (whtr >= 0.58) {
      status = 'High Central Obesity Risk';
      badge = 'badge-red';
    }

    return {
      whtr,
      status,
      badge,
      targetWaist,
      waistDiff,
      text: waistDiff > 0 ? `Target Waist: <${targetWaist} cm (-${waistDiff} cm needed)` : `Target Waist: <${targetWaist} cm (Optimal)`
    };
  },

  /**
   * Body Composition Estimates (Body Fat %, Fat Mass, Lean Body Mass, FFMI)
   */
  calculateBodyComposition(weightKg, heightCm, ageYears, gender, bmi) {
    if (!weightKg || !heightCm || !ageYears || !bmi) {
      return { bodyFatPct: 0, bodyFatCategory: 'N/A', fatMassKg: 0, leanMassKg: 0, ffmi: 0, ffmiStatus: 'N/A' };
    }

    // Adult Deurenberg Clinical Equation for Body Fat %
    let bodyFatPct = (1.20 * bmi) + (0.23 * ageYears) - (gender === 'Male' ? 16.2 : 5.4);
    bodyFatPct = Math.max(8, Math.min(55, parseFloat(bodyFatPct.toFixed(1))));

    const fatMassKg = parseFloat(((weightKg * bodyFatPct) / 100).toFixed(1));
    const leanMassKg = parseFloat((weightKg - fatMassKg).toFixed(1));

    const heightM = heightCm / 100;
    const ffmi = parseFloat((leanMassKg / (heightM * heightM)).toFixed(1));

    let bodyFatCategory = 'Acceptable';
    if (gender === 'Male') {
      if (bodyFatPct < 14) bodyFatCategory = 'Athletic / Essential';
      else if (bodyFatPct <= 24) bodyFatCategory = 'Healthy';
      else bodyFatCategory = 'High Body Fat';
    } else {
      if (bodyFatPct < 20) bodyFatCategory = 'Athletic / Essential';
      else if (bodyFatPct <= 31) bodyFatCategory = 'Healthy';
      else bodyFatCategory = 'High Body Fat';
    }

    let ffmiStatus = 'Healthy';
    if (ffmi < 16) ffmiStatus = 'Low Lean Mass';
    else if (ffmi >= 16 && ffmi <= 22) ffmiStatus = 'Healthy Muscle Mass';
    else ffmiStatus = 'Above Average';

    return {
      bodyFatPct,
      bodyFatCategory,
      fatMassKg,
      leanMassKg,
      ffmi,
      ffmiStatus
    };
  },

  /**
   * BMR Calculation (Mifflin-St Jeor Equation)
   */
  calculateBMR(weightKg, heightCm, ageYears, gender) {
    if (!weightKg || !heightCm || !ageYears) return 0;
    
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears);
    if (gender === 'Male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    return Math.round(bmr);
  },

  /**
   * Energy Consultation Breakdown & AUTOMATIC GOAL DECISION ENGINE
   */
  calculateEnergyRequirements(bmr, activityLevel, bmi) {
    let multiplier = 1.20; // Sedentary PAL
    if (activityLevel === '1–2 Days/Week') {
      multiplier = 1.375; // Light PAL
    } else if (activityLevel === '≥3 Days/Week') {
      multiplier = 1.55; // Active PAL
    }

    const tdee = Math.round(bmr * multiplier);
    const activityCalories = Math.max(0, tdee - bmr);

    let autoGoal = 'Maintain Weight';
    let targetCalories = tdee;
    let goalDescription = '';

    if (bmi >= 23.0) {
      autoGoal = 'Lose Weight';
      targetCalories = Math.max(bmr, Math.round(tdee - 500));
      goalDescription = `Focus: Maintain & Increase BMR to Target Fat Loss (500 kcal deficit below TDEE ${tdee} kcal, bounded ≥ BMR ${bmr} kcal)`;
    } else if (bmi < 18.5) {
      autoGoal = 'Gain Weight';
      targetCalories = Math.round(tdee + 400);
      goalDescription = `Focus: Elevate BMR & Lean Muscle Mass for Weight Gain (400 kcal surplus over TDEE ${tdee} kcal)`;
    } else {
      autoGoal = 'Maintain Weight';
      targetCalories = tdee;
      goalDescription = `Focus: Maintain Optimal BMR & Metabolic Stability (100% TDEE Energy Balance ${tdee} kcal)`;
    }

    return {
      tdee,
      bmr,
      activityCalories,
      autoGoal,
      targetCalories,
      goalDescription
    };
  },

  /**
   * Overall Health Score (0–100 Scale)
   */
  calculateOverallHealthScore(bmi, whtr, activity, fruitVeg, water, sleep, sugary) {
    let score = 100;

    // BMI Impact (max 25 pts)
    if (bmi < 18.5) score -= 15;
    else if (bmi >= 23.0 && bmi <= 24.9) score -= 10;
    else if (bmi >= 25.0 && bmi <= 29.9) score -= 18;
    else if (bmi >= 30.0) score -= 25;

    // WHtR Impact (max 20 pts)
    if (whtr >= 0.50 && whtr < 0.58) score -= 10;
    else if (whtr >= 0.58) score -= 20;

    // Physical Activity (max 15 pts)
    if (activity === 'Never') score -= 15;
    else if (activity === '1–2 Days/Week') score -= 7;

    // Fruit & Veg (max 15 pts)
    if (fruitVeg === 'Less than 2 servings/day') score -= 15;
    else if (fruitVeg === '2–4 servings/day') score -= 7;

    // Water Hydration (max 15 pts)
    if (water.includes('1–2 Glasses') || water.includes('3–4 Glasses')) score -= 15;
    else if (water.includes('5–6 Glasses')) score -= 7;

    // Sleep & Sugary (max 10 pts)
    if (sleep === 'Less than 6 hours') score -= 5;
    if (sugary === 'Daily') score -= 5;

    score = Math.max(25, Math.min(100, Math.round(score)));

    let badge = 'badge-green';
    let statusText = '🟢 Good Health Status';
    if (score < 55) {
      badge = 'badge-red';
      statusText = '🔴 Poor (Immediate Clinical Intervention Needed)';
    } else if (score < 75) {
      badge = 'badge-yellow';
      statusText = '🟡 Moderate Health Risk';
    }

    return { score, badge, statusText };
  },

  /**
   * Clinical Disease Risk Prediction Engine
   */
  predictDiseaseRisks(bmi, whtr, medicalCondition, activity, fruitVeg, sugary) {
    let diabetes = 'Low';
    let hypertension = 'Low';
    let heartDisease = 'Low';
    let fattyLiver = 'Low';

    let diabetesBadge = 'badge-green';
    let hyperBadge = 'badge-green';
    let heartBadge = 'badge-green';
    let liverBadge = 'badge-green';

    if (bmi >= 23.0 || whtr >= 0.50 || medicalCondition.includes('diabetes') || sugary === 'Daily') {
      diabetes = (bmi >= 25.0 || medicalCondition.includes('diabetes')) ? 'High' : 'Moderate';
      diabetesBadge = diabetes === 'High' ? 'badge-red' : 'badge-orange';
    }

    if (bmi >= 23.0 || whtr >= 0.50 || medicalCondition.includes('Hypertension')) {
      hypertension = (bmi >= 25.0 || medicalCondition.includes('Hypertension')) ? 'High' : 'Moderate';
      hyperBadge = hypertension === 'High' ? 'badge-red' : 'badge-orange';
    }

    if (bmi >= 25.0 || whtr >= 0.55 || medicalCondition.includes('Cholesterol') || activity === 'Never') {
      heartDisease = (bmi >= 28.0 || medicalCondition.includes('Cholesterol')) ? 'High' : 'Moderate';
      heartBadge = heartDisease === 'High' ? 'badge-red' : 'badge-orange';
    }

    if (bmi >= 23.0 || whtr >= 0.52 || sugary === 'Daily' || medicalCondition.includes('Fatty')) {
      fattyLiver = (bmi >= 25.0 || sugary === 'Daily') ? 'High' : 'Moderate';
      liverBadge = fattyLiver === 'High' ? 'badge-red' : 'badge-orange';
    }

    return {
      diabetes: { level: diabetes, badge: diabetesBadge },
      hypertension: { level: hypertension, badge: hyperBadge },
      heartDisease: { level: heartDisease, badge: heartBadge },
      fattyLiver: { level: fattyLiver, badge: liverBadge }
    };
  },

  /**
   * Protein Requirement Formula (ICMR-NIN 2020 RDA)
   */
  calculateProteinRequirement(weightKg, bmiCategory, goal) {
    let factor = 0.9;
    if (goal === 'Gain Weight') factor = 1.2;
    else if (goal === 'Lose Weight') factor = 1.0;
    else if (bmiCategory === 'Underweight') factor = 1.1;

    const minProtein = Math.round(weightKg * 0.8);
    const maxProtein = Math.round(weightKg * 1.3);
    const recommendedProtein = Math.round(weightKg * factor);

    return {
      recommendedProtein,
      range: `${minProtein}g – ${maxProtein}g / day`
    };
  },

  /**
   * Fluid Requirement Formula (ICMR-NIN Guideline: 35 ml/kg body weight)
   */
  calculateWaterRequirement(weightKg) {
    const recommendedLiters = parseFloat((weightKg * 0.035).toFixed(1));
    const actualLiters = Math.max(2.0, Math.min(4.5, recommendedLiters));
    return {
      liters: actualLiters,
      recommendation: `${actualLiters} L / day (${Math.round(actualLiters * 4)} glasses)`
    };
  },

  /**
   * Compute Intake vs Requirement Gap Analysis
   */
  analyzeGaps(lifestyleData, waterTargetLiters) {
    const { activity, fruitVeg, water, sleep } = lifestyleData;

    let currentWaterLiters = 2.0;
    let currentGlasses = '7-8 glasses';

    if (water.includes('1–2 Glasses')) { currentWaterLiters = 0.4; currentGlasses = '1-2 glasses'; }
    else if (water.includes('3–4 Glasses')) { currentWaterLiters = 0.85; currentGlasses = '3-4 glasses'; }
    else if (water.includes('5–6 Glasses')) { currentWaterLiters = 1.35; currentGlasses = '5-6 glasses'; }
    else if (water.includes('7–8 Glasses')) { currentWaterLiters = 1.85; currentGlasses = '7-8 glasses'; }
    else if (water.includes('9–12 Glasses')) { currentWaterLiters = 2.6; currentGlasses = '9-12 glasses'; }
    else if (water.includes('12+ Glasses')) { currentWaterLiters = 3.2; currentGlasses = '12+ glasses'; }

    const waterGapLiters = parseFloat((waterTargetLiters - currentWaterLiters).toFixed(1));
    const waterGapGlasses = Math.max(0, Math.round(waterGapLiters * 4));

    let waterStatus = 'Sufficient';
    let waterBadge = 'badge-green';
    let waterGapText = 'Target Met';

    if (waterGapLiters > 0.3) {
      waterStatus = 'Inadequate';
      waterBadge = 'badge-red';
      waterGapText = `Deficit: -${waterGapGlasses} glasses (${waterGapLiters} L) needed`;
    }

    let currentServings = 4;
    if (fruitVeg === 'Less than 2 servings/day') currentServings = 1.0;
    else if (fruitVeg === '2–4 servings/day') currentServings = 3.0;
    else if (fruitVeg === '≥5 servings/day') currentServings = 5.0;

    const fruitVegTarget = 5.0;
    const fruitVegGap = parseFloat((fruitVegTarget - currentServings).toFixed(1));
    let fruitVegStatus = 'Sufficient';
    let fruitVegBadge = 'badge-green';
    let fruitVegGapText = 'Target Met (5 Servings)';

    if (fruitVegGap > 0.5) {
      fruitVegStatus = 'Inadequate';
      fruitVegBadge = 'badge-red';
      fruitVegGapText = `Deficit: -${fruitVegGap} servings/day needed`;
    }

    let currentMinsPerWeek = 0;
    if (activity === '1–2 Days/Week') currentMinsPerWeek = 60;
    else if (activity === '≥3 Days/Week') currentMinsPerWeek = 150;

    const activityTarget = 150;
    const activityGap = activityTarget - currentMinsPerWeek;
    let activityStatus = 'Sufficient';
    let activityBadge = 'badge-green';
    let activityGapText = 'Target Met (≥150 mins/wk)';

    if (activityGap > 0) {
      activityStatus = 'Inadequate';
      activityBadge = 'badge-red';
      activityGapText = `Deficit: -${activityGap} mins/week needed`;
    }

    let sleepStatus = 'Sufficient';
    let sleepBadge = 'badge-green';
    let sleepGapText = 'Optimal (6–8 hours)';

    if (sleep === 'Less than 6 hours') {
      sleepStatus = 'Inadequate';
      sleepBadge = 'badge-red';
      sleepGapText = 'Deficit: -2.0 hours/night needed';
    } else if (sleep === 'More than 8 hours') {
      sleepStatus = 'Excessive';
      sleepBadge = 'badge-blue';
      sleepGapText = 'Over target: Reduce daytime sleep';
    }

    return {
      water: { current: currentGlasses, currentLiters: currentWaterLiters, target: waterTargetLiters, gap: waterGapLiters, gapGlasses: waterGapGlasses, status: waterStatus, badge: waterBadge, text: waterGapText },
      fruitVeg: { current: currentServings, target: fruitVegTarget, gap: fruitVegGap, status: fruitVegStatus, badge: fruitVegBadge, text: fruitVegGapText },
      activity: { current: currentMinsPerWeek, target: activityTarget, gap: activityGap, status: activityStatus, badge: activityBadge, text: activityGapText },
      sleep: { status: sleepStatus, badge: sleepBadge, text: sleepGapText }
    };
  },

  /**
   * Complete Assessment Calculation Pipeline (Automatic Goal & Extended Metrics)
   */
  processAssessment(patientData) {
    const weight = parseFloat(patientData.weight) || 0;
    const height = parseFloat(patientData.height) || 0;
    const age = parseInt(patientData.age) || 0;
    const waist = parseFloat(patientData.waist) || 0;
    const gender = patientData.gender || 'Male';

    const bmiData = this.calculateBMI(weight, height);
    const bmr = this.calculateBMR(weight, height, age, gender);
    const energyData = this.calculateEnergyRequirements(bmr, patientData.activity, bmiData ? bmiData.bmi : 22);
    const autoGoal = energyData.autoGoal;
    const proteinData = this.calculateProteinRequirement(weight, bmiData ? bmiData.category : '', autoGoal);
    const waterData = this.calculateWaterRequirement(weight);
    const gaps = this.analyzeGaps(patientData, waterData.liters);

    const whtrData = this.calculateWHtR(waist, height, gender);
    const compData = this.calculateBodyComposition(weight, height, age, gender, bmiData ? bmiData.bmi : 22);
    const healthScoreData = this.calculateOverallHealthScore(
      bmiData ? bmiData.bmi : 22,
      whtrData.whtr,
      patientData.activity,
      patientData.fruitVeg,
      patientData.water,
      patientData.sleep,
      patientData.sugaryDrinks
    );

    const diseaseRisks = this.predictDiseaseRisks(
      bmiData ? bmiData.bmi : 22,
      whtrData.whtr,
      patientData.medicalCondition || '',
      patientData.activity,
      patientData.fruitVeg,
      patientData.sugaryDrinks
    );

    // Goal Timeline & Expected Deficit
    const targetWeightKg = bmiData ? bmiData.weightTargetKg : 0;
    const timeToGoalWeeks = targetWeightKg > 0 ? Math.ceil(targetWeightKg / 0.5) : 0;
    const monthlyFatLoss = targetWeightKg > 0 ? (0.5 * 4).toFixed(1) : '0.0';
    const dailyDeficitKcal = Math.max(0, energyData.tdee - energyData.targetCalories);

    const bmrRecommendation = `BMR is ${bmr} kcal/day (Mifflin-St Jeor resting metabolism). Maintain daily intake at/above ${bmr} kcal/day, meet ICMR protein target (${proteinData.recommendedProtein}g/day), and add 2 days/week resistance training.`;

    return {
      ...patientData,
      waist,
      patientGoal: autoGoal,
      bmi: bmiData ? bmiData.bmi : 0,
      bmiCategory: bmiData ? bmiData.category : 'N/A',
      bmiCategoryClass: bmiData ? bmiData.categoryClass : 'badge-yellow',
      severityIndex: bmiData ? bmiData.severityIndex : 1,
      healthyWeightRange: bmiData ? bmiData.healthyWeightRange : '--',
      weightTargetText: bmiData ? bmiData.weightTargetText : '',
      weightTargetBadge: bmiData ? bmiData.weightTargetBadge : 'badge-green',
      weightTargetKg: targetWeightKg,
      timeToGoalWeeks,
      monthlyFatLoss,
      dailyDeficitKcal,
      whtr: whtrData.whtr,
      whtrStatus: whtrData.status,
      whtrBadge: whtrData.badge,
      targetWaist: whtrData.targetWaist,
      waistDiff: whtrData.waistDiff,
      whtrText: whtrData.text,
      bodyFatPct: compData.bodyFatPct,
      bodyFatCategory: compData.bodyFatCategory,
      fatMassKg: compData.fatMassKg,
      leanMassKg: compData.leanMassKg,
      ffmi: compData.ffmi,
      ffmiStatus: compData.ffmiStatus,
      overallHealthScore: healthScoreData.score,
      healthScoreBadge: healthScoreData.badge,
      healthScoreStatusText: healthScoreData.statusText,
      diseaseRisks,
      bmr,
      activityCalories: energyData.activityCalories,
      tdee: energyData.tdee,
      weightLossCalories: energyData.targetCalories,
      goalDescription: energyData.goalDescription,
      proteinRequirement: proteinData.recommendedProtein,
      proteinRange: proteinData.range,
      waterRequirement: waterData.liters,
      waterRecommendation: waterData.recommendation,
      bmrRecommendation,
      gaps
    };
  }
};

window.ClinicalCalculator = ClinicalCalculator;
