/**
 * Nutrislims Health Camp Screening Tool - Concise Bullet-Point Prescription Engine
 * Medically Rigorous, Aligned with ICMR-NIN 2020 Dietary Guidelines for Indians
 */

const RecommendationEngine = {
  generateRecommendations(assessment) {
    const rxBullets = [];
    const foodSwaps = [];
    const exerciseBullets = [];

    const diet = assessment.dietType || 'Pure Vegetarian';
    const gaps = assessment.gaps || {};

    // 1. Weight Target Bullet Point (Formula-linked to WHO Asian BMI)
    if (assessment.weightTargetText) {
      rxBullets.push(`Weight Goal: ${assessment.weightTargetText} (Target Healthy Weight Range: ${assessment.healthyWeightRange}).`);
    }

    // 2. Caloric Target Bullet Point (Formula-linked to Goal & BMR constraint)
    if (assessment.bmi < 18.5) {
      rxBullets.push(`Calorie Target: Increase daily energy intake to ${assessment.weightLossCalories} kcal/day (400 kcal surplus over TDEE ${assessment.tdee} kcal).`);
    } else if (assessment.bmi >= 23.0) {
      rxBullets.push(`Calorie Target: Prescribed safe deficit intake of ${assessment.weightLossCalories} kcal/day (Enforced minimum intake at/above BMR ${assessment.bmr} kcal).`);
    } else {
      rxBullets.push(`Calorie Target: Maintain daily energy intake around ${assessment.tdee} kcal/day for energy balance.`);
    }

    // 3. Protein & BMR Preservation Goal (Formula-linked to ICMR-NIN RDA)
    rxBullets.push(`Protein Goal (ICMR-NIN): Consume ${assessment.proteinRequirement} g/day (~${Math.round(assessment.proteinRequirement / 3)}g protein per main meal) to protect BMR & preserve lean muscle mass.`);

    // 4. Hydration Deficit / Goal Bullet Point (Formula-linked to 35 ml/kg)
    const targetGlasses = Math.round(assessment.waterRequirement * 4);
    if (gaps.water && gaps.water.gap > 0.3) {
      rxBullets.push(`Hydration Goal (ICMR): Drink ${targetGlasses} glasses (${assessment.waterRequirement} L)/day (Add +${gaps.water.gapGlasses || Math.round(gaps.water.gap * 4)} glasses/day to fix deficit).`);
    } else {
      rxBullets.push(`Hydration Goal (ICMR): Maintain current optimal fluid intake of ${targetGlasses} glasses (${assessment.waterRequirement} L)/day.`);
    }

    // 5. Fruits & Veggies Deficit / Goal Bullet Point (WHO & ICMR 400g / 5 servings target)
    if (gaps.fruitVeg && gaps.fruitVeg.gap > 0.5) {
      rxBullets.push(`Fiber & Veggie Goal (ICMR 400g): Eat 5 servings/day (Add +${gaps.fruitVeg.gap} servings: 2 fresh fruits + 3 bowls raw salad/cooked veggies daily).`);
    } else {
      rxBullets.push(`Fiber & Veggie Goal (ICMR 400g): Maintain optimal intake of 5 servings/day (400g/day).`);
    }

    // 6. Indian ICMR Food Swap Cards (Tailored to Dietary Preference)
    if (diet.includes('Vegetarian')) {
      foodSwaps.push('Swap refined wheat/rice for Millets (Jowar, Bajra, Ragi, Foxtail) & Brown rice.');
      foodSwaps.push('Swap fried snacks (Samosa/Namkeen) for Roasted Makhana, Boiled Chana, or Sprouts.');
      foodSwaps.push('Primary Protein Sources: Low-fat Paneer, Moong Dal, Sattu, Tofu, Greek Curd.');
    } else if (diet.includes('Eggetarian')) {
      foodSwaps.push('Swap refined flour for Whole Wheat, Oats & Millets.');
      foodSwaps.push('Swap bakery snacks for Boiled Egg Whites & Roasted Chana.');
      foodSwaps.push('Primary Protein Sources: Egg Whites, Low-fat Paneer, Tofu, Lentils, Curd.');
    } else if (diet.includes('Non-Vegetarian')) {
      foodSwaps.push('Swap deep-fried red meat for Grilled Skinless Chicken & Steamed Fish.');
      foodSwaps.push('Swap white rice for Millets (Jowar/Ragi) & Whole Wheat Roti.');
      foodSwaps.push('Primary Protein Sources: Fish, Chicken breast, Egg whites, Dal, Tofu.');
    } else if (diet === 'Vegan') {
      foodSwaps.push('Swap dairy milk for Soy milk or Almond milk.');
      foodSwaps.push('Swap packaged snacks for Pumpkin/Flax Seeds & Roasted Chana.');
      foodSwaps.push('Primary Protein Sources: Tofu, Soy chunks, Moong Dal, Sattu, Plant protein.');
    }

    // 7. WHO Activity Guidelines (150 mins/week moderate activity + 2 days resistance)
    if (gaps.activity && gaps.activity.gap > 0) {
      exerciseBullets.push(`Aerobic Goal (WHO): Brisk walk 30 mins, 5 days/week (Reach 150 mins/week target to fix -${gaps.activity.gap} min gap).`);
      exerciseBullets.push('Strength Goal: Include 2 days/week of bodyweight squats, wall pushups, and stretching to elevate BMR.');
    } else {
      exerciseBullets.push('Aerobic Goal (WHO): Maintain active fitness routine (≥150 mins/week).');
      exerciseBullets.push('Strength Goal: Continue cardio and strength training 3-4 days/week to elevate BMR.');
    }

    // 8. Sugary Drinks & Added Sugar Prescription (ICMR <25g added sugar target)
    if (assessment.sugaryDrinks === 'Daily' || assessment.sugaryDrinks === 'Weekly') {
      rxBullets.push('Sugary Drinks Cutback: Replace sweet tea/coffee & soft drinks with plain water, unsweetened buttermilk, or lemon water.');
    }

    // 9. Medical Condition Clinical Note
    if (assessment.medicalCondition && assessment.medicalCondition !== 'None') {
      rxBullets.push(`Clinical Follow-up: Clinical diet consultation recommended for ${assessment.medicalCondition}.`);
    }

    return {
      recommendations: rxBullets,
      foodSwaps,
      exerciseAdvice: exerciseBullets,
      followUp: assessment.bmi >= 23 || (assessment.medicalCondition && assessment.medicalCondition !== 'None') ? 'Re-assess in 30 days' : 'Annual Health Screening'
    };
  }
};

window.RecommendationEngine = RecommendationEngine;
