"use strict";

// Statistics supplied by the project brief; not yet verified against the NESDC source report.
const REPORT_STATS = Object.freeze({
  yearBE:2568,
  yearCE:2025,
  povertyLine:3044,
  povertyRate:3.27,
  povertyPopulationMillions:2.30,
  householdIncome:12651,
  householdExpenses:7917,
  foodShare:51.92,
  dependencyRatio:101.64,
  mpi:0.0235,
  multidimensionalPovertyRate:6.43,
  multidimensionalPopulationMillions:4.53,
  livingConditionsContribution:40.54,
  educationTransportShare:42.76,
  healthCoverage:86.76,
  elderlyCoverage:97.06,
  agriculturalWageGrowth:4.88,
  // No Gini value was supplied. Do not display this as zero or invent a value.
  gini:null
});

const REPORT_DISPLAY = Object.freeze(Object.fromEntries(
  Object.entries(REPORT_STATS).map(([key,value]) => {
    if(value===null) return [key,null];
    if(["povertyLine","householdIncome","householdExpenses"].includes(key)){
      return [key,value.toLocaleString("th-TH")];
    }
    if(key==="mpi") return [key,value.toFixed(4)];
    if(key==="yearBE" || key==="yearCE") return [key,String(value)];
    return [key,value.toFixed(2)];
  }).concat([["dependentsPerWorker",(REPORT_STATS.dependencyRatio/100).toFixed(2)]])
));

const W = 960, H = 540, GROUND = 420, ZONE_WIDTH = 1700, END = 6650;

// Gameplay settings are illustrative, not measured policy effects.
const GAME_CONFIG = Object.freeze({
  initialQuality:70,
  startX:80,
  speed:245,
  jumpVelocity:-510,
  gravity:1300,
  acceleration:1900,
  saveKey:"poverty-journey-adventure-v2",
  saveVersion:2
});
