import { useState, useMemo, useEffect } from "react";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "sheep_lab_tests_v1";
async function loadTests() {
  try { const v = localStorage.getItem(STORAGE_KEY); return v ? JSON.parse(v) : null; }
  catch(e) { return null; }
}
async function saveTests(tests) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tests)); }
  catch(e) { console.error("Storage error:", e); }
}

// ─── NRC 2007 ANIMAL CLASSES ──────────────────────────────────────────────────
// Ca and P stored as lb (from spreadsheet), converted to grams in display (*453.6)
const ANIMAL_CLASSES = [
  // ── EWES: MAINTENANCE ──
  { id:"ew_m_88",   group:"Ewe – Maintenance",        bw:88,  dmi:1.69, tdn:0.90, cp:0.123, ca:0.00396, p:0.00286 },
  { id:"ew_m_110",  group:"Ewe – Maintenance",        bw:110, dmi:2.00, tdn:1.08, cp:0.145, ca:0.00440, p:0.00330 },
  { id:"ew_m_132",  group:"Ewe – Maintenance",        bw:132, dmi:2.31, tdn:1.23, cp:0.167, ca:0.00484, p:0.00396 },
  { id:"ew_m_154",  group:"Ewe – Maintenance",        bw:154, dmi:2.60, tdn:1.36, cp:0.187, ca:0.00528, p:0.00440 },
  { id:"ew_m_176",  group:"Ewe – Maintenance",        bw:176, dmi:2.86, tdn:1.52, cp:0.207, ca:0.00572, p:0.00484 },
  { id:"ew_m_198",  group:"Ewe – Maintenance",        bw:198, dmi:3.12, tdn:1.65, cp:0.227, ca:0.00616, p:0.00550 },
  { id:"ew_m_220",  group:"Ewe – Maintenance",        bw:220, dmi:3.39, tdn:1.80, cp:0.244, ca:0.00660, p:0.00594 },
  // ── EWES: BREEDING/FLUSHING ──
  { id:"ew_b_88",   group:"Ewe – Breeding/Flushing",  bw:88,  dmi:1.87, tdn:0.99, cp:0.145, ca:0.00462, p:0.00330 },
  { id:"ew_b_110",  group:"Ewe – Breeding/Flushing",  bw:110, dmi:2.22, tdn:1.17, cp:0.169, ca:0.00528, p:0.00396 },
  { id:"ew_b_132",  group:"Ewe – Breeding/Flushing",  bw:132, dmi:2.53, tdn:1.34, cp:0.196, ca:0.00572, p:0.00462 },
  { id:"ew_b_154",  group:"Ewe – Breeding/Flushing",  bw:154, dmi:2.86, tdn:1.52, cp:0.218, ca:0.00638, p:0.00528 },
  { id:"ew_b_176",  group:"Ewe – Breeding/Flushing",  bw:176, dmi:3.15, tdn:1.67, cp:0.242, ca:0.00682, p:0.00594 },
  { id:"ew_b_198",  group:"Ewe – Breeding/Flushing",  bw:198, dmi:3.43, tdn:1.83, cp:0.264, ca:0.00748, p:0.00638 },
  // ── EWES: EARLY GESTATION (twin) ──
  { id:"ew_eg_88",  group:"Ewe – Early Gestation (twin)", bw:88,  dmi:2.53, tdn:1.34, cp:0.209, ca:0.01056, p:0.00704 },
  { id:"ew_eg_110", group:"Ewe – Early Gestation (twin)", bw:110, dmi:2.88, tdn:1.54, cp:0.235, ca:0.01188, p:0.00814 },
  { id:"ew_eg_132", group:"Ewe – Early Gestation (twin)", bw:132, dmi:3.32, tdn:1.76, cp:0.273, ca:0.01298, p:0.00924 },
  { id:"ew_eg_154", group:"Ewe – Early Gestation (twin)", bw:154, dmi:3.72, tdn:1.96, cp:0.301, ca:0.01430, p:0.01012 },
  { id:"ew_eg_176", group:"Ewe – Early Gestation (twin)", bw:176, dmi:4.05, tdn:2.16, cp:0.330, ca:0.01540, p:0.01122 },
  // ── EWES: LATE GESTATION SINGLE ──
  { id:"ew_lgs_88",  group:"Ewe – Late Gest. Single",  bw:88,  dmi:2.20, tdn:1.45, cp:0.211, ca:0.00946, p:0.00572 },
  { id:"ew_lgs_110", group:"Ewe – Late Gest. Single",  bw:110, dmi:3.19, tdn:1.69, cp:0.264, ca:0.01122, p:0.00770 },
  { id:"ew_lgs_132", group:"Ewe – Late Gest. Single",  bw:132, dmi:3.59, tdn:1.89, cp:0.295, ca:0.01254, p:0.00880 },
  { id:"ew_lgs_154", group:"Ewe – Late Gest. Single",  bw:154, dmi:3.96, tdn:2.11, cp:0.328, ca:0.01342, p:0.00968 },
  { id:"ew_lgs_176", group:"Ewe – Late Gest. Single",  bw:176, dmi:4.36, tdn:2.31, cp:0.359, ca:0.01452, p:0.01056 },
  // ── EWES: LATE GESTATION TWIN ──
  { id:"ew_lgt_88",  group:"Ewe – Late Gest. Twins",  bw:88,  dmi:2.33, tdn:1.87, cp:0.271, ca:0.01386, p:0.00748 },
  { id:"ew_lgt_110", group:"Ewe – Late Gest. Twins",  bw:110, dmi:3.23, tdn:2.13, cp:0.326, ca:0.01606, p:0.00946 },
  { id:"ew_lgt_132", group:"Ewe – Late Gest. Twins",  bw:132, dmi:3.63, tdn:2.40, cp:0.363, ca:0.01782, p:0.01056 },
  { id:"ew_lgt_154", group:"Ewe – Late Gest. Twins",  bw:154, dmi:4.03, tdn:2.66, cp:0.403, ca:0.01936, p:0.01166 },
  { id:"ew_lgt_176", group:"Ewe – Late Gest. Twins",  bw:176, dmi:4.38, tdn:2.90, cp:0.436, ca:0.02068, p:0.01276 },
  // ── EWES: LATE GESTATION TRIPLETS ──
  { id:"ew_lgtr_110",group:"Ewe – Late Gest. Triplets",bw:110, dmi:3.10, tdn:2.46, cp:0.363, ca:0.01914, p:0.01034 },
  { id:"ew_lgtr_132",group:"Ewe – Late Gest. Triplets",bw:132, dmi:3.45, tdn:2.75, cp:0.403, ca:0.02090, p:0.01144 },
  { id:"ew_lgtr_154",group:"Ewe – Late Gest. Triplets",bw:154, dmi:4.55, tdn:3.01, cp:0.466, ca:0.02376, p:0.01408 },
  { id:"ew_lgtr_176",group:"Ewe – Late Gest. Triplets",bw:176, dmi:4.97, tdn:3.30, cp:0.506, ca:0.02552, p:0.01518 },
  // ── EWES: EARLY LACTATION SINGLE ──
  { id:"ew_els_88",  group:"Ewe – Early Lact. Single", bw:88,  dmi:2.40, tdn:1.58, cp:0.328, ca:0.00902, p:0.00748 },
  { id:"ew_els_110", group:"Ewe – Early Lact. Single", bw:110, dmi:2.77, tdn:1.83, cp:0.372, ca:0.01012, p:0.00858 },
  { id:"ew_els_132", group:"Ewe – Early Lact. Single", bw:132, dmi:3.89, tdn:2.07, cp:0.440, ca:0.01188, p:0.01100 },
  { id:"ew_els_154", group:"Ewe – Early Lact. Single", bw:154, dmi:4.31, tdn:2.29, cp:0.482, ca:0.01298, p:0.01210 },
  { id:"ew_els_176", group:"Ewe – Early Lact. Single", bw:176, dmi:4.69, tdn:2.49, cp:0.521, ca:0.01386, p:0.01298 },
  // ── EWES: EARLY LACTATION TWIN ──
  { id:"ew_elt_88",  group:"Ewe – Early Lact. Twins",  bw:88,  dmi:3.08, tdn:2.05, cp:0.469, ca:0.01320, p:0.01100 },
  { id:"ew_elt_110", group:"Ewe – Early Lact. Twins",  bw:110, dmi:3.54, tdn:2.35, cp:0.532, ca:0.01474, p:0.01254 },
  { id:"ew_elt_132", group:"Ewe – Early Lact. Twins",  bw:132, dmi:3.96, tdn:2.64, cp:0.590, ca:0.01606, p:0.01386 },
  { id:"ew_elt_154", group:"Ewe – Early Lact. Twins",  bw:154, dmi:4.36, tdn:2.88, cp:0.642, ca:0.01738, p:0.01518 },
  { id:"ew_elt_176", group:"Ewe – Early Lact. Twins",  bw:176, dmi:4.73, tdn:3.15, cp:0.693, ca:0.01870, p:0.01628 },
  // ── EWES: EARLY LACTATION 3+ ──
  { id:"ew_el3_110", group:"Ewe – Early Lact. 3+ Lambs",bw:110,dmi:4.14, tdn:2.73, cp:0.653, ca:0.01826, p:0.01540 },
  { id:"ew_el3_132", group:"Ewe – Early Lact. 3+ Lambs",bw:132,dmi:4.60, tdn:3.04, cp:0.719, ca:0.02002, p:0.01716 },
  { id:"ew_el3_154", group:"Ewe – Early Lact. 3+ Lambs",bw:154,dmi:5.04, tdn:3.34, cp:0.783, ca:0.02156, p:0.01870 },
  { id:"ew_el3_176", group:"Ewe – Early Lact. 3+ Lambs",bw:176,dmi:6.84, tdn:3.63, cp:0.889, ca:0.02486, p:0.02266 },
  // ── MARKET LAMBS: young late-maturing (age=4mo, maturity=0.3) ──
  { id:"lm_44_022",  group:"Lamb – Young Late-Maturing", bw:44,  adg:0.22, dmi:1.25, tdn:0.66, cp:0.161, ca:0.00506, p:0.00330 },
  { id:"lm_44_033",  group:"Lamb – Young Late-Maturing", bw:44,  adg:0.33, dmi:1.72, tdn:0.90, cp:0.218, ca:0.00682, p:0.00484 },
  { id:"lm_44_044",  group:"Lamb – Young Late-Maturing", bw:44,  adg:0.44, dmi:1.30, tdn:0.86, cp:0.244, ca:0.00814, p:0.00550 },
  { id:"lm_66_044",  group:"Lamb – Young Late-Maturing", bw:66,  adg:0.44, dmi:2.31, tdn:1.23, cp:0.288, ca:0.00902, p:0.00638 },
  { id:"lm_66_055",  group:"Lamb – Young Late-Maturing", bw:66,  adg:0.55, dmi:1.67, tdn:1.10, cp:0.306, ca:0.00990, p:0.00704 },
  { id:"lm_66_066",  group:"Lamb – Young Late-Maturing", bw:66,  adg:0.66, dmi:1.94, tdn:1.28, cp:0.356, ca:0.01166, p:0.00836 },
  { id:"lm_88_055",  group:"Lamb – Young Late-Maturing", bw:88,  adg:0.55, dmi:2.90, tdn:1.54, cp:0.359, ca:0.01100, p:0.00814 },
  { id:"lm_88_066",  group:"Lamb – Young Late-Maturing", bw:88,  adg:0.66, dmi:3.39, tdn:1.80, cp:0.418, ca:0.01298, p:0.00968 },
  { id:"lm_88_088",  group:"Lamb – Young Late-Maturing", bw:88,  adg:0.88, dmi:2.55, tdn:1.69, cp:0.469, ca:0.01540, p:0.01122 },
  { id:"lm_110_055", group:"Lamb – Young Late-Maturing", bw:110, adg:0.55, dmi:3.04, tdn:1.61, cp:0.372, ca:0.01122, p:0.00836 },
  { id:"lm_110_066", group:"Lamb – Young Late-Maturing", bw:110, adg:0.66, dmi:3.50, tdn:1.87, cp:0.429, ca:0.01320, p:0.00990 },
  { id:"lm_110_088", group:"Lamb – Young Late-Maturing", bw:110, adg:0.88, dmi:2.66, tdn:1.76, cp:0.480, ca:0.01540, p:0.01122 },
  { id:"lm_110_110", group:"Lamb – Young Late-Maturing", bw:110, adg:1.10, dmi:3.19, tdn:2.11, cp:0.581, ca:0.01892, p:0.01386 },
  { id:"lm_132_055", group:"Lamb – Young Late-Maturing", bw:132, adg:0.55, dmi:3.15, tdn:1.67, cp:0.383, ca:0.01122, p:0.00836 },
  { id:"lm_132_066", group:"Lamb – Young Late-Maturing", bw:132, adg:0.66, dmi:3.63, tdn:1.91, cp:0.442, ca:0.01320, p:0.00990 },
  { id:"lm_132_088", group:"Lamb – Young Late-Maturing", bw:132, adg:0.88, dmi:4.58, tdn:2.42, cp:0.559, ca:0.01716, p:0.01298 },
  { id:"lm_154_033", group:"Lamb – Young Late-Maturing", bw:154, adg:0.33, dmi:2.29, tdn:1.21, cp:0.275, ca:0.00748, p:0.00528 },
  { id:"lm_154_044", group:"Lamb – Young Late-Maturing", bw:154, adg:0.44, dmi:2.77, tdn:1.47, cp:0.334, ca:0.00946, p:0.00682 },
  { id:"lm_154_066", group:"Lamb – Young Late-Maturing", bw:154, adg:0.66, dmi:3.74, tdn:1.98, cp:0.453, ca:0.01342, p:0.01012 },
  { id:"lm_154_088", group:"Lamb – Young Late-Maturing", bw:154, adg:0.88, dmi:4.71, tdn:2.49, cp:0.570, ca:0.01738, p:0.01320 },
  // ── MARKET LAMBS: young early-maturing (age=4mo, maturity=0.6) ──
  { id:"le_44_022",  group:"Lamb – Young Early-Maturing",bw:44,  adg:0.22, dmi:1.39, tdn:0.92, cp:0.145, ca:0.00462, p:0.00330 },
  { id:"le_44_033",  group:"Lamb – Young Early-Maturing",bw:44,  adg:0.33, dmi:1.43, tdn:1.14, cp:0.176, ca:0.00572, p:0.00440 },
  { id:"le_44_044",  group:"Lamb – Young Early-Maturing",bw:44,  adg:0.44, dmi:1.83, tdn:1.45, cp:0.222, ca:0.00748, p:0.00594 },
  { id:"le_66_044",  group:"Lamb – Young Early-Maturing",bw:66,  adg:0.44, dmi:2.64, tdn:1.74, cp:0.262, ca:0.00814, p:0.00660 },
  { id:"le_66_055",  group:"Lamb – Young Early-Maturing",bw:66,  adg:0.55, dmi:2.33, tdn:1.85, cp:0.279, ca:0.00924, p:0.00748 },
  { id:"le_66_066",  group:"Lamb – Young Early-Maturing",bw:66,  adg:0.66, dmi:2.75, tdn:2.18, cp:0.326, ca:0.01078, p:0.00880 },
  { id:"le_88_055",  group:"Lamb – Young Early-Maturing",bw:88,  adg:0.55, dmi:3.30, tdn:2.20, cp:0.326, ca:0.01012, p:0.00836 },
  { id:"le_88_066",  group:"Lamb – Young Early-Maturing",bw:88,  adg:0.66, dmi:2.84, tdn:2.24, cp:0.337, ca:0.01100, p:0.00902 },
  { id:"le_88_088",  group:"Lamb – Young Early-Maturing",bw:88,  adg:0.88, dmi:3.65, tdn:2.90, cp:0.429, ca:0.01408, p:0.01188 },
  { id:"le_110_055", group:"Lamb – Young Early-Maturing",bw:110, adg:0.55, dmi:3.41, tdn:2.27, cp:0.339, ca:0.01012, p:0.00836 },
  { id:"le_110_066", group:"Lamb – Young Early-Maturing",bw:110, adg:0.66, dmi:3.98, tdn:2.64, cp:0.392, ca:0.01188, p:0.01012 },
  { id:"le_110_088", group:"Lamb – Young Early-Maturing",bw:110, adg:0.88, dmi:3.74, tdn:2.97, cp:0.440, ca:0.01430, p:0.01188 },
  { id:"le_110_110", group:"Lamb – Young Early-Maturing",bw:110, adg:1.10, dmi:4.58, tdn:3.63, cp:0.532, ca:0.01760, p:0.01496 },
  { id:"le_132_055", group:"Lamb – Young Early-Maturing",bw:132, adg:0.55, dmi:3.52, tdn:2.33, cp:0.350, ca:0.01034, p:0.00858 },
  { id:"le_132_066", group:"Lamb – Young Early-Maturing",bw:132, adg:0.66, dmi:4.09, tdn:2.71, cp:0.403, ca:0.01210, p:0.01012 },
  { id:"le_154_033", group:"Lamb – Young Early-Maturing",bw:154, adg:0.33, dmi:3.98, tdn:2.11, cp:0.319, ca:0.00814, p:0.00682 },
  { id:"le_154_044", group:"Lamb – Young Early-Maturing",bw:154, adg:0.44, dmi:5.02, tdn:2.66, cp:0.389, ca:0.01034, p:0.00902 },
  { id:"le_154_066", group:"Lamb – Young Early-Maturing",bw:154, adg:0.66, dmi:4.20, tdn:2.77, cp:0.414, ca:0.01210, p:0.01034 },
  // ── RAMS ──
  { id:"ram_m_220",  group:"Ram – Maintenance",        bw:220, dmi:3.89, tdn:2.07, cp:0.268, ca:0.00726, p:0.00682 },
  { id:"ram_m_275",  group:"Ram – Maintenance",        bw:275, dmi:4.60, tdn:2.44, cp:0.319, ca:0.00836, p:0.00814 },
  { id:"ram_m_330",  group:"Ram – Maintenance",        bw:330, dmi:5.28, tdn:2.79, cp:0.370, ca:0.00946, p:0.00946 },
  { id:"ram_m_440",  group:"Ram – Maintenance",        bw:440, dmi:6.56, tdn:3.48, cp:0.462, ca:0.01144, p:0.01166 },
  { id:"ram_p_220",  group:"Ram – Prebreeding",        bw:220, dmi:4.29, tdn:2.27, cp:0.317, ca:0.00792, p:0.00748 },
  { id:"ram_p_275",  group:"Ram – Prebreeding",        bw:275, dmi:7.26, tdn:2.68, cp:0.376, ca:0.00924, p:0.00902 },
  { id:"ram_p_330",  group:"Ram – Prebreeding",        bw:330, dmi:5.81, tdn:3.08, cp:0.433, ca:0.01034, p:0.01034 },
  { id:"ram_p_440",  group:"Ram – Prebreeding",        bw:440, dmi:7.19, tdn:3.83, cp:0.543, ca:0.01254, p:0.01298 },
  // ── REPLACEMENT EWE LAMBS ──
  { id:"rep_m_88",   group:"Replacement – Maint+Growth",bw:88,  adg:0.088,dmi:2.60, tdn:1.72, cp:0.205, ca:0.00682, p:0.00374 },
  { id:"rep_m_110",  group:"Replacement – Maint+Growth",bw:110, adg:0.110,dmi:3.15, tdn:2.09, cp:0.246, ca:0.00814, p:0.00462 },
  { id:"rep_m_132",  group:"Replacement – Maint+Growth",bw:132, adg:0.132,dmi:3.67, tdn:2.44, cp:0.288, ca:0.00924, p:0.00550 },
  { id:"rep_m_154",  group:"Replacement – Maint+Growth",bw:154, adg:0.154,dmi:4.20, tdn:2.79, cp:0.328, ca:0.01056, p:0.00638 },
  { id:"rep_b_88",   group:"Replacement – Breeding",   bw:88,  adg:0.132,dmi:2.82, tdn:1.87, cp:0.231, ca:0.00792, p:0.00462 },
  { id:"rep_b_110",  group:"Replacement – Breeding",   bw:110, adg:0.163,dmi:3.41, tdn:2.27, cp:0.277, ca:0.00946, p:0.00550 },
  { id:"rep_b_132",  group:"Replacement – Breeding",   bw:132, adg:0.194,dmi:3.98, tdn:2.64, cp:0.323, ca:0.01078, p:0.00660 },
  { id:"rep_b_154",  group:"Replacement – Breeding",   bw:154, adg:0.222,dmi:4.55, tdn:3.01, cp:0.370, ca:0.01232, p:0.00748 },
];

