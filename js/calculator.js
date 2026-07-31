/**
 * Nutrislims Health Camp Screening Tool - Clinical Calculator Engine
 * 100% Automatic Goal Decision Logic Based on WHO Asian BMI & ICMR Guidelines
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

    if (bmi < 18.5) {
      category = 'Underweight';
      categoryClass = 'badge-blue';
      riskLevel = 'Nutritional Deficit Risk';
    } else if (bmi >= 18.5 && bmi <= 22.9) {
      category = 'Normal Weight';
      categoryClass = 'badge-green';
      riskLevel = 'Optimal / Healthy';
    } else if (bmi >= 23.0 && bmi <= 24.9) {
      category = 'Overweight (At Risk)';
      categoryClass = 'badge-yellow';
      riskLevel = 'Moderate Health Risk';
    } else if (bmi >= 25.0 && bmi <= 29.9) {
      category = 'Obese Class I';
      categoryClass = 'badge-orange';
      riskLevel = 'High Health Risk';
    } else {
      category = 'Obese Class II';
      categoryClass = 'badge-red';
      riskLevel = 'Very High Health Risk';
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
      healthyWeightRange: `${minHealthyWeight} kg – ${maxHealthyWeight} kg`,
      minHealthyWeight,
      maxHealthyWeight,
      weightTargetText,
      weightTargetBadge,
      weightTargetKg
    };
  },

  /**
   * Calculate BMR using Mifflin-St Jeor Equation (Am J Clin Nutr 1990)
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

    // AUTOMATIC GOAL SELECTION LOGIC & BMR-TARGETED CLINICAL PRESCRIPTIONS
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
   * Protein Requirement Formula (ICMR-NIN 2020 RDA)
   */
  calculateProteinRequirement(weightKg, bmiCategory, goal) {
    let factor = 0.9;
    
    if (goal === 'Gain Weight') {
      factor = 1.2; // Muscle synthesis
    } else if (goal === 'Lose Weight') {
      factor = 1.0; // Muscle preservation
    } else if (bmiCategory === 'Underweight') {
      factor = 1.1;
    }

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

    // 1. Water Gap Analysis
    let currentWaterLiters = 2.0;
    let currentGlasses = '7-8 glasses';

    if (water.includes('1–2 Glasses')) {
      currentWaterLiters = 0.4;
      currentGlasses = '1-2 glasses';
    } else if (water.includes('3–4 Glasses')) {
      currentWaterLiters = 0.85;
      currentGlasses = '3-4 glasses';
    } else if (water.includes('5–6 Glasses')) {
      currentWaterLiters = 1.35;
      currentGlasses = '5-6 glasses';
    } else if (water.includes('7–8 Glasses')) {
      currentWaterLiters = 1.85;
      currentGlasses = '7-8 glasses';
    } else if (water.includes('9–12 Glasses')) {
      currentWaterLiters = 2.6;
      currentGlasses = '9-12 glasses';
    } else if (water.includes('12+ Glasses')) {
      currentWaterLiters = 3.2;
      currentGlasses = '12+ glasses';
    }

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

    // 2. Fruit & Veg Gap Analysis
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

    // 3. Physical Activity Gap Analysis
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

    // 4. Sleep Gap Analysis
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
   * Complete Assessment Calculation Pipeline (Automatic Goal Selection)
   */
  processAssessment(patientData) {
    const bmiData = this.calculateBMI(parseFloat(patientData.weight), parseFloat(patientData.height));
    const bmr = this.calculateBMR(parseFloat(patientData.weight), parseFloat(patientData.height), parseInt(patientData.age), patientData.gender);
    const energyData = this.calculateEnergyRequirements(bmr, patientData.activity, bmiData ? bmiData.bmi : 22);
    const autoGoal = energyData.autoGoal;
    const proteinData = this.calculateProteinRequirement(parseFloat(patientData.weight), bmiData ? bmiData.category : '', autoGoal);
    const waterData = this.calculateWaterRequirement(parseFloat(patientData.weight));
    const gaps = this.analyzeGaps(patientData, waterData.liters);

    const bmrRecommendation = `BMR is ${bmr} kcal/day (Mifflin-St Jeor resting metabolism). Maintain daily intake at/above ${bmr} kcal/day, meet ICMR protein target (${proteinData.recommendedProtein}g/day), and add 2 days/week resistance training.`;

    return {
      ...patientData,
      patientGoal: autoGoal,
      bmi: bmiData ? bmiData.bmi : 0,
      bmiCategory: bmiData ? bmiData.category : 'N/A',
      bmiCategoryClass: bmiData ? bmiData.categoryClass : 'badge-yellow',
      healthyWeightRange: bmiData ? bmiData.healthyWeightRange : '--',
      weightTargetText: bmiData ? bmiData.weightTargetText : '',
      weightTargetBadge: bmiData ? bmiData.weightTargetBadge : 'badge-green',
      weightTargetKg: bmiData ? bmiData.weightTargetKg : 0,
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
