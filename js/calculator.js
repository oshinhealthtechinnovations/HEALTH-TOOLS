/**
 * Nutrislims Health Camp Screening Tool - Clinical Calculator Engine
 * v2.0 — Clinically Improved & Audited
 * Fixes: WHO Asian BMI sub-categories, Water glass mapping (200ml/glass),
 *        Goal-specific protein ranges, IBW (Hamwi), Metabolic Syndrome risk,
 *        Softer activity gap messaging
 */

const ClinicalCalculator = {

  /**
   * Smart Height Converter (Handles Feet/Inches input like 55, 5.5, 5'5", or CM)
   * 55 or 5.5 -> 5 ft 5 in -> 165.1 cm
   * 58 or 5.8 -> 5 ft 8 in -> 172.7 cm
   * 165 -> 165 cm
   */
  parseHeightCm(input) {
    if (!input) return 0;
    let str = String(input).trim();
    let val = parseFloat(str);

    // If input is 3 digits >= 100 (e.g. 170, 165, 155), it is already in CM
    if (!isNaN(val) && val >= 100) {
      return val;
    }

    // Handle 2-digit inputs like 55, 56, 57, 58, 59, 50, 51, 60, 61, 62
    if (!isNaN(val) && val >= 40 && val <= 72) {
      const feet = Math.floor(val / 10);
      const inches = Math.round(val % 10);
      const totalInches = (feet * 12) + inches;
      return parseFloat((totalInches * 2.54).toFixed(1));
    }

    // Handle decimal inputs like 5.5, 5.8, 5'5", 5-5
    if (str.includes('.') || str.includes("'") || str.includes("-")) {
      const parts = str.replace("'", ".").replace("-", ".").split('.');
      if (parts.length >= 2) {
        const feet = parseInt(parts[0]) || 0;
        const inches = parseInt(parts[1]) || 0;
        if (feet >= 4 && feet <= 7 && inches < 12) {
          const totalInches = (feet * 12) + inches;
          return parseFloat((totalInches * 2.54).toFixed(1));
        }
      }
    }

    return val;
  },

  /**
   * Calculate BMI and WHO Asian Classification (WHO/IASO/IOTF 2000)
   * Fixed: Added Obese Class III (≥32.5), corrected Class II boundary (27.5–32.4)
   */
  calculateBMI(weightKg, heightInput) {
    const heightCm = this.parseHeightCm(heightInput);
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
    } else if (bmi >= 25.0 && bmi <= 27.4) {
      category = 'Obese Class I';
      categoryClass = 'badge-orange';
      riskLevel = 'High Health Risk';
    } else if (bmi >= 27.5 && bmi <= 32.4) {
      // FIXED: was incorrectly labelled Class I for 25-29.9
      category = 'Obese Class II';
      categoryClass = 'badge-red';
      riskLevel = 'Very High Health Risk';
    } else {
      // ≥32.5 — FIXED: was missing entirely
      category = 'Obese Class III';
      categoryClass = 'badge-red';
      riskLevel = 'Severe / Morbid Obesity Risk';
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
      weightTargetText = '✓ Ideal Weight Maintained';
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
   * Formula verified correct.
   */
  calculateBMR(weightKg, heightInput, ageYears, gender) {
    const heightCm = this.parseHeightCm(heightInput);
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
   * Ideal Body Weight — Hamwi Formula (standard clinical dietitian reference)
   * Male IBW: 50 kg + 2.3 kg per inch above 5 feet
   * Female IBW: 45.5 kg + 2.3 kg per inch above 5 feet
   */
  calculateIBW(heightInput, gender) {
    const heightCm = this.parseHeightCm(heightInput);
    const heightInches = heightCm / 2.54;
    const inchesAbove5Feet = Math.max(0, heightInches - 60);
    let ibw;
    if (gender === 'Male') {
      ibw = 50 + (2.3 * inchesAbove5Feet);
    } else {
      ibw = 45.5 + (2.3 * inchesAbove5Feet);
    }
    return parseFloat(ibw.toFixed(1));
  },

  /**
   * Metabolic Syndrome — Abdominal Obesity Risk (WHO/IDF Criteria)
   * Male: waist ≥90 cm  |  Female: waist ≥80 cm
   * Smart Inches Detection: Auto-converts inputs <=60 (inches) to cm (e.g. 36 in -> 91.4 cm)
   */
  assessMetabolicRisk(waistInput, gender) {
    if (!waistInput || isNaN(parseFloat(waistInput))) {
      return { assessed: false, risk: 'Not Measured', badge: 'badge-yellow', text: 'Waist not recorded' };
    }
    let rawValue = parseFloat(waistInput);
    let waistCm = rawValue;
    let isConvertedInches = false;

    // Smart Inches Detection: If value is between 18 and 60, it was entered in inches
    if (rawValue >= 18 && rawValue <= 60) {
      waistCm = parseFloat((rawValue * 2.54).toFixed(1));
      isConvertedInches = true;
    }

    const threshold = gender === 'Male' ? 90 : 80;
    const displayStr = isConvertedInches ? `${rawValue} in (${waistCm} cm)` : `${waistCm} cm`;

    if (waistCm >= threshold) {
      return {
        assessed: true,
        risk: 'Abdominal Obesity Risk',
        badge: 'badge-red',
        text: `Waist ${displayStr} ≥ ${threshold} cm threshold — Metabolic Syndrome Risk Elevated`,
        waist: waistCm,
        displayStr,
        threshold
      };
    }
    return {
      assessed: true,
      risk: 'Normal',
      badge: 'badge-green',
      text: `Waist ${displayStr} < ${threshold} cm — No Abdominal Obesity Risk`,
      waist: waistCm,
      displayStr,
      threshold
    };
  },

  /**
   * Energy Consultation Breakdown & AUTOMATIC GOAL DECISION ENGINE
   * PAL multipliers per ICMR-NIN 2020 guidelines.
   */
  calculateEnergyRequirements(bmr, activityLevel, bmi) {
    let multiplier = 1.20; // Sedentary PAL
    if (activityLevel === '1–2 Days/Week') {
      multiplier = 1.375; // Light Active PAL
    } else if (activityLevel === '≥3 Days/Week') {
      multiplier = 1.55;  // Moderate Active PAL
    }

    const tdee = Math.round(bmr * multiplier);
    const activityCalories = Math.max(0, tdee - bmr);

    let autoGoal = 'Maintain Weight';
    let targetCalories = tdee;
    let goalDescription = '';

    if (bmi >= 23.0) {
      autoGoal = 'Lose Weight';
      targetCalories = Math.max(bmr, Math.round(tdee - 500));
      goalDescription = `Eat below TDEE (${tdee} kcal) by 500 kcal — floor is BMR (${bmr} kcal) to protect muscle & resting metabolism`;
    } else if (bmi < 18.5) {
      autoGoal = 'Gain Weight';
      targetCalories = Math.round(tdee + 400);
      goalDescription = `Eat 400 kcal above TDEE (${tdee} kcal) with high-protein diet to build lean muscle & elevate BMR`;
    } else {
      autoGoal = 'Maintain Weight';
      targetCalories = tdee;
      goalDescription = `Match TDEE (${tdee} kcal) with balanced diet & regular exercise to maintain optimal BMR & metabolic health`;
    }

    return { tdee, bmr, activityCalories, autoGoal, targetCalories, goalDescription };
  },

  /**
   * Protein Requirement — ICMR-NIN 2020 RDA
   * FIXED: Goal-specific protein factor ranges instead of hardcoded 0.8–1.3
   */
  calculateProteinRequirement(weightKg, bmiCategory, goal) {
    let factor = 0.9;
    let minFactor = 0.8;
    let maxFactor = 1.0;

    if (goal === 'Gain Weight') {
      factor = 1.2;
      minFactor = 1.0;
      maxFactor = 1.6;
    } else if (goal === 'Lose Weight') {
      factor = 1.0;
      minFactor = 0.8;
      maxFactor = 1.2;
    } else if (bmiCategory === 'Underweight') {
      factor = 1.1;
      minFactor = 0.9;
      maxFactor = 1.3;
    }

    const recommendedProtein = Math.round(weightKg * factor);
    const minProtein = Math.round(weightKg * minFactor);
    const maxProtein = Math.round(weightKg * maxFactor);

    return {
      recommendedProtein,
      range: `${minProtein}g – ${maxProtein}g / day`
    };
  },

  /**
   * Fluid Requirement — ICMR-NIN: 35 ml/kg body weight
   * Capped at 2.0–4.5 L (clinically safe range)
   * Formula verified correct.
   */
  calculateWaterRequirement(weightKg) {
    const recommendedLiters = parseFloat((weightKg * 0.035).toFixed(1));
    const actualLiters = parseFloat(Math.max(2.0, Math.min(4.5, recommendedLiters)).toFixed(1));
    // 1 glass = 200 ml (Indian standard cup)
    const glasses = Math.round(actualLiters * 5); // 1000ml / 200ml = 5 glasses per litre
    return {
      liters: actualLiters,
      glasses,
      recommendation: `${actualLiters} L / day (${glasses} glasses of 200 ml)`
    };
  },

  /**
   * Intake vs. Requirement Gap Analysis
   * FIXED: Water mapping corrected to 200 ml/glass (Indian standard)
   * IMPROVED: Softer activity messaging for sedentary patients
   */
  analyzeGaps(lifestyleData, waterTargetLiters) {
    const { activity, fruitVeg, water, sleep } = lifestyleData;

    // 1. Water Gap Analysis — FIXED: 200 ml per glass (Indian standard cup)
    let currentWaterLiters = 1.5;
    let currentGlasses = '7-8 glasses';

    if (water && water.includes('1–2 Glasses')) {
      currentWaterLiters = 0.30;  // 1.5 × 200ml
      currentGlasses = '1-2 glasses (~0.3 L)';
    } else if (water && water.includes('3–4 Glasses')) {
      currentWaterLiters = 0.70;  // 3.5 × 200ml
      currentGlasses = '3-4 glasses (~0.7 L)';
    } else if (water && water.includes('5–6 Glasses')) {
      currentWaterLiters = 1.10;  // 5.5 × 200ml
      currentGlasses = '5-6 glasses (~1.1 L)';
    } else if (water && water.includes('7–8 Glasses')) {
      currentWaterLiters = 1.50;  // 7.5 × 200ml
      currentGlasses = '7-8 glasses (~1.5 L)';
    } else if (water && water.includes('9–12 Glasses')) {
      currentWaterLiters = 2.10;  // 10.5 × 200ml
      currentGlasses = '9-12 glasses (~2.1 L)';
    } else if (water && water.includes('12+')) {
      currentWaterLiters = 2.60;  // 13 × 200ml
      currentGlasses = '12+ glasses (>2.6 L)';
    }

    const waterGapLiters = parseFloat((waterTargetLiters - currentWaterLiters).toFixed(1));
    const waterGapGlasses = Math.max(0, Math.round(waterGapLiters * 5));

    let waterStatus = 'Sufficient';
    let waterBadge = 'badge-green';
    let waterGapText = '✓ Target Met';

    if (waterGapLiters > 0.3) {
      waterStatus = 'Inadequate';
      waterBadge = 'badge-red';
      waterGapText = `Add ${waterGapGlasses} more glass(es)/day (${waterGapLiters} L needed to reach goal)`;
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
    let fruitVegGapText = '✓ Target Met (5 Servings)';

    if (fruitVegGap > 0.5) {
      fruitVegStatus = 'Inadequate';
      fruitVegBadge = 'badge-red';
      fruitVegGapText = `Add ${fruitVegGap} more serving(s)/day (fruit + salad)`;
    }

    // 3. Physical Activity Gap Analysis
    // IMPROVED: Softer, actionable messaging instead of raw deficit number
    let currentMinsPerWeek = 0;
    if (activity === '1–2 Days/Week') currentMinsPerWeek = 60;
    else if (activity === '≥3 Days/Week') currentMinsPerWeek = 150;

    const activityTarget = 150;
    const activityGap = activityTarget - currentMinsPerWeek;
    let activityStatus = 'Sufficient';
    let activityBadge = 'badge-green';
    let activityGapText = '✓ Target Met (≥150 mins/wk)';

    if (currentMinsPerWeek === 0) {
      activityStatus = 'Sedentary';
      activityBadge = 'badge-red';
      activityGapText = 'Start with 30 min brisk walk, 5 days/week to meet 150 min/week target';
    } else if (activityGap > 0) {
      activityStatus = 'Inadequate';
      activityBadge = 'badge-red';
      activityGapText = `Add ${activityGap} mins/week more — try 1 extra day of 30 min exercise`;
    }

    // 4. Sleep Gap Analysis
    let sleepStatus = 'Sufficient';
    let sleepBadge = 'badge-green';
    let sleepGapText = '✓ Optimal (6–8 hours)';

    if (sleep === 'Less than 6 hours') {
      sleepStatus = 'Inadequate';
      sleepBadge = 'badge-red';
      sleepGapText = 'Aim for 7 hrs/night — poor sleep disrupts BMR & hunger hormones';
    } else if (sleep === 'More than 8 hours') {
      sleepStatus = 'Excessive';
      sleepBadge = 'badge-blue';
      sleepGapText = 'Reduce to 7–8 hrs — excessive sleep linked to sluggish metabolism';
    }

    return {
      water: { current: currentGlasses, currentLiters: currentWaterLiters, target: waterTargetLiters, gap: waterGapLiters, gapGlasses: waterGapGlasses, status: waterStatus, badge: waterBadge, text: waterGapText },
      fruitVeg: { current: currentServings, target: fruitVegTarget, gap: fruitVegGap, status: fruitVegStatus, badge: fruitVegBadge, text: fruitVegGapText },
      activity: { current: currentMinsPerWeek, target: activityTarget, gap: activityGap, status: activityStatus, badge: activityBadge, text: activityGapText },
      sleep: { status: sleepStatus, badge: sleepBadge, text: sleepGapText }
    };
  },

  /**
   * Body Composition & Visceral Fat Analysis Engine
   * Deurenberg Formula for Body Fat %:
   * Body Fat % = (1.20 × BMI) + (0.23 × Age) - (10.8 × GenderFactor) - 5.4
   * (GenderFactor: Male = 1, Female = 0)
   * 
   * Visceral Fat Rating (1-59 scale):
   * Standard bioimpedance scale rating (1-9 Normal, 10-14 High, ≥15 Dangerous)
   */
  calculateBodyComposition(bmi, age, gender, waistCm, inputFatPct, inputVisceralFat) {
    let bodyFatPct = 0;
    let visceralFatRating = 0;
    
    if (inputFatPct && !isNaN(parseFloat(inputFatPct)) && parseFloat(inputFatPct) > 0) {
      bodyFatPct = parseFloat(parseFloat(inputFatPct).toFixed(1));
    } else {
      // Deurenberg Formula
      const genderFactor = gender === 'Male' ? 1 : 0;
      bodyFatPct = parseFloat(((1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4).toFixed(1));
      bodyFatPct = Math.max(5.0, Math.min(60.0, bodyFatPct));
    }

    if (inputVisceralFat && !isNaN(parseFloat(inputVisceralFat)) && parseFloat(inputVisceralFat) > 0) {
      visceralFatRating = parseInt(inputVisceralFat);
    } else {
      // Clinical estimate from waist, BMI, age
      let baseVF = (bmi - 20) * 0.8 + (age - 20) * 0.1;
      if (waistCm && !isNaN(parseFloat(waistCm))) {
        const threshold = gender === 'Male' ? 90 : 80;
        if (parseFloat(waistCm) >= threshold) {
          baseVF += (parseFloat(waistCm) - threshold) * 0.25;
        }
      }
      visceralFatRating = Math.max(1, Math.min(30, Math.round(baseVF)));
    }

    // Body Fat Category Cutoffs
    let fatCategory = 'Healthy Body Fat';
    let fatBadge = 'badge-green';
    const maleCutoffs = { low: 10, normalMax: 20, highMax: 25 };
    const femaleCutoffs = { low: 18, normalMax: 28, highMax: 35 };
    const cutoffs = gender === 'Male' ? maleCutoffs : femaleCutoffs;

    if (bodyFatPct < cutoffs.low) {
      fatCategory = 'Low Body Fat';
      fatBadge = 'badge-blue';
    } else if (bodyFatPct <= cutoffs.normalMax) {
      fatCategory = 'Healthy Body Fat';
      fatBadge = 'badge-green';
    } else if (bodyFatPct <= cutoffs.highMax) {
      fatCategory = 'Elevated Body Fat';
      fatBadge = 'badge-yellow';
    } else {
      fatCategory = 'High Body Fat (Obesity Risk)';
      fatBadge = 'badge-red';
    }

    // Visceral Fat Category (1-9 Normal, 10-14 At Risk, ≥15 High Risk)
    let visceralCategory = 'Healthy (1–9)';
    let visceralBadge = 'badge-green';
    let visceralRiskText = 'Level 1–9: Healthy Visceral Fat Level';

    if (visceralFatRating <= 9) {
      visceralCategory = 'Healthy (1–9)';
      visceralBadge = 'badge-green';
      visceralRiskText = 'Level 1–9: Healthy Visceral Fat Level';
    } else if (visceralFatRating <= 14) {
      visceralCategory = 'Elevated (10–14)';
      visceralBadge = 'badge-yellow';
      visceralRiskText = 'Level 10–14: Elevated Visceral Fat Around Organs';
    } else {
      visceralCategory = 'High Risk (≥15)';
      visceralBadge = 'badge-red';
      visceralRiskText = 'Level ≥15: High Visceral Fat — Organ Health Risk';
    }

    // Skeletal Muscle Mass Estimate
    const muscleMassPct = parseFloat((100 - bodyFatPct - 15).toFixed(1)); // ~15% bone/minerals/fluid

    // Metabolic Age Estimate
    let metabolicAge = age;
    if (bmi >= 25 || visceralFatRating >= 10) {
      metabolicAge = Math.min(80, Math.round(age + (visceralFatRating - 7) * 1.5));
    } else if (bmi < 23 && visceralFatRating <= 7) {
      metabolicAge = Math.max(18, Math.round(age - 3));
    }

    return {
      bodyFatPct,
      fatCategory,
      fatBadge,
      visceralFatRating,
      visceralCategory,
      visceralBadge,
      visceralRiskText,
      muscleMassPct,
      metabolicAge
    };
  },

  /**
   * Complete Assessment Calculation Pipeline (v3.0 — Body Composition & Visceral Fat Added)
   */
  processAssessment(patientData) {
    const heightCm = this.parseHeightCm(patientData.height);
    const bmiData = this.calculateBMI(parseFloat(patientData.weight), heightCm);
    const bmr = this.calculateBMR(parseFloat(patientData.weight), heightCm, parseInt(patientData.age), patientData.gender);
    const energyData = this.calculateEnergyRequirements(bmr, patientData.activity, bmiData ? bmiData.bmi : 22);
    const autoGoal = energyData.autoGoal;
    const proteinData = this.calculateProteinRequirement(parseFloat(patientData.weight), bmiData ? bmiData.category : '', autoGoal);
    const waterData = this.calculateWaterRequirement(parseFloat(patientData.weight));
    const gaps = this.analyzeGaps(patientData, waterData.liters);
    const ibw = this.calculateIBW(heightCm, patientData.gender);
    const metabolicRisk = this.assessMetabolicRisk(patientData.waistCm, patientData.gender);
    const bodyComp = this.calculateBodyComposition(
      bmiData ? bmiData.bmi : 22,
      parseInt(patientData.age),
      patientData.gender,
      patientData.waistCm,
      patientData.bodyFatPct,
      patientData.visceralFat
    );

    const bmrRecommendation = `BMR is ${bmr} kcal/day (Mifflin-St Jeor resting metabolism). Maintain daily intake at/above ${bmr} kcal/day, meet ICMR protein target (${proteinData.recommendedProtein}g/day), and add 2 days/week resistance training.`;

    return {
      ...patientData,
      height: heightCm,
      patientGoal: autoGoal,
      bmi: bmiData ? bmiData.bmi : 0,
      bmiCategory: bmiData ? bmiData.category : 'N/A',
      bmiCategoryClass: bmiData ? bmiData.categoryClass : 'badge-yellow',
      bmiRiskLevel: bmiData ? bmiData.riskLevel : '',
      healthyWeightRange: bmiData ? bmiData.healthyWeightRange : '--',
      weightTargetText: bmiData ? bmiData.weightTargetText : '',
      weightTargetBadge: bmiData ? bmiData.weightTargetBadge : 'badge-green',
      weightTargetKg: bmiData ? bmiData.weightTargetKg : 0,
      ibw,
      metabolicRisk,
      bodyComp,
      bmr,
      activityCalories: energyData.activityCalories,
      tdee: energyData.tdee,
      weightLossCalories: energyData.targetCalories,
      goalDescription: energyData.goalDescription,
      proteinRequirement: proteinData.recommendedProtein,
      proteinRange: proteinData.range,
      waterRequirement: waterData.liters,
      waterGlasses: waterData.glasses,
      waterRecommendation: waterData.recommendation,
      bmrRecommendation,
      gaps
    };
  }
};

window.ClinicalCalculator = ClinicalCalculator;