const ANIMAL_GROUPS = [...new Set(ANIMAL_CLASSES.map(a=>a.group))];

// ─── BOOK FEED LIBRARY ────────────────────────────────────────────────────────
const BOOK_FEEDS = [
  { id:"alf_hay_early",  name:"Alfalfa Hay – Early Bloom",   cat:"Legume Hay",   dm:90,tdn:59,cp:19,ca:1.41,p:0.26 },
  { id:"alf_hay_mid",    name:"Alfalfa Hay – Mid Bloom",     cat:"Legume Hay",   dm:89,tdn:58,cp:17,ca:1.40,p:0.24 },
  { id:"alf_hay_full",   name:"Alfalfa Hay – Full Bloom",    cat:"Legume Hay",   dm:88,tdn:54,cp:16,ca:1.20,p:0.23 },
  { id:"alf_hay_mature", name:"Alfalfa Hay – Mature",        cat:"Legume Hay",   dm:88,tdn:50,cp:13,ca:1.18,p:0.19 },
  { id:"alf_cube",       name:"Alfalfa Cubes",               cat:"Legume Hay",   dm:91,tdn:57,cp:18,ca:1.30,p:0.23 },
  { id:"clover_red",     name:"Clover – Red Hay",            cat:"Legume Hay",   dm:88,tdn:55,cp:15,ca:1.50,p:0.25 },
  { id:"clover_ladino",  name:"Clover – Ladino Hay",         cat:"Legume Hay",   dm:90,tdn:61,cp:21,ca:1.35,p:0.32 },
  { id:"brome_hay",      name:"Bromegrass Hay",              cat:"Grass Hay",    dm:89,tdn:55,cp:10,ca:0.40,p:0.23 },
  { id:"grass_hay",      name:"Grass Hay",                   cat:"Grass Hay",    dm:88,tdn:58,cp:10,ca:0.60,p:0.21 },
  { id:"timothy_e",      name:"Timothy Hay – Early Bloom",   cat:"Grass Hay",    dm:88,tdn:59,cp:11,ca:0.58,p:0.26 },
  { id:"timothy_f",      name:"Timothy Hay – Full Bloom",    cat:"Grass Hay",    dm:88,tdn:57,cp:8, ca:0.43,p:0.20 },
  { id:"orchard",        name:"Orchardgrass Hay",            cat:"Grass Hay",    dm:88,tdn:59,cp:10,ca:0.32,p:0.30 },
  { id:"fescue_e",       name:"Fescue Hay – Early Bloom",    cat:"Grass Hay",    dm:88,tdn:65,cp:18,ca:0.45,p:0.37 },
  { id:"fescue_m",       name:"Fescue Hay – Mature",         cat:"Grass Hay",    dm:88,tdn:52,cp:11,ca:0.45,p:0.26 },
  { id:"prairie_hay",    name:"Prairie Hay",                 cat:"Grass Hay",    dm:91,tdn:50,cp:7, ca:0.40,p:0.15 },
  { id:"sudan_hay",      name:"Sudangrass Hay",              cat:"Grass Hay",    dm:88,tdn:57,cp:9, ca:0.50,p:0.22 },
  { id:"rye_grass",      name:"Ryegrass Hay",                cat:"Grass Hay",    dm:90,tdn:58,cp:10,ca:0.40,p:0.31 },
  { id:"soybean_hay",    name:"Soybean Hay",                 cat:"Grass Hay",    dm:89,tdn:52,cp:15,ca:1.29,p:0.30 },
  { id:"vetch_hay",      name:"Vetch Hay",                   cat:"Grass Hay",    dm:89,tdn:58,cp:18,ca:1.25,p:0.34 },
  { id:"oat_hay",        name:"Oat Hay",                     cat:"Grass Hay",    dm:90,tdn:54,cp:10,ca:0.40,p:0.27 },
  { id:"corn_silage",    name:"Corn Silage",                 cat:"Silage",       dm:34,tdn:72,cp:8, ca:0.28,p:0.23 },
  { id:"alf_silage",     name:"Alfalfa Silage",              cat:"Silage",       dm:30,tdn:55,cp:18,ca:1.40,p:0.29 },
  { id:"grass_silage",   name:"Grass Silage",                cat:"Silage",       dm:30,tdn:61,cp:11,ca:0.70,p:0.24 },
  { id:"wheat_straw",    name:"Wheat Straw",                 cat:"Straw",        dm:91,tdn:42,cp:3, ca:0.16,p:0.05 },
  { id:"barley_straw",   name:"Barley Straw",                cat:"Straw",        dm:90,tdn:43,cp:4, ca:0.33,p:0.08 },
  { id:"oat_straw",      name:"Oat Straw",                   cat:"Straw",        dm:91,tdn:48,cp:4, ca:0.24,p:0.07 },
  { id:"corn_stover",    name:"Corn Stover",                 cat:"Straw",        dm:80,tdn:59,cp:5, ca:0.39,p:0.19 },
  { id:"corn_grain",     name:"Corn Grain",                  cat:"Grain",        dm:88,tdn:88,cp:9, ca:0.02,p:0.30 },
  { id:"oats",           name:"Oats",                        cat:"Grain",        dm:89,tdn:76,cp:13,ca:0.05,p:0.41 },
  { id:"barley",         name:"Barley Grain",                cat:"Grain",        dm:89,tdn:84,cp:12,ca:0.06,p:0.38 },
  { id:"wheat",          name:"Wheat Grain",                 cat:"Grain",        dm:89,tdn:88,cp:14,ca:0.05,p:0.43 },
  { id:"milo",           name:"Sorghum Grain (Milo)",        cat:"Grain",        dm:89,tdn:82,cp:11,ca:0.04,p:0.32 },
  { id:"rye_grain",      name:"Rye Grain",                   cat:"Grain",        dm:89,tdn:82,cp:12,ca:0.07,p:0.39 },
  { id:"ear_corn",       name:"Ear Corn",                    cat:"Grain",        dm:87,tdn:82,cp:9, ca:0.06,p:0.28 },
  { id:"sbm_44",         name:"Soybean Meal 44%",            cat:"Protein",      dm:91,tdn:84,cp:49,ca:0.38,p:0.71 },
  { id:"sbm_49",         name:"Soybean Meal 49%",            cat:"Protein",      dm:91,tdn:87,cp:54,ca:0.28,p:0.71 },
  { id:"whole_sb",       name:"Soybeans – Whole",            cat:"Protein",      dm:88,tdn:93,cp:40,ca:0.27,p:0.64 },
  { id:"csm",            name:"Cottonseed Meal",             cat:"Protein",      dm:90,tdn:77,cp:48,ca:0.22,p:1.25 },
  { id:"whole_cotton",   name:"Whole Cottonseed",            cat:"Protein",      dm:91,tdn:95,cp:23,ca:0.14,p:0.64 },
  { id:"ddgs",           name:"DDGS (Corn)",                 cat:"Protein",      dm:91,tdn:90,cp:29,ca:0.15,p:0.78 },
  { id:"sunflower_meal", name:"Sunflower Meal",              cat:"Protein",      dm:92,tdn:65,cp:38,ca:0.58,p:0.27 },
  { id:"canola_meal",    name:"Canola Meal",                 cat:"Protein",      dm:90,tdn:72,cp:38,ca:0.74,p:1.14 },
  { id:"cgf",            name:"Corn Gluten Feed",            cat:"Protein",      dm:90,tdn:80,cp:22,ca:0.12,p:0.85 },
  { id:"sbh",            name:"Soybean Hulls",               cat:"Protein",      dm:90,tdn:77,cp:12,ca:0.55,p:0.17 },
  { id:"beet_pulp",      name:"Beet Pulp – Dry",             cat:"Protein",      dm:91,tdn:75,cp:11,ca:0.65,p:0.08 },
  { id:"wheat_bran",     name:"Wheat Bran",                  cat:"Protein",      dm:89,tdn:70,cp:17,ca:0.13,p:1.29 },
  { id:"wheat_mid",      name:"Wheat Middlings",             cat:"Protein",      dm:89,tdn:82,cp:19,ca:0.15,p:1.02 },
  { id:"com_supp",       name:"Commercial Supplement",       cat:"Protein",      dm:89,tdn:72,cp:38,ca:1.60,p:0.95 },
  { id:"limestone",      name:"Limestone – Ground",          cat:"Mineral",      dm:98,tdn:0, cp:0, ca:34.0,p:0.02 },
  { id:"dical_phos",     name:"Dicalcium Phosphate",         cat:"Mineral",      dm:96,tdn:0, cp:0, ca:35.0,p:0.52 },
  { id:"salt",           name:"Salt (NaCl)",                 cat:"Mineral",      dm:100,tdn:0,cp:0, ca:0,   p:0    },
  { id:"amm_cl",         name:"Ammonium Chloride",           cat:"Mineral",      dm:99,tdn:0, cp:0, ca:0,   p:0    },
];

const FEED_CATS = ["Legume Hay","Grass Hay","Silage","Straw","Grain","Protein","Mineral"];

const INITIAL_LAB_TESTS = [
  { id:"lab_grass_balage", name:"Grass Balage (Jon's)", cat:"Grass Hay", source:"lab", archived:false,
    sampleNo:"5FJFV", labDate:"2025-12-12", feedType:"Haylage – Grass", description:"grass balage",
    dm:42.17, moisture:57.83, pH:4.05, cp:6.87, adf:41.02, aNDF:58.51, tdn:59.12, nem:56.45, neg:30.69,
    ca:0.61, p:0.26, mg:0.22, k:0.74, ash:8.88, fat:3.30, rfv:90.54,
    costPerTon:0, notes:"Dairyland Labs #5FJFV, Dec 2025" },
  { id:"lab_2nd_cut", name:"2nd Cut Grass Hay (Jon's)", cat:"Grass Hay", source:"lab", archived:false,
    sampleNo:"5FJFT", labDate:"2025-12-12", feedType:"Hay – Grass", description:"2nd cut grass 12-8-25",
    dm:72.59, moisture:27.41, pH:null, cp:6.73, adf:48.45, aNDF:66.61, tdn:51.12, nem:44.19, neg:19.35,
    ca:0.45, p:0.12, mg:0.25, k:0.91, ash:10.47, fat:2.01, rfv:71.44,
    costPerTon:0, notes:"Dairyland Labs #5FJFT, Dec 2025" },
];

const BLANK_TEST = { name:"",cat:"Grass Hay",dm:88,cp:10,tdn:55,ca:0.50,p:0.20,nem:0,neg:0,
  costPerTon:0,notes:"",moisture:0,pH:"",ash:0,fat:0,rfv:0,k:0,mg:0,adf:0,aNDF:0,
  source:"manual",archived:false,feedType:"",sampleNo:"",labDate:"",description:"" };

const pOf=(h,n)=>n>0?(h/n)*100:null;

// Colors: amber theme
const C = {
  bg:       "#0f0d0a",
  panel:    "#141210",
  card:     "#1a1714",
  border:   "#2a2520",
  border2:  "#332e28",
  accent:   "#c8922a",
  accentDim:"#7a5818",
  accentBg: "#1e1710",
  green:    "#5a9a5a",
  greenBg:  "#0e180e",
  greenBdr: "#1e3a1e",
  red:      "#c05040",
  redBg:    "#1a0e0e",
  orange:   "#d4822a",
  text:     "#e8e0d0",
  textDim:  "#8a8070",
  textMute: "#504840",
  labGreen: "#6ab06a",
};

const sc = p => p===null?C.textMute:p<85?C.red:p<=115?C.green:C.orange;
const sl = p => p===null?"—":p<85?"LOW":p<=115?"OK":"HIGH";
const fmtDate = d => d ? new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "";

export default function SheepRationTool() {
  const [animalId,   setAnimalId]   = useState("ew_m_110");
  const [numHead,    setNumHead]    = useState(1);
  const [rations,    setRations]    = useState([]);
  const [amounts,    setAmounts]    = useState({});
  const [feedCosts,  setFeedCosts]  = useState({});
  const [tab,        setTab]        = useState("builder");
  const [filterCat,  setFilterCat]  = useState("All");
  const [addId,      setAddId]      = useState(BOOK_FEEDS[0].id);
  const [labTests,   setLabRaw]     = useState(INITIAL_LAB_TESTS);
  const [storageOk,  setStorageOk]  = useState(false);
  const [testTab,    setTestTab]    = useState("list");
  const [editTest,   setEditTest]   = useState(null);
  const [viewTest,   setViewTest]   = useState(null);
  const [formData,   setFormData]   = useState({...BLANK_TEST,id:"lab_"+Date.now()});
  const [showArch,   setShowArch]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [parsing,    setParsing]    = useState(false);
  const [parseErr,   setParseErr]   = useState(null);
  const [selGroup,   setSelGroup]   = useState("Ewe – Maintenance");

  useEffect(()=>{
    loadTests().then(saved=>{
      if(saved&&Array.isArray(saved)&&saved.length>0) setLabRaw(saved);
      setStorageOk(true);
    });
  },[]);

  const setLabTests = upd => {
    setLabRaw(prev=>{
      const next = typeof upd==="function"?upd(prev):upd;
      saveTests(next);
      return next;
    });
  };

  const animal = ANIMAL_CLASSES.find(a=>a.id===animalId) || ANIMAL_CLASSES[0];
  const activeLab = labTests.filter(t=>!t.archived);
  const archivedLab = labTests.filter(t=>t.archived);

  const allFeeds = useMemo(()=>[
    ...activeLab.map(t=>({id:t.id,name:t.name,cat:t.cat,source:"lab",dm:t.dm,tdn:t.tdn,cp:t.cp,ca:t.ca,p:t.p})),
    ...BOOK_FEEDS
  ],[activeLab]);

  const rationFeeds = rations.map(id=>allFeeds.find(f=>f.id===id)).filter(Boolean);

  const totals = useMemo(()=>{
    let dmi=0,tdn=0,cp=0,ca=0,p=0,asFed=0,cost=0;
    rationFeeds.forEach(feed=>{
      const af=parseFloat(amounts[feed.id]||0);
      const dm=af*(feed.dm/100);
      dmi+=dm; tdn+=dm*(feed.tdn/100); cp+=dm*(feed.cp/100);
      ca+=dm*(feed.ca/100); p+=dm*(feed.p/100);
      asFed+=af;
      cost+=af*(parseFloat(feedCosts[feed.id]||0)/100);
    });
    return{dmi,tdn,cp,ca,p,asFed,cost};
  },[rationFeeds,amounts,feedCosts]);

  // animal Ca/P are in lb — convert to same unit as totals for comparison
  const pcts = {
    dmi: pOf(totals.dmi, animal.dmi),
    tdn: pOf(totals.tdn, animal.tdn),
    cp:  pOf(totals.cp,  animal.cp),
    ca:  pOf(totals.ca,  animal.ca),
    p:   pOf(totals.p,   animal.p),
  };
  const caP = totals.p>0 ? totals.ca/totals.p : null;

  const addFeed = () => {
    if(!rations.includes(addId)){
      setRations(r=>[...r,addId]);
      setAmounts(a=>({...a,[addId]:""}));
    }
  };
  const removeFeed = id => {
    setRations(r=>r.filter(x=>x!==id));
    setAmounts(a=>{const n={...a};delete n[id];return n;});
  };
  const openNew = () => { setEditTest(null); setFormData({...BLANK_TEST,id:"lab_"+Date.now()}); setParseErr(null); setTestTab("form"); };
  const openEdit = t => { setEditTest(t.id); setFormData({...t}); setParseErr(null); setTestTab("form"); };
  const saveTest = () => {
    if(!formData.name.trim()) return;
    const entry={...formData,source:formData.source||"manual",archived:false};
    if(editTest) setLabTests(prev=>prev.map(t=>t.id===editTest?entry:t));
    else setLabTests(prev=>[entry,...prev]);
    setTestTab("list");
  };

  const parsePDF = async file => {
    setParsing(true); setParseErr(null);
    try {
      const b64 = await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=()=>rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const resp = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},
            {type:"text",text:'Extract all values from this feed lab report and return ONLY a JSON object:\n{"name":"short name","feedType":"feed type","description":"description","sampleNo":"sample no","labDate":"YYYY-MM-DD","dm":number,"moisture":number,"pH":number_or_null,"cp":number,"adf":number_or_null,"aNDF":number_or_null,"tdn":number_use_OARDC_if_available,"nem":number_or_null,"neg":number_or_null,"ca":number,"p":number,"mg":number_or_null,"k":number_or_null,"ash":number_or_null,"fat":number_or_null,"rfv":number_or_null,"notes":"lab name and sample info"}\nReturn ONLY JSON, no markdown.'}
          ]}]
        })
      });
      const data = await resp.json();
      const raw = data.content?.find(b=>b.type==="text")?.text||"";
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setFormData(prev=>({...prev,
        name:parsed.name||prev.name, feedType:parsed.feedType||"", description:parsed.description||"",
        sampleNo:parsed.sampleNo||"", labDate:parsed.labDate||"",
        dm:parsed.dm??prev.dm, moisture:parsed.moisture??0, pH:parsed.pH??null,
        cp:parsed.cp??prev.cp, adf:parsed.adf??0, aNDF:parsed.aNDF??0,
        tdn:parsed.tdn??prev.tdn, nem:parsed.nem??0, neg:parsed.neg??0,
        ca:parsed.ca??prev.ca, p:parsed.p??prev.p, mg:parsed.mg??0, k:parsed.k??0,
        ash:parsed.ash??0, fat:parsed.fat??0, rfv:parsed.rfv??0,
        notes:parsed.notes||"", source:"lab",
      }));
    } catch(err){ setParseErr("Parse failed: "+err.message); }
    finally{ setParsing(false); }
  };

  const recs = useMemo(()=>{
    if(!rationFeeds.length) return [];
    const r=[];
    if(pcts.dmi!==null&&pcts.dmi<85)  r.push({t:"low",m:"DMI below requirement — increase feed offered"});
    if(pcts.dmi!==null&&pcts.dmi>120) r.push({t:"hi", m:"DMI exceeds requirement"});
    if(pcts.tdn!==null&&pcts.tdn<85)  r.push({t:"low",m:"Energy (TDN) deficient — add corn, barley, or higher-quality hay"});
    if(pcts.tdn!==null&&pcts.tdn>120) r.push({t:"hi", m:"Energy (TDN) excessive — reduce grain"});
    if(pcts.cp !==null&&pcts.cp <85)  r.push({t:"low",m:"Protein deficient — add SBM, canola meal, or DDGS"});
    if(pcts.cp !==null&&pcts.cp >130) r.push({t:"hi", m:"Protein excessive — reduce supplement"});
    if(pcts.ca !==null&&pcts.ca <85)  r.push({t:"low",m:"Calcium low — add limestone or alfalfa"});
    if(pcts.p  !==null&&pcts.p  <85)  r.push({t:"low",m:"Phosphorus low — add dicalcium phosphate or grain"});
    if(caP!==null&&caP<1.5) r.push({t:"warn",m:`Ca:P ${caP.toFixed(2)}:1 too narrow — urinary calculi risk; add limestone`});
    if(caP!==null&&caP>5.0) r.push({t:"warn",m:`Ca:P ${caP.toFixed(2)}:1 very wide — may impair P absorption`});
    if(!r.length)            r.push({t:"ok",  m:"Ration balanced — all nutrients within acceptable range"});
    return r;
  },[pcts,caP,rationFeeds]);

  // format Ca/P for display — convert from lb to grams
  const caLb = totals.ca;
  const pLb  = totals.p;
  const caNeed = animal.ca; // lb
  const pNeed  = animal.p;  // lb

  const MBar = ({label,have,need,unit,pct,dec=3})=>{
    const color=sc(pct); const bw=Math.min(Math.max(pct||0,0),150); const diff=pct!==null?have-need:null;
    return(
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:1.5,textTransform:"uppercase"}}>{label}</span>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:12}}>
              <span style={{color:C.text}}>{have.toFixed(dec)}</span>
              <span style={{color:C.textMute}}> / </span>
              <span style={{color:C.textDim}}>{need.toFixed(dec)} {unit}</span>
            </span>
            {diff!==null&&<span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:diff<0?C.red:diff>0?C.orange:C.green,minWidth:65,textAlign:"right"}}>{diff>=0?"+":""}{diff.toFixed(dec)}</span>}
            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:700,color,minWidth:36,textAlign:"right"}}>{sl(pct)}</span>
          </div>
        </div>
        <div style={{background:C.bg,borderRadius:3,height:5,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",left:"66.7%",top:0,bottom:0,width:1,background:C.border2}}/>
          <div style={{width:bw*0.667+"%",background:color,height:"100%",borderRadius:3,transition:"width 0.3s ease",maxWidth:"100%",opacity:0.85}}/>
        </div>
      </div>
    );
  };

  const FField=({label,k,type="number",step="0.01",note})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:130}}>{label}</label>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {note&&<span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute}}>{note}</span>}
        <input type={type} step={step} value={formData[k]??""} onChange={e=>setFormData(p=>({...p,[k]:type==="number"?parseFloat(e.target.value)||0:e.target.value}))} style={{width:130}}/>
      </div>
    </div>
  );

  const groupedByWeight = useMemo(()=>{
    return ANIMAL_CLASSES.filter(a=>a.group===selGroup);
  },[selGroup]);

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Georgia',serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@700;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
        select,input[type=number],input[type=text],textarea{background:${C.panel}!important;color:${C.text}!important;border:1px solid ${C.border}!important;border-radius:4px;padding:5px 8px;font-family:'DM Mono',monospace;font-size:11px;outline:none;transition:border-color 0.15s}
        select:focus,input:focus,textarea:focus{border-color:${C.accentDim}!important}
        select option{background:${C.panel}}
        button{cursor:pointer;font-family:'DM Mono',monospace;transition:all 0.15s}
        .feed-row:hover{background:${C.card}!important}
        .tag{display:inline-block;padding:1px 6px;border-radius:3px;font-size:8px;font-family:'DM Mono',monospace;letter-spacing:1px;font-weight:500}
        .btn-primary{background:${C.accentBg};color:${C.accent};border:1px solid ${C.accentDim};border-radius:4px;padding:6px 14px;font-size:9px;letter-spacing:1.5px;text-transform:uppercase}
        .btn-primary:hover{background:#261e0e;border-color:${C.accent}}
        .btn-ghost{background:transparent;color:${C.textDim};border:1px solid ${C.border};border-radius:4px;padding:6px 12px;font-size:9px;letter-spacing:1px}
        .btn-ghost:hover{border-color:${C.border2};color:${C.text}}
        .btn-danger{background:transparent;color:#904040;border:1px solid #401818;border-radius:4px;padding:6px 12px;font-size:9px}
        .btn-danger:hover{background:#1a0808;color:${C.red}}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:C.accent,letterSpacing:-0.5,lineHeight:1}}>Sheep Ration Tool</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:3}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute,letterSpacing:2}}>NRC 2007 · TDN/CP BASIS · EWES · LAMBS · RAMS</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:storageOk?C.green:C.textMute}}/>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:7,color:storageOk?C.green:C.textMute}}>{storageOk?"SAVED":"..."}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,overflow:"hidden"}}>
          {["builder","summary","herd","library","my tests"].map(t=>(
            <button key={t} onClick={()=>{setTab(t);if(t==="my tests")setTestTab("list");}} style={{
              padding:"7px 14px",background:tab===t?C.accentBg:"transparent",
              color:tab===t?C.accent:C.textMute,border:"none",
              fontSize:9,letterSpacing:1.5,textTransform:"uppercase",position:"relative"
            }}>
              {t}
              {t==="my tests"&&activeLab.length>0&&<span style={{position:"absolute",top:3,right:3,background:C.accent,color:C.bg,borderRadius:8,fontSize:7,padding:"0 3px",fontWeight:700,lineHeight:"12px"}}>{activeLab.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",minHeight:"calc(100vh - 60px)"}}>

        {/* ── LEFT PANEL ── */}
        <div style={{background:C.panel,borderRight:`1px solid ${C.border}`,padding:"16px 14px",overflowY:"auto",display:"flex",flexDirection:"column",gap:14}}>

          {/* Animal selector */}
          <div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:7,textTransform:"uppercase"}}>Animal Category</div>
            <select value={selGroup} onChange={e=>{setSelGroup(e.target.value);const first=ANIMAL_CLASSES.find(a=>a.group===e.target.value);if(first)setAnimalId(first.id);}} style={{width:"100%",marginBottom:8}}>
              {ANIMAL_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>
              {animal.adg!==undefined?"Body Weight / ADG":"Body Weight"}
            </div>
            <select value={animalId} onChange={e=>setAnimalId(e.target.value)} style={{width:"100%"}}>
              {groupedByWeight.map(a=>(
                <option key={a.id} value={a.id}>
                  {a.bw} lb{a.adg!==undefined?` · ${a.adg} lb/day gain`:""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>Number of Head</div>
            <input type="number" min={1} value={numHead} onChange={e=>setNumHead(parseInt(e.target.value)||1)} style={{width:"100%"}}/>
          </div>

          {/* Requirements card */}
          <div style={{background:C.accentBg,border:`1px solid ${C.accentDim}`,borderRadius:6,padding:"12px 14px"}}>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accent,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Requirements / Head / Day</div>
            {[
              ["DMI",animal.dmi,"lb DM"],
              ["TDN",animal.tdn,"lb"],
              ["CP", animal.cp, "lb"],
              ["Ca", (animal.ca*453.6).toFixed(1),"g"],
              ["P",  (animal.p *453.6).toFixed(1),"g"],
            ].map(([l,v,u])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim}}>{l}</span>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.text}}>{v} <span style={{color:C.textMute}}>{u}</span></span>
              </div>
            ))}
            <div style={{fontFamily:"DM Mono,monospace",fontSize:7,color:C.accentDim,textAlign:"right",marginTop:8,letterSpacing:1}}>NRC 2007</div>
          </div>

          {/* Add feeds */}
          <div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:7,textTransform:"uppercase"}}>Add to Ration</div>
            {activeLab.length>0&&(
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.labGreen,letterSpacing:1,marginBottom:5}}>YOUR LAB TESTS</div>
                {activeLab.map(t=>(
                  <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,padding:"5px 8px",background:C.greenBg,border:`1px solid ${C.greenBdr}`,borderRadius:4}}>
                    <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</span>
                    <button onClick={()=>{if(!rations.includes(t.id)){setRations(r=>[...r,t.id]);setAmounts(a=>({...a,[t.id]:""}));}}} style={{background:C.greenBg,color:C.labGreen,border:`1px solid ${C.greenBdr}`,borderRadius:3,padding:"2px 8px",fontSize:10,marginLeft:6,flexShrink:0}}>+ Add</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute,letterSpacing:1,marginBottom:5}}>BOOK FEEDS</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:7}}>
              {["All","Grain","Protein","Mineral"].map(c=>(
                <button key={c} onClick={()=>setFilterCat(c)} style={{padding:"2px 7px",fontSize:8,background:filterCat===c?C.accentBg:C.bg,color:filterCat===c?C.accent:C.textMute,border:`1px solid ${filterCat===c?C.accentDim:C.border}`,borderRadius:3}}>{c}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:6}}>
              <select value={addId} onChange={e=>setAddId(e.target.value)} style={{flex:1,minWidth:0}}>
                {FEED_CATS.filter(c=>filterCat==="All"||c===filterCat).map(cat=>(
                  <optgroup key={cat} label={cat}>
                    {BOOK_FEEDS.filter(f=>f.cat===cat).map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}
                  </optgroup>
                ))}
              </select>
              <button onClick={addFeed} className="btn-primary" style={{padding:"5px 12px",fontSize:16,letterSpacing:0}}>+</button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{padding:"18px 22px",overflowY:"auto"}}>

          {/* ════ BUILDER ════ */}
          {tab==="builder"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>Ration — As-Fed lb / Head / Day</div>
              {rationFeeds.length===0?(
                <div style={{border:`1px dashed ${C.border}`,borderRadius:6,padding:"32px 0",textAlign:"center",color:C.textMute,fontFamily:"DM Mono,monospace",fontSize:12,marginBottom:16}}>
                  ← Add ingredients from the left panel
                </div>
              ):(
                <div style={{marginBottom:16,overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`}}>
                        {["Feed","$/cwt","As-Fed lb","DM lb","TDN lb","CP lb","Ca lb","P lb",""].map(h=>(
                          <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,textAlign:h==="Feed"?"left":"right",padding:"4px 7px 5px",fontWeight:400,letterSpacing:1}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rationFeeds.map((feed,i)=>{
                        const af=parseFloat(amounts[feed.id]||0);
                        const dm=af*(feed.dm/100);
                        return(
                          <tr key={feed.id} className="feed-row" style={{borderBottom:`1px solid ${C.bg}`,background:i%2===0?"transparent":C.card}}>
                            <td style={{padding:"6px 7px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:5}}>
                                {feed.source==="lab"&&<span className="tag" style={{background:C.greenBg,color:C.labGreen,border:`1px solid ${C.greenBdr}`}}>LAB</span>}
                                <span style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.text}}>{feed.name}</span>
                              </div>
                              <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute,marginTop:1}}>{feed.cat} · {feed.dm}% DM</div>
                            </td>
                            <td style={{padding:"6px 7px"}}><input type="number" min={0} step={1} value={feedCosts[feed.id]||""} onChange={e=>setFeedCosts(p=>({...p,[feed.id]:e.target.value}))} style={{width:60,textAlign:"right"}} placeholder="0"/></td>
                            <td style={{padding:"6px 7px"}}><input type="number" min={0} step={0.1} value={amounts[feed.id]||""} onChange={e=>setAmounts(p=>({...p,[feed.id]:e.target.value}))} style={{width:65,textAlign:"right"}} placeholder="0.0"/></td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{dm.toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{(dm*feed.tdn/100).toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{(dm*feed.cp/100).toFixed(3)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{(dm*feed.ca/100).toFixed(4)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{(dm*feed.p/100).toFixed(4)}</td>
                            <td style={{padding:"6px 4px"}}><button onClick={()=>removeFeed(feed.id)} style={{background:"transparent",color:"#6a2a2a",border:`1px solid #2a1212`,borderRadius:3,padding:"2px 6px",fontSize:10}}>✕</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{borderTop:`2px solid ${C.accentDim}`}}>
                        <td colSpan={2} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,padding:"7px 7px",letterSpacing:1}}>TOTAL / HEAD / DAY</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"7px 7px"}}>{totals.asFed.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"7px 7px"}}>{totals.dmi.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"7px 7px"}}>{totals.tdn.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"7px 7px"}}>{totals.cp.toFixed(3)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"7px 7px"}}>{totals.ca.toFixed(4)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"7px 7px"}}>{totals.p.toFixed(4)}</td>
                        <td/>
                      </tr>
                    </tfoot>
                  </table>
                  {totals.cost>0&&<div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.accent,textAlign:"right",marginTop:6}}>${totals.cost.toFixed(2)}/head/day · ${(totals.cost*numHead).toFixed(2)}/herd/day · ${(totals.cost*numHead*365).toFixed(0)}/yr</div>}
                </div>
              )}

              {/* Balance bars */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"16px 18px",marginBottom:12}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Nutrient Balance &nbsp;·&nbsp; have / need · delta · status</div>
                <MBar label="Dry Matter Intake" have={totals.dmi} need={animal.dmi} unit="lb DM" pct={pcts.dmi} dec={2}/>
                <MBar label="TDN" have={totals.tdn} need={animal.tdn} unit="lb" pct={pcts.tdn} dec={2}/>
                <MBar label="Crude Protein" have={totals.cp} need={animal.cp} unit="lb" pct={pcts.cp} dec={3}/>
                <MBar label="Calcium" have={totals.ca} need={animal.ca} unit="lb" pct={pcts.ca} dec={4}/>
                <MBar label="Phosphorus" have={totals.p} need={animal.p} unit="lb" pct={pcts.p} dec={4}/>
                <div style={{borderTop:`1px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:1}}>Ca:P RATIO</span>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:13,color:caP!==null&&caP>=1.5&&caP<=5?C.green:C.red}}>
                    {caP!==null?caP.toFixed(2)+" : 1":"—"}
                    <span style={{fontSize:9,color:C.textMute,marginLeft:10}}>target 1.5–5:1</span>
                  </span>
                </div>
              </div>

              {recs.length>0&&(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:"12px 16px"}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Recommendations</div>
                  {recs.map((r,i)=>(
                    <div key={i} style={{fontFamily:"DM Mono,monospace",fontSize:11,color:r.t==="ok"?C.green:r.t==="low"?C.red:r.t==="hi"?C.orange:C.orange,marginBottom:5}}>
                      {r.t==="ok"?"✓":r.t==="low"?"▲":r.t==="hi"?"▼":"⚠"} {r.m}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════ SUMMARY ════ */}
          {tab==="summary"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>{animal.group} · {animal.bw} lb — Evaluation</div>
              {rationFeeds.length===0?(
                <div style={{color:C.textMute,fontFamily:"DM Mono,monospace",fontSize:12,padding:30,textAlign:"center"}}>Build a ration in the Builder tab first.</div>
              ):(
                <>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"14px 16px",marginBottom:14}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Deficiencies / Surpluses</div>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{borderBottom:`1px solid ${C.border}`}}>
                          {["Nutrient","Required","Provided","Difference","% Met"].map(h=>(
                            <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,textAlign:h==="Nutrient"?"left":"right",padding:"3px 8px",fontWeight:400}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {l:"DMI (lb)",  req:animal.dmi, have:totals.dmi, pct:pcts.dmi, dec:2},
                          {l:"TDN (lb)",  req:animal.tdn, have:totals.tdn, pct:pcts.tdn, dec:2},
                          {l:"CP (lb)",   req:animal.cp,  have:totals.cp,  pct:pcts.cp,  dec:3},
                          {l:"Ca (lb)",   req:animal.ca,  have:totals.ca,  pct:pcts.ca,  dec:4},
                          {l:"P (lb)",    req:animal.p,   have:totals.p,   pct:pcts.p,   dec:4},
                        ].map(row=>{
                          const diff=row.have-row.req; const col=sc(row.pct);
                          return(
                            <tr key={row.l} style={{borderBottom:`1px solid ${C.bg}`}}>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,padding:"6px 8px"}}>{row.l}</td>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textMute,textAlign:"right",padding:"6px 8px"}}>{row.req.toFixed(row.dec)}</td>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:col,textAlign:"right",padding:"6px 8px"}}>{row.have.toFixed(row.dec)}</td>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:col,textAlign:"right",padding:"6px 8px"}}>{diff>=0?"+":""}{diff.toFixed(row.dec)}</td>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:col,textAlign:"right",padding:"6px 8px"}}>{row.pct!==null?row.pct.toFixed(0)+"%":"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Ingredient Breakdown</div>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`}}>
                        {["Feed","As-Fed lb","% Ration","DM lb","TDN lb","CP lb"].map(h=>(
                          <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,textAlign:h==="Feed"?"left":"right",padding:"3px 7px",fontWeight:400}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rationFeeds.map(feed=>{
                        const af=parseFloat(amounts[feed.id]||0); const dm=af*(feed.dm/100);
                        return(
                          <tr key={feed.id} style={{borderBottom:`1px solid ${C.bg}`}}>
                            <td style={{padding:"6px 7px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:5}}>
                                {feed.source==="lab"&&<span className="tag" style={{background:C.greenBg,color:C.labGreen,border:`1px solid ${C.greenBdr}`}}>LAB</span>}
                                <span style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.text}}>{feed.name}</span>
                              </div>
                            </td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{af.toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{totals.asFed>0?(af/totals.asFed*100).toFixed(1):0}%</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{dm.toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{(dm*feed.tdn/100).toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"6px 7px"}}>{(dm*feed.cp/100).toFixed(3)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* ════ HERD ════ */}
          {tab==="herd"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Herd Totals — {numHead} Head</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
                {[
                  ["As-Fed / Day",(totals.asFed*numHead).toFixed(1)+" lb"],
                  ["As-Fed / Week",(totals.asFed*numHead*7).toFixed(0)+" lb"],
                  ["As-Fed / 30 Days",(totals.asFed*numHead*30).toFixed(0)+" lb"],
                  ["DM / Day",(totals.dmi*numHead).toFixed(1)+" lb"],
                  ["TDN / Day",(totals.tdn*numHead).toFixed(1)+" lb"],
                  ["CP / Day",(totals.cp*numHead).toFixed(2)+" lb"],
                  ...(totals.cost>0?[
                    ["Cost / Day","$"+(totals.cost*numHead).toFixed(2)],
                    ["Cost / 30 Days","$"+(totals.cost*numHead*30).toFixed(0)],
                    ["Cost / Year","$"+(totals.cost*numHead*365).toFixed(0)],
                  ]:[]),
                ].map(([l,v])=>(
                  <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:"12px 14px"}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:16,color:C.text}}>{v}</div>
                  </div>
                ))}
              </div>
              {rationFeeds.length>0&&(
                <>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>By Ingredient</div>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`}}>
                        {["Ingredient","lb/Day","lb/Week","lb/30 Days","$/Day","$/Month"].map(h=>(
                          <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,textAlign:h==="Ingredient"?"left":"right",padding:"3px 7px",fontWeight:400}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rationFeeds.map(feed=>{
                        const af=parseFloat(amounts[feed.id]||0)*numHead;
                        const cpt=parseFloat(feedCosts[feed.id]||0);
                        const cd=af*(cpt/100);
                        return(
                          <tr key={feed.id} style={{borderBottom:`1px solid ${C.bg}`}}>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.text,padding:"7px 7px"}}>{feed.name}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"7px 7px"}}>{af.toFixed(1)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"7px 7px"}}>{(af*7).toFixed(0)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"7px 7px"}}>{(af*30).toFixed(0)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:cpt>0?C.textDim:C.textMute,textAlign:"right",padding:"7px 7px"}}>{cpt>0?"$"+cd.toFixed(2):"—"}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:cpt>0?C.textDim:C.textMute,textAlign:"right",padding:"7px 7px"}}>{cpt>0?"$"+(cd*30).toFixed(0):"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* ════ LIBRARY ════ */}
          {tab==="library"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Book Feed Library — {BOOK_FEEDS.length} Feeds</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
                {["All",...FEED_CATS].map(c=>(
                  <button key={c} onClick={()=>setFilterCat(c)} style={{padding:"3px 9px",fontSize:8,background:filterCat===c?C.accentBg:C.card,color:filterCat===c?C.accent:C.textMute,border:`1px solid ${filterCat===c?C.accentDim:C.border}`,borderRadius:3}}>
                    {c} ({c==="All"?BOOK_FEEDS.length:BOOK_FEEDS.filter(f=>f.cat===c).length})
                  </button>
                ))}
              </div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["Feed","Category","DM%","TDN%","CP%","Ca%","P%"].map(h=>(
                      <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,textAlign:["Feed","Category"].includes(h)?"left":"right",padding:"4px 7px 5px",fontWeight:400}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(filterCat==="All"?BOOK_FEEDS:BOOK_FEEDS.filter(f=>f.cat===filterCat)).map((f,i)=>(
                    <tr key={f.id} style={{borderBottom:`1px solid ${C.bg}`,background:i%2===0?"transparent":C.card}}>
                      <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.text,padding:"5px 7px"}}>{f.name}</td>
                      <td style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,padding:"5px 7px"}}>{f.cat}</td>
                      {[f.dm,f.tdn,f.cp,f.ca,f.p].map((v,j)=>(
                        <td key={j} style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.textDim,textAlign:"right",padding:"5px 7px"}}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ════ MY TESTS ════ */}
          {tab==="my tests"&&(
            <>
              {testTab!=="form"&&testTab!=="detail"&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,textTransform:"uppercase"}}>
                    My Feed Tests — {activeLab.length} Active{archivedLab.length>0?` · ${archivedLab.length} Archived`:""}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {archivedLab.length>0&&<button className="btn-ghost" onClick={()=>setShowArch(p=>!p)}>{showArch?"Hide Archived":"Show Archived"}</button>}
                    <button className="btn-primary" onClick={openNew}>+ New Entry</button>
                  </div>
                </div>
              )}

              {/* LIST */}
              {testTab==="list"&&(
                <>
                  {[...activeLab,...(showArch?archivedLab:[])].length===0?(
                    <div style={{border:`1px dashed ${C.border}`,borderRadius:6,padding:"32px 0",textAlign:"center",color:C.textMute,fontFamily:"DM Mono,monospace",fontSize:12}}>No feed tests yet — click "+ New Entry"</div>
                  ):(
                    [...activeLab,...(showArch?archivedLab:[])].map(t=>(
                      <div key={t.id} style={{background:C.card,border:`1px solid ${t.archived?C.border:C.border2}`,borderRadius:6,padding:"12px 14px",marginBottom:8,opacity:t.archived?0.6:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:14,color:C.text,fontWeight:500}}>{t.name}</span>
                              <span className="tag" style={{background:t.source==="lab"?C.greenBg:C.accentBg,color:t.source==="lab"?C.labGreen:C.accent,border:`1px solid ${t.source==="lab"?C.greenBdr:C.accentDim}`}}>{t.source==="lab"?"LAB":"MANUAL"}</span>
                              {t.archived&&<span className="tag" style={{background:C.card,color:C.textMute,border:`1px solid ${C.border}`}}>ARCHIVED</span>}
                            </div>
                            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim}}>
                              {t.cat}{t.labDate?` · ${fmtDate(t.labDate)}`:""}{t.sampleNo?` · #${t.sampleNo}`:""}
                            </div>
                            {t.description&&<div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textMute,marginTop:2}}>{t.description}</div>}
                          </div>
                          <div style={{display:"flex",gap:5,flexShrink:0}}>
                            <button className="btn-ghost" onClick={()=>{setViewTest(t);setTestTab("detail");}}>View</button>
                            <button className="btn-ghost" onClick={()=>openEdit(t)}>Edit</button>
                            {t.archived
                              ?<button className="btn-ghost" onClick={()=>setLabTests(p=>p.map(x=>x.id===t.id?{...x,archived:false}:x))}>Restore</button>
                              :<button className="btn-ghost" onClick={()=>setLabTests(p=>p.map(x=>x.id===t.id?{...x,archived:true}:x))}>Archive</button>
                            }
                            <button className="btn-danger" onClick={()=>setConfirmDel(t.id)}>Delete</button>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {[["DM",t.dm+"%"],["TDN",t.tdn+"%"],["CP",t.cp+"%"],["Ca",t.ca+"%"],["P",t.p+"%"],t.rfv?["RFV",""+t.rfv]:null].filter(Boolean).map(([l,v])=>(
                            <div key={l} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:3,padding:"3px 8px",display:"flex",gap:5}}>
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim}}>{l}</span>
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.text}}>{v}</span>
                            </div>
                          ))}
                        </div>
                        {confirmDel===t.id&&(
                          <div style={{marginTop:10,padding:"10px 12px",background:C.redBg,border:`1px solid #3a1818`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.red}}>Delete "{t.name}" permanently?</span>
                            <div style={{display:"flex",gap:6}}>
                              <button onClick={()=>{setLabTests(p=>p.filter(x=>x.id!==t.id));setConfirmDel(null);}} style={{background:"#3a1818",color:"#ff8888",border:"1px solid #5a2a2a",borderRadius:3,padding:"4px 12px",fontSize:9}}>Yes, Delete</button>
                              <button className="btn-ghost" onClick={()=>setConfirmDel(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}

              {/* DETAIL */}
              {testTab==="detail"&&viewTest&&(()=>{
                const t=labTests.find(x=>x.id===viewTest.id)||viewTest;
                return(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:C.accent}}>{t.name}</span>
                          <span className="tag" style={{background:t.source==="lab"?C.greenBg:C.accentBg,color:t.source==="lab"?C.labGreen:C.accent,border:`1px solid ${t.source==="lab"?C.greenBdr:C.accentDim}`}}>{t.source==="lab"?"LAB":"MANUAL"}</span>
                        </div>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim}}>{t.feedType}{t.labDate?` · ${fmtDate(t.labDate)}`:""}{t.sampleNo?` · #${t.sampleNo}`:""}</div>
                      </div>
                      <button className="btn-ghost" onClick={()=>setTestTab("list")}>← Back</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:"12px 14px"}}>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>As-Fed Basis</div>
                        {[["Dry Matter",t.dm+"%"],["Moisture",(t.moisture||100-t.dm).toFixed(2)+"%"],t.pH?["pH",""+t.pH]:null].filter(Boolean).map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.textMute}}>{l}</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.text}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:"12px 14px"}}>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>DM Basis Key Values</div>
                        {[["TDN",t.tdn+"%"],["CP",t.cp+"%"],["Ca",t.ca+"%"],["P",t.p+"%"],t.k?["K",t.k+"%"]:null,t.mg?["Mg",t.mg+"%"]:null,t.ash?["Ash",t.ash+"%"]:null,t.fat?["Fat (EE)",t.fat+"%"]:null,t.rfv?["RFV",""+t.rfv]:null].filter(Boolean).map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.textMute}}>{l}</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.text}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:"12px 14px"}}>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Energy (Mcal/cwt DM)</div>
                        {[["NEM",t.nem||"—"],["NEG",t.neg||"—"]].map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.textMute}}>{l}</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.text}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {t.notes&&(
                        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:"12px 14px"}}>
                          <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Notes</div>
                          <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,lineHeight:1.6}}>{t.notes}</div>
                        </div>
                      )}
                    </div>
                    <div style={{marginTop:14,display:"flex",gap:6}}>
                      <button className="btn-ghost" onClick={()=>openEdit(t)}>Edit</button>
                      {t.archived
                        ?<button className="btn-ghost" onClick={()=>{setLabTests(p=>p.map(x=>x.id===t.id?{...x,archived:false}:x));setTestTab("list");}}>Restore</button>
                        :<button className="btn-ghost" onClick={()=>{setLabTests(p=>p.map(x=>x.id===t.id?{...x,archived:true}:x));setTestTab("list");}}>Archive</button>
                      }
                    </div>
                  </div>
                );
              })()}

              {/* FORM */}
              {testTab==="form"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,textTransform:"uppercase"}}>{editTest?"Edit Feed Test":"New Feed Test"}</div>
                    <button className="btn-ghost" onClick={()=>setTestTab("list")}>← Cancel</button>
                  </div>
                  {!editTest&&(
                    <div style={{background:C.greenBg,border:`1px dashed ${C.greenBdr}`,borderRadius:5,padding:"12px 14px",marginBottom:14}}>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.labGreen,letterSpacing:2,marginBottom:7,textTransform:"uppercase"}}>Import from Lab PDF</div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.textDim,marginBottom:10,lineHeight:1.6}}>Upload a Dairyland Labs (or any lab) PDF and all fields will be auto-filled by AI. Review before saving.</div>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                        <label style={{background:C.greenBg,color:C.labGreen,border:`1px solid ${C.greenBdr}`,borderRadius:4,padding:"6px 14px",fontSize:9,letterSpacing:1,cursor:"pointer",display:"inline-block",textTransform:"uppercase"}}>
                          {parsing?"Reading PDF...":"📄 Upload PDF"}
                          <input type="file" accept="application/pdf" disabled={parsing} onChange={e=>{if(e.target.files[0])parsePDF(e.target.files[0]);}} style={{display:"none"}}/>
                        </label>
                        {parsing&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim}}>Parsing with AI, please wait...</span>}
                        {parseErr&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.red}}>{parseErr}</span>}
                        {!parsing&&!parseErr&&formData.sampleNo&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.green}}>✓ PDF parsed — review fields below</span>}
                      </div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Identification</div>
                      <FField label="Name *" k="name" type="text"/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:130}}>Category</label>
                        <select value={formData.cat} onChange={e=>setFormData(p=>({...p,cat:e.target.value}))} style={{width:130}}>
                          {FEED_CATS.map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <FField label="Description" k="description" type="text"/>
                      <FField label="Feed Type" k="feedType" type="text"/>
                      <FField label="Sample No." k="sampleNo" type="text"/>
                      <FField label="Lab Date (YYYY-MM-DD)" k="labDate" type="text"/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:130}}>Source</label>
                        <select value={formData.source} onChange={e=>setFormData(p=>({...p,source:e.target.value}))} style={{width:130}}>
                          <option value="manual">Manual Entry</option>
                          <option value="lab">Lab Test</option>
                        </select>
                      </div>
                      <FField label="$/cwt ($/100 lb)" k="costPerTon" note="as-fed"/>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,marginTop:14,textTransform:"uppercase"}}>As-Fed Basis</div>
                      <FField label="Dry Matter %" k="dm"/>
                      <FField label="Moisture %" k="moisture"/>
                      <FField label="pH" k="pH" type="text"/>
                    </div>
                    <div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Dry Matter Basis (%)</div>
                      <FField label="TDN % ★" k="tdn" note="used in ration"/>
                      <FField label="CP % ★" k="cp" note="used in ration"/>
                      <FField label="Ca % ★" k="ca" note="used in ration"/>
                      <FField label="P % ★" k="p" note="used in ration"/>
                      <FField label="ADF %" k="adf"/>
                      <FField label="aNDF %" k="aNDF"/>
                      <FField label="Ash %" k="ash"/>
                      <FField label="Fat (EE) %" k="fat"/>
                      <FField label="K %" k="k"/>
                      <FField label="Mg %" k="mg"/>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,marginTop:14,textTransform:"uppercase"}}>Energy (Mcal/cwt DM)</div>
                      <FField label="NEM" k="nem"/>
                      <FField label="NEG" k="neg"/>
                      <FField label="RFV" k="rfv"/>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:6,marginTop:14,textTransform:"uppercase"}}>Notes</div>
                      <textarea value={formData.notes||""} onChange={e=>setFormData(p=>({...p,notes:e.target.value}))} style={{width:"100%",height:60,resize:"vertical"}} placeholder="Lab, date, crop info..."/>
                    </div>
                  </div>
                  <div style={{marginTop:16,display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button className="btn-ghost" onClick={()=>setTestTab("list")}>Cancel</button>
                    <button className="btn-primary" onClick={saveTest} style={{opacity:formData.name.trim()?1:0.4}}>
                      {editTest?"Save Changes":"Add Feed Test"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}