import { useState, useMemo, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SB_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://pjopnhgbidmpzssghyoo.supabase.co";
const SB_KEY  = import.meta.env.VITE_SUPABASE_KEY  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb3BuaGdiaWRtcHpzc2doeW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjA5NDcsImV4cCI6MjA4Nzk5Njk0N30.CLBs2MDykvPEO683bNg7Rusa3foYnnzPOpyawinvFJY";

const sbFetch = async (path, opts={}) => {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(opts.headers||{}),
    },
  });
  if(!res.ok) { const e=await res.text(); throw new Error(e); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  // Lab tests
  getTests: ()       => sbFetch("lab_tests?order=created_at.desc"),
  upsertTest: (row)  => sbFetch("lab_tests", { method:"POST", headers:{"Prefer":"resolution=merge-duplicates,return=representation"}, body:JSON.stringify(row) }),
  deleteTest: (id)   => sbFetch(`lab_tests?id=eq.${id}`, { method:"DELETE" }),

  // Saved rations
  getRations: ()     => sbFetch("saved_rations?order=created_at.desc"),
  upsertRation: (r)  => sbFetch("saved_rations", { method:"POST", headers:{"Prefer":"resolution=merge-duplicates,return=representation"}, body:JSON.stringify(r) }),
  deleteRation: (id) => sbFetch(`saved_rations?id=eq.${id}`, { method:"DELETE" }),

  // Groups
  getGroups: ()      => sbFetch("sheep_groups?order=created_at.asc"),
  upsertGroup: (g)   => sbFetch("sheep_groups", { method:"POST", headers:{"Prefer":"resolution=merge-duplicates,return=representation"}, body:JSON.stringify(g) }),
  deleteGroup: (id)  => sbFetch(`sheep_groups?id=eq.${id}`, { method:"DELETE" }),
};

// ─── NRC 2007 ANIMAL CLASSES ──────────────────────────────────────────────────
const ANIMAL_CLASSES = [
  { id:"ew_m_88",    group:"Ewe – Maintenance",          bw:88,  dmi:1.69, tdn:0.90, cp:0.123, ca:0.00396, p:0.00286 },
  { id:"ew_m_110",   group:"Ewe – Maintenance",          bw:110, dmi:2.00, tdn:1.08, cp:0.145, ca:0.00440, p:0.00330 },
  { id:"ew_m_132",   group:"Ewe – Maintenance",          bw:132, dmi:2.31, tdn:1.23, cp:0.167, ca:0.00484, p:0.00396 },
  { id:"ew_m_154",   group:"Ewe – Maintenance",          bw:154, dmi:2.60, tdn:1.36, cp:0.187, ca:0.00528, p:0.00440 },
  { id:"ew_m_176",   group:"Ewe – Maintenance",          bw:176, dmi:2.86, tdn:1.52, cp:0.207, ca:0.00572, p:0.00484 },
  { id:"ew_m_198",   group:"Ewe – Maintenance",          bw:198, dmi:3.12, tdn:1.65, cp:0.227, ca:0.00616, p:0.00550 },
  { id:"ew_m_220",   group:"Ewe – Maintenance",          bw:220, dmi:3.39, tdn:1.80, cp:0.244, ca:0.00660, p:0.00594 },
  { id:"ew_b_88",    group:"Ewe – Breeding/Flushing",    bw:88,  dmi:1.87, tdn:0.99, cp:0.145, ca:0.00462, p:0.00330 },
  { id:"ew_b_110",   group:"Ewe – Breeding/Flushing",    bw:110, dmi:2.22, tdn:1.17, cp:0.169, ca:0.00528, p:0.00396 },
  { id:"ew_b_132",   group:"Ewe – Breeding/Flushing",    bw:132, dmi:2.53, tdn:1.34, cp:0.196, ca:0.00572, p:0.00462 },
  { id:"ew_b_154",   group:"Ewe – Breeding/Flushing",    bw:154, dmi:2.86, tdn:1.52, cp:0.218, ca:0.00638, p:0.00528 },
  { id:"ew_b_176",   group:"Ewe – Breeding/Flushing",    bw:176, dmi:3.15, tdn:1.67, cp:0.242, ca:0.00682, p:0.00594 },
  { id:"ew_b_198",   group:"Ewe – Breeding/Flushing",    bw:198, dmi:3.43, tdn:1.83, cp:0.264, ca:0.00748, p:0.00638 },
  { id:"ew_eg_88",   group:"Ewe – Early Gestation",      bw:88,  dmi:2.53, tdn:1.34, cp:0.209, ca:0.01056, p:0.00704 },
  { id:"ew_eg_110",  group:"Ewe – Early Gestation",      bw:110, dmi:2.88, tdn:1.54, cp:0.235, ca:0.01188, p:0.00814 },
  { id:"ew_eg_132",  group:"Ewe – Early Gestation",      bw:132, dmi:3.32, tdn:1.76, cp:0.273, ca:0.01298, p:0.00924 },
  { id:"ew_eg_154",  group:"Ewe – Early Gestation",      bw:154, dmi:3.72, tdn:1.96, cp:0.301, ca:0.01430, p:0.01012 },
  { id:"ew_eg_176",  group:"Ewe – Early Gestation",      bw:176, dmi:4.05, tdn:2.16, cp:0.330, ca:0.01540, p:0.01122 },
  { id:"ew_lgs_88",  group:"Ewe – Late Gest. Single",    bw:88,  dmi:2.20, tdn:1.45, cp:0.211, ca:0.00946, p:0.00572 },
  { id:"ew_lgs_110", group:"Ewe – Late Gest. Single",    bw:110, dmi:3.19, tdn:1.69, cp:0.264, ca:0.01122, p:0.00770 },
  { id:"ew_lgs_132", group:"Ewe – Late Gest. Single",    bw:132, dmi:3.59, tdn:1.89, cp:0.295, ca:0.01254, p:0.00880 },
  { id:"ew_lgs_154", group:"Ewe – Late Gest. Single",    bw:154, dmi:3.96, tdn:2.11, cp:0.328, ca:0.01342, p:0.00968 },
  { id:"ew_lgs_176", group:"Ewe – Late Gest. Single",    bw:176, dmi:4.36, tdn:2.31, cp:0.359, ca:0.01452, p:0.01056 },
  { id:"ew_lgt_88",  group:"Ewe – Late Gest. Twins",     bw:88,  dmi:2.33, tdn:1.87, cp:0.271, ca:0.01386, p:0.00748 },
  { id:"ew_lgt_110", group:"Ewe – Late Gest. Twins",     bw:110, dmi:3.23, tdn:2.13, cp:0.326, ca:0.01606, p:0.00946 },
  { id:"ew_lgt_132", group:"Ewe – Late Gest. Twins",     bw:132, dmi:3.63, tdn:2.40, cp:0.363, ca:0.01782, p:0.01056 },
  { id:"ew_lgt_154", group:"Ewe – Late Gest. Twins",     bw:154, dmi:4.03, tdn:2.66, cp:0.403, ca:0.01936, p:0.01166 },
  { id:"ew_lgt_176", group:"Ewe – Late Gest. Twins",     bw:176, dmi:4.38, tdn:2.90, cp:0.436, ca:0.02068, p:0.01276 },
  { id:"ew_lgtr_110",group:"Ewe – Late Gest. Triplets",  bw:110, dmi:3.10, tdn:2.46, cp:0.363, ca:0.01914, p:0.01034 },
  { id:"ew_lgtr_132",group:"Ewe – Late Gest. Triplets",  bw:132, dmi:3.45, tdn:2.75, cp:0.403, ca:0.02090, p:0.01144 },
  { id:"ew_lgtr_154",group:"Ewe – Late Gest. Triplets",  bw:154, dmi:4.55, tdn:3.01, cp:0.466, ca:0.02376, p:0.01408 },
  { id:"ew_lgtr_176",group:"Ewe – Late Gest. Triplets",  bw:176, dmi:4.97, tdn:3.30, cp:0.506, ca:0.02552, p:0.01518 },
  { id:"ew_els_88",  group:"Ewe – Early Lact. Single",   bw:88,  dmi:2.40, tdn:1.58, cp:0.328, ca:0.00902, p:0.00748 },
  { id:"ew_els_110", group:"Ewe – Early Lact. Single",   bw:110, dmi:2.77, tdn:1.83, cp:0.372, ca:0.01012, p:0.00858 },
  { id:"ew_els_132", group:"Ewe – Early Lact. Single",   bw:132, dmi:3.89, tdn:2.07, cp:0.440, ca:0.01188, p:0.01100 },
  { id:"ew_els_154", group:"Ewe – Early Lact. Single",   bw:154, dmi:4.31, tdn:2.29, cp:0.482, ca:0.01298, p:0.01210 },
  { id:"ew_els_176", group:"Ewe – Early Lact. Single",   bw:176, dmi:4.69, tdn:2.49, cp:0.521, ca:0.01386, p:0.01298 },
  { id:"ew_elt_88",  group:"Ewe – Early Lact. Twins",    bw:88,  dmi:3.08, tdn:2.05, cp:0.469, ca:0.01320, p:0.01100 },
  { id:"ew_elt_110", group:"Ewe – Early Lact. Twins",    bw:110, dmi:3.54, tdn:2.35, cp:0.532, ca:0.01474, p:0.01254 },
  { id:"ew_elt_132", group:"Ewe – Early Lact. Twins",    bw:132, dmi:3.96, tdn:2.64, cp:0.590, ca:0.01606, p:0.01386 },
  { id:"ew_elt_154", group:"Ewe – Early Lact. Twins",    bw:154, dmi:4.36, tdn:2.88, cp:0.642, ca:0.01738, p:0.01518 },
  { id:"ew_elt_176", group:"Ewe – Early Lact. Twins",    bw:176, dmi:4.73, tdn:3.15, cp:0.693, ca:0.01870, p:0.01628 },
  { id:"ew_el3_110", group:"Ewe – Early Lact. 3+ Lambs", bw:110, dmi:4.14, tdn:2.73, cp:0.653, ca:0.01826, p:0.01540 },
  { id:"ew_el3_132", group:"Ewe – Early Lact. 3+ Lambs", bw:132, dmi:4.60, tdn:3.04, cp:0.719, ca:0.02002, p:0.01716 },
  { id:"ew_el3_154", group:"Ewe – Early Lact. 3+ Lambs", bw:154, dmi:5.04, tdn:3.34, cp:0.783, ca:0.02156, p:0.01870 },
  { id:"ew_el3_176", group:"Ewe – Early Lact. 3+ Lambs", bw:176, dmi:6.84, tdn:3.63, cp:0.889, ca:0.02486, p:0.02266 },
  { id:"lm_44_022",  group:"Lamb – Young Late-Maturing",  bw:44,  adg:0.22, dmi:1.25, tdn:0.66, cp:0.161, ca:0.00506, p:0.00330 },
  { id:"lm_44_033",  group:"Lamb – Young Late-Maturing",  bw:44,  adg:0.33, dmi:1.72, tdn:0.90, cp:0.218, ca:0.00682, p:0.00484 },
  { id:"lm_44_044",  group:"Lamb – Young Late-Maturing",  bw:44,  adg:0.44, dmi:1.30, tdn:0.86, cp:0.244, ca:0.00814, p:0.00550 },
  { id:"lm_66_044",  group:"Lamb – Young Late-Maturing",  bw:66,  adg:0.44, dmi:2.31, tdn:1.23, cp:0.288, ca:0.00902, p:0.00638 },
  { id:"lm_66_055",  group:"Lamb – Young Late-Maturing",  bw:66,  adg:0.55, dmi:1.67, tdn:1.10, cp:0.306, ca:0.00990, p:0.00704 },
  { id:"lm_66_066",  group:"Lamb – Young Late-Maturing",  bw:66,  adg:0.66, dmi:1.94, tdn:1.28, cp:0.356, ca:0.01166, p:0.00836 },
  { id:"lm_88_055",  group:"Lamb – Young Late-Maturing",  bw:88,  adg:0.55, dmi:2.90, tdn:1.54, cp:0.359, ca:0.01100, p:0.00814 },
  { id:"lm_88_066",  group:"Lamb – Young Late-Maturing",  bw:88,  adg:0.66, dmi:3.39, tdn:1.80, cp:0.418, ca:0.01298, p:0.00968 },
  { id:"lm_88_088",  group:"Lamb – Young Late-Maturing",  bw:88,  adg:0.88, dmi:2.55, tdn:1.69, cp:0.469, ca:0.01540, p:0.01122 },
  { id:"lm_110_055", group:"Lamb – Young Late-Maturing",  bw:110, adg:0.55, dmi:3.04, tdn:1.61, cp:0.372, ca:0.01122, p:0.00836 },
  { id:"lm_110_066", group:"Lamb – Young Late-Maturing",  bw:110, adg:0.66, dmi:3.50, tdn:1.87, cp:0.429, ca:0.01320, p:0.00990 },
  { id:"lm_110_088", group:"Lamb – Young Late-Maturing",  bw:110, adg:0.88, dmi:2.66, tdn:1.76, cp:0.480, ca:0.01540, p:0.01122 },
  { id:"lm_110_110", group:"Lamb – Young Late-Maturing",  bw:110, adg:1.10, dmi:3.19, tdn:2.11, cp:0.581, ca:0.01892, p:0.01386 },
  { id:"lm_132_055", group:"Lamb – Young Late-Maturing",  bw:132, adg:0.55, dmi:3.15, tdn:1.67, cp:0.383, ca:0.01122, p:0.00836 },
  { id:"lm_132_066", group:"Lamb – Young Late-Maturing",  bw:132, adg:0.66, dmi:3.63, tdn:1.91, cp:0.442, ca:0.01320, p:0.00990 },
  { id:"lm_132_088", group:"Lamb – Young Late-Maturing",  bw:132, adg:0.88, dmi:4.58, tdn:2.42, cp:0.559, ca:0.01716, p:0.01298 },
  { id:"lm_154_033", group:"Lamb – Young Late-Maturing",  bw:154, adg:0.33, dmi:2.29, tdn:1.21, cp:0.275, ca:0.00748, p:0.00528 },
  { id:"lm_154_044", group:"Lamb – Young Late-Maturing",  bw:154, adg:0.44, dmi:2.77, tdn:1.47, cp:0.334, ca:0.00946, p:0.00682 },
  { id:"lm_154_066", group:"Lamb – Young Late-Maturing",  bw:154, adg:0.66, dmi:3.74, tdn:1.98, cp:0.453, ca:0.01342, p:0.01012 },
  { id:"lm_154_088", group:"Lamb – Young Late-Maturing",  bw:154, adg:0.88, dmi:4.71, tdn:2.49, cp:0.570, ca:0.01738, p:0.01320 },
  { id:"le_44_022",  group:"Lamb – Young Early-Maturing", bw:44,  adg:0.22, dmi:1.39, tdn:0.92, cp:0.145, ca:0.00462, p:0.00330 },
  { id:"le_44_033",  group:"Lamb – Young Early-Maturing", bw:44,  adg:0.33, dmi:1.43, tdn:1.14, cp:0.176, ca:0.00572, p:0.00440 },
  { id:"le_44_044",  group:"Lamb – Young Early-Maturing", bw:44,  adg:0.44, dmi:1.83, tdn:1.45, cp:0.222, ca:0.00748, p:0.00594 },
  { id:"le_66_044",  group:"Lamb – Young Early-Maturing", bw:66,  adg:0.44, dmi:2.64, tdn:1.74, cp:0.262, ca:0.00814, p:0.00660 },
  { id:"le_66_055",  group:"Lamb – Young Early-Maturing", bw:66,  adg:0.55, dmi:2.33, tdn:1.85, cp:0.279, ca:0.00924, p:0.00748 },
  { id:"le_66_066",  group:"Lamb – Young Early-Maturing", bw:66,  adg:0.66, dmi:2.75, tdn:2.18, cp:0.326, ca:0.01078, p:0.00880 },
  { id:"le_88_055",  group:"Lamb – Young Early-Maturing", bw:88,  adg:0.55, dmi:3.30, tdn:2.20, cp:0.326, ca:0.01012, p:0.00836 },
  { id:"le_88_066",  group:"Lamb – Young Early-Maturing", bw:88,  adg:0.66, dmi:2.84, tdn:2.24, cp:0.337, ca:0.01100, p:0.00902 },
  { id:"le_88_088",  group:"Lamb – Young Early-Maturing", bw:88,  adg:0.88, dmi:3.65, tdn:2.90, cp:0.429, ca:0.01408, p:0.01188 },
  { id:"le_110_055", group:"Lamb – Young Early-Maturing", bw:110, adg:0.55, dmi:3.41, tdn:2.27, cp:0.339, ca:0.01012, p:0.00836 },
  { id:"le_110_066", group:"Lamb – Young Early-Maturing", bw:110, adg:0.66, dmi:3.98, tdn:2.64, cp:0.392, ca:0.01188, p:0.01012 },
  { id:"le_110_088", group:"Lamb – Young Early-Maturing", bw:110, adg:0.88, dmi:3.74, tdn:2.97, cp:0.440, ca:0.01430, p:0.01188 },
  { id:"le_110_110", group:"Lamb – Young Early-Maturing", bw:110, adg:1.10, dmi:4.58, tdn:3.63, cp:0.532, ca:0.01760, p:0.01496 },
  { id:"le_132_055", group:"Lamb – Young Early-Maturing", bw:132, adg:0.55, dmi:3.52, tdn:2.33, cp:0.350, ca:0.01034, p:0.00858 },
  { id:"le_132_066", group:"Lamb – Young Early-Maturing", bw:132, adg:0.66, dmi:4.09, tdn:2.71, cp:0.403, ca:0.01210, p:0.01012 },
  { id:"le_154_033", group:"Lamb – Young Early-Maturing", bw:154, adg:0.33, dmi:3.98, tdn:2.11, cp:0.319, ca:0.00814, p:0.00682 },
  { id:"le_154_044", group:"Lamb – Young Early-Maturing", bw:154, adg:0.44, dmi:5.02, tdn:2.66, cp:0.389, ca:0.01034, p:0.00902 },
  { id:"le_154_066", group:"Lamb – Young Early-Maturing", bw:154, adg:0.66, dmi:4.20, tdn:2.77, cp:0.414, ca:0.01210, p:0.01034 },
  { id:"ram_m_220",  group:"Ram – Maintenance",           bw:220, dmi:3.89, tdn:2.07, cp:0.268, ca:0.00726, p:0.00682 },
  { id:"ram_m_275",  group:"Ram – Maintenance",           bw:275, dmi:4.60, tdn:2.44, cp:0.319, ca:0.00836, p:0.00814 },
  { id:"ram_m_330",  group:"Ram – Maintenance",           bw:330, dmi:5.28, tdn:2.79, cp:0.370, ca:0.00946, p:0.00946 },
  { id:"ram_m_440",  group:"Ram – Maintenance",           bw:440, dmi:6.56, tdn:3.48, cp:0.462, ca:0.01144, p:0.01166 },
  { id:"ram_p_220",  group:"Ram – Prebreeding",           bw:220, dmi:4.29, tdn:2.27, cp:0.317, ca:0.00792, p:0.00748 },
  { id:"ram_p_275",  group:"Ram – Prebreeding",           bw:275, dmi:7.26, tdn:2.68, cp:0.376, ca:0.00924, p:0.00902 },
  { id:"ram_p_330",  group:"Ram – Prebreeding",           bw:330, dmi:5.81, tdn:3.08, cp:0.433, ca:0.01034, p:0.01034 },
  { id:"ram_p_440",  group:"Ram – Prebreeding",           bw:440, dmi:7.19, tdn:3.83, cp:0.543, ca:0.01254, p:0.01298 },
  { id:"rep_m_88",   group:"Replacement – Maint+Growth",  bw:88,  adg:0.088,dmi:2.60, tdn:1.72, cp:0.205, ca:0.00682, p:0.00374 },
  { id:"rep_m_110",  group:"Replacement – Maint+Growth",  bw:110, adg:0.110,dmi:3.15, tdn:2.09, cp:0.246, ca:0.00814, p:0.00462 },
  { id:"rep_m_132",  group:"Replacement – Maint+Growth",  bw:132, adg:0.132,dmi:3.67, tdn:2.44, cp:0.288, ca:0.00924, p:0.00550 },
  { id:"rep_m_154",  group:"Replacement – Maint+Growth",  bw:154, adg:0.154,dmi:4.20, tdn:2.79, cp:0.328, ca:0.01056, p:0.00638 },
  { id:"rep_b_88",   group:"Replacement – Breeding",      bw:88,  adg:0.132,dmi:2.82, tdn:1.87, cp:0.231, ca:0.00792, p:0.00462 },
  { id:"rep_b_110",  group:"Replacement – Breeding",      bw:110, adg:0.163,dmi:3.41, tdn:2.27, cp:0.277, ca:0.00946, p:0.00550 },
  { id:"rep_b_132",  group:"Replacement – Breeding",      bw:132, adg:0.194,dmi:3.98, tdn:2.64, cp:0.323, ca:0.01078, p:0.00660 },
  { id:"rep_b_154",  group:"Replacement – Breeding",      bw:154, adg:0.222,dmi:4.55, tdn:3.01, cp:0.370, ca:0.01232, p:0.00748 },
];

const ANIMAL_GROUPS = [...new Set(ANIMAL_CLASSES.map(a=>a.group))];

// ─── BOOK FEEDS ───────────────────────────────────────────────────────────────
const BOOK_FEEDS = [
  { id:"alf_hay_early",  name:"Alfalfa Hay – Early Bloom",  cat:"Legume Hay", dm:90,tdn:59,cp:19,ca:1.41,p:0.26 },
  { id:"alf_hay_mid",    name:"Alfalfa Hay – Mid Bloom",    cat:"Legume Hay", dm:89,tdn:58,cp:17,ca:1.40,p:0.24 },
  { id:"alf_hay_full",   name:"Alfalfa Hay – Full Bloom",   cat:"Legume Hay", dm:88,tdn:54,cp:16,ca:1.20,p:0.23 },
  { id:"alf_hay_mature", name:"Alfalfa Hay – Mature",       cat:"Legume Hay", dm:88,tdn:50,cp:13,ca:1.18,p:0.19 },
  { id:"alf_cube",       name:"Alfalfa Cubes",              cat:"Legume Hay", dm:91,tdn:57,cp:18,ca:1.30,p:0.23 },
  { id:"clover_red",     name:"Clover – Red Hay",           cat:"Legume Hay", dm:88,tdn:55,cp:15,ca:1.50,p:0.25 },
  { id:"clover_ladino",  name:"Clover – Ladino Hay",        cat:"Legume Hay", dm:90,tdn:61,cp:21,ca:1.35,p:0.32 },
  { id:"brome_hay",      name:"Bromegrass Hay",             cat:"Grass Hay",  dm:89,tdn:55,cp:10,ca:0.40,p:0.23 },
  { id:"grass_hay",      name:"Grass Hay",                  cat:"Grass Hay",  dm:88,tdn:58,cp:10,ca:0.60,p:0.21 },
  { id:"timothy_e",      name:"Timothy Hay – Early Bloom",  cat:"Grass Hay",  dm:88,tdn:59,cp:11,ca:0.58,p:0.26 },
  { id:"timothy_f",      name:"Timothy Hay – Full Bloom",   cat:"Grass Hay",  dm:88,tdn:57,cp:8, ca:0.43,p:0.20 },
  { id:"orchard",        name:"Orchardgrass Hay",           cat:"Grass Hay",  dm:88,tdn:59,cp:10,ca:0.32,p:0.30 },
  { id:"fescue_e",       name:"Fescue Hay – Early Bloom",   cat:"Grass Hay",  dm:88,tdn:65,cp:18,ca:0.45,p:0.37 },
  { id:"prairie_hay",    name:"Prairie Hay",                cat:"Grass Hay",  dm:91,tdn:50,cp:7, ca:0.40,p:0.15 },
  { id:"sudan_hay",      name:"Sudangrass Hay",             cat:"Grass Hay",  dm:88,tdn:57,cp:9, ca:0.50,p:0.22 },
  { id:"oat_hay",        name:"Oat Hay",                    cat:"Grass Hay",  dm:90,tdn:54,cp:10,ca:0.40,p:0.27 },
  { id:"corn_silage",    name:"Corn Silage",                cat:"Silage",     dm:34,tdn:72,cp:8, ca:0.28,p:0.23 },
  { id:"alf_silage",     name:"Alfalfa Silage",             cat:"Silage",     dm:30,tdn:55,cp:18,ca:1.40,p:0.29 },
  { id:"grass_silage",   name:"Grass Silage",               cat:"Silage",     dm:30,tdn:61,cp:11,ca:0.70,p:0.24 },
  { id:"wheat_straw",    name:"Wheat Straw",                cat:"Straw",      dm:91,tdn:42,cp:3, ca:0.16,p:0.05 },
  { id:"barley_straw",   name:"Barley Straw",               cat:"Straw",      dm:90,tdn:43,cp:4, ca:0.33,p:0.08 },
  { id:"oat_straw",      name:"Oat Straw",                  cat:"Straw",      dm:91,tdn:48,cp:4, ca:0.24,p:0.07 },
  { id:"corn_stover",    name:"Corn Stover",                cat:"Straw",      dm:80,tdn:59,cp:5, ca:0.39,p:0.19 },
  { id:"corn_grain",     name:"Corn Grain",                 cat:"Grain",      dm:88,tdn:88,cp:9, ca:0.02,p:0.30 },
  { id:"oats",           name:"Oats",                       cat:"Grain",      dm:89,tdn:76,cp:13,ca:0.05,p:0.41 },
  { id:"barley",         name:"Barley Grain",               cat:"Grain",      dm:89,tdn:84,cp:12,ca:0.06,p:0.38 },
  { id:"wheat",          name:"Wheat Grain",                cat:"Grain",      dm:89,tdn:88,cp:14,ca:0.05,p:0.43 },
  { id:"milo",           name:"Sorghum Grain (Milo)",       cat:"Grain",      dm:89,tdn:82,cp:11,ca:0.04,p:0.32 },
  { id:"ear_corn",       name:"Ear Corn",                   cat:"Grain",      dm:87,tdn:82,cp:9, ca:0.06,p:0.28 },
  { id:"sbm_44",         name:"Soybean Meal 44%",           cat:"Protein",    dm:91,tdn:84,cp:49,ca:0.38,p:0.71 },
  { id:"sbm_49",         name:"Soybean Meal 49%",           cat:"Protein",    dm:91,tdn:87,cp:54,ca:0.28,p:0.71 },
  { id:"whole_sb",       name:"Soybeans – Whole",           cat:"Protein",    dm:88,tdn:93,cp:40,ca:0.27,p:0.64 },
  { id:"ddgs",           name:"DDGS (Corn)",                cat:"Protein",    dm:91,tdn:90,cp:29,ca:0.15,p:0.78 },
  { id:"canola_meal",    name:"Canola Meal",                cat:"Protein",    dm:90,tdn:72,cp:38,ca:0.74,p:1.14 },
  { id:"cgf",            name:"Corn Gluten Feed",           cat:"Protein",    dm:90,tdn:80,cp:22,ca:0.12,p:0.85 },
  { id:"sbh",            name:"Soybean Hulls",              cat:"Protein",    dm:90,tdn:77,cp:12,ca:0.55,p:0.17 },
  { id:"beet_pulp",      name:"Beet Pulp – Dry",            cat:"Protein",    dm:91,tdn:75,cp:11,ca:0.65,p:0.08 },
  { id:"wheat_bran",     name:"Wheat Bran",                 cat:"Protein",    dm:89,tdn:70,cp:17,ca:0.13,p:1.29 },
  { id:"com_supp",       name:"Commercial Supplement",      cat:"Protein",    dm:89,tdn:72,cp:38,ca:1.60,p:0.95 },
  { id:"limestone",      name:"Limestone – Ground",         cat:"Mineral",    dm:98,tdn:0, cp:0, ca:34.0,p:0.02 },
  { id:"dical_phos",     name:"Dicalcium Phosphate",        cat:"Mineral",    dm:96,tdn:0, cp:0, ca:35.0,p:0.52 },
  { id:"salt",           name:"Salt (NaCl)",                cat:"Mineral",    dm:100,tdn:0,cp:0, ca:0,   p:0    },
  { id:"amm_cl",         name:"Ammonium Chloride",          cat:"Mineral",    dm:99,tdn:0, cp:0, ca:0,   p:0    },
];

const FEED_CATS = ["Legume Hay","Grass Hay","Silage","Straw","Grain","Protein","Mineral"];
const BLANK_TEST = { name:"",cat:"Grass Hay",dm:88,cp:10,tdn:55,ca:0.50,p:0.20,nem:0,neg:0,cost_per_ton:0,notes:"",moisture:0,ph:"",ash:0,fat:0,rfv:0,k:0,mg:0,adf:0,andf:0,source:"manual",archived:false,feed_type:"",sample_no:"",lab_date:"",description:"" };
const BLANK_GROUP = { name:"",head_count:0,animal_id:"ew_m_110",sel_group:"Ewe – Maintenance",current_ration_id:"",current_ration_name:"",ration_changed_date:"",notes:"" };

const pOf=(h,n)=>n>0?(h/n)*100:null;
const C = {
  bg:"#f5f2ec", panel:"#ffffff", card:"#faf8f4", border:"#ddd8ce", border2:"#c8c0b0",
  accent:"#a06b18", accentDim:"#c8922a", accentBg:"#fef6e8",
  green:"#3a7a3a", greenBg:"#eef6ee", greenBdr:"#a8d0a8",
  red:"#b03020", redBg:"#fdf0ee", orange:"#b86010",
  text:"#2a2218", textDim:"#6a5a40", textMute:"#a09080", labGreen:"#2a7a2a",
};
const sc=p=>p===null?C.textMute:p<85?C.red:p<=115?C.green:C.orange;
const sl=p=>p===null?"—":p<85?"LOW":p<=115?"OK":"HIGH";
const fmtDate=d=>d?new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";
const today=()=>new Date().toISOString().split("T")[0];

// Map DB snake_case ↔ app camelCase
const testToDb = t => ({
  id:t.id, name:t.name, cat:t.cat, source:t.source||"manual", archived:t.archived||false,
  sample_no:t.sampleNo||t.sample_no||"", lab_date:t.labDate||t.lab_date||"",
  feed_type:t.feedType||t.feed_type||"", description:t.description||"",
  dm:t.dm||0, moisture:t.moisture||0, ph:t.pH||t.ph||null,
  cp:t.cp||0, adf:t.adf||0, andf:t.aNDF||t.andf||0,
  tdn:t.tdn||0, nem:t.nem||0, neg:t.neg||0,
  ca:t.ca||0, p:t.p||0, mg:t.mg||0, k:t.k||0,
  ash:t.ash||0, fat:t.fat||0, rfv:t.rfv||0,
  cost_per_ton:t.costPerTon||t.cost_per_ton||0, notes:t.notes||"",
});
const testFromDb = t => ({...t, sampleNo:t.sample_no, labDate:t.lab_date, feedType:t.feed_type, aNDF:t.andf, pH:t.ph, costPerTon:t.cost_per_ton });
const rationToDb = r => ({
  id:r.id, name:r.name, animal_id:r.animalId||r.animal_id, sel_group:r.selGroup||r.sel_group,
  num_head:r.numHead||r.num_head||1, rations:r.rations, amounts:r.amounts,
  feed_costs:r.feedCosts||r.feed_costs||{}, date:r.date||today(),
});
const rationFromDb = r => ({...r, animalId:r.animal_id, selGroup:r.sel_group, numHead:r.num_head, feedCosts:r.feed_costs});
const groupToDb = g => ({
  id:g.id, name:g.name, head_count:g.headCount||g.head_count||0,
  animal_id:g.animalId||g.animal_id||"ew_m_110", sel_group:g.selGroup||g.sel_group||"Ewe – Maintenance",
  current_ration_id:g.currentRationId||g.current_ration_id||"",
  current_ration_name:g.currentRationName||g.current_ration_name||"",
  ration_changed_date:g.rationChangedDate||g.ration_changed_date||"",
  notes:g.notes||"", updated_at:new Date().toISOString(),
});
const groupFromDb = g => ({...g, headCount:g.head_count, animalId:g.animal_id, selGroup:g.sel_group, currentRationId:g.current_ration_id, currentRationName:g.current_ration_name, rationChangedDate:g.ration_changed_date});

export default function SheepRationTool() {
  // ── Core ration state
  const [animalId,  setAnimalId]  = useState("ew_m_110");
  const [numHead,   setNumHead]   = useState(1);
  const [rations,   setRations]   = useState([]);
  const [amounts,   setAmounts]   = useState({});
  const [feedCosts, setFeedCosts] = useState({});
  const [selGroup,  setSelGroup]  = useState("Ewe – Maintenance");
  // ── UI
  const [tab,       setTab]       = useState("dashboard");
  const [filterCat, setFilterCat] = useState("All");
  const [addId,     setAddId]     = useState(BOOK_FEEDS[0].id);
  // ── DB data
  const [labTests,     setLabTests]     = useState([]);
  const [savedRations, setSavedRations] = useState([]);
  const [groups,       setGroups]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [dbStatus,     setDbStatus]     = useState("connecting");
  // ── Lab test form
  const [testTab,    setTestTab]   = useState("list");
  const [editTest,   setEditTest]  = useState(null);
  const [formData,   setFormData]  = useState({...BLANK_TEST,id:"lab_"+Date.now()});
  const [showArch,   setShowArch]  = useState(false);
  const [confirmDel, setConfirmDel]= useState(null);
  const [parsing,    setParsing]   = useState(false);
  const [parseErr,   setParseErr]  = useState(null);
  // ── Saved rations
  const [rationName,   setRationName]  = useState("");
  const [showSaveBox,  setShowSaveBox] = useState(false);
  const [confirmDelR,  setConfirmDelR] = useState(null);
  // ── Groups
  const [groupTab,     setGroupTab]    = useState("list"); // list | form
  const [editGroup,    setEditGroup]   = useState(null);
  const [groupForm,    setGroupForm]   = useState({...BLANK_GROUP,id:"grp_"+Date.now()});
  const [confirmDelG,  setConfirmDelG] = useState(null);
  const [assignModal,  setAssignModal] = useState(null); // groupId being assigned

  // ── Load all data from Supabase
  useEffect(()=>{
    Promise.all([db.getTests(), db.getRations(), db.getGroups()])
      .then(([tests, rats, grps])=>{
        setLabTests(tests.map(testFromDb));
        setSavedRations(rats.map(rationFromDb));
        setGroups(grps.map(groupFromDb));
        setDbStatus("ok");
      })
      .catch(e=>{ console.error(e); setDbStatus("error"); })
      .finally(()=>setLoading(false));
  },[]);

  const animal = ANIMAL_CLASSES.find(a=>a.id===animalId)||ANIMAL_CLASSES[0];
  const activeLab = labTests.filter(t=>!t.archived);
  const archivedLab = labTests.filter(t=>t.archived);
  const allFeeds = useMemo(()=>[
    ...activeLab.map(t=>({id:t.id,name:t.name,cat:t.cat,source:"lab",dm:t.dm,tdn:t.tdn,cp:t.cp,ca:t.ca,p:t.p})),
    ...BOOK_FEEDS
  ],[activeLab]);
  // Which saved rations are actively assigned to groups
  const rationUsage = useMemo(()=>{
    const map = {};
    groups.forEach(g=>{
      if(g.currentRationId){
        if(!map[g.currentRationId]) map[g.currentRationId]=[];
        map[g.currentRationId].push(g.name);
      }
    });
    return map;
  },[groups]);

  const rationFeeds = rations.map(id=>allFeeds.find(f=>f.id===id)).filter(Boolean);

  const totals = useMemo(()=>{
    let dmi=0,tdn=0,cp=0,ca=0,p=0,asFed=0,cost=0;
    rationFeeds.forEach(feed=>{
      const af=parseFloat(amounts[feed.id]||0);
      const dm=af*(feed.dm/100);
      dmi+=dm; tdn+=dm*(feed.tdn/100); cp+=dm*(feed.cp/100);
      ca+=dm*(feed.ca/100); p+=dm*(feed.p/100); asFed+=af;
      cost+=af*(parseFloat(feedCosts[feed.id]||0)/100);
    });
    return{dmi,tdn,cp,ca,p,asFed,cost};
  },[rationFeeds,amounts,feedCosts]);

  const pcts={dmi:pOf(totals.dmi,animal.dmi),tdn:pOf(totals.tdn,animal.tdn),cp:pOf(totals.cp,animal.cp),ca:pOf(totals.ca,animal.ca),p:pOf(totals.p,animal.p)};
  const caP=totals.p>0?totals.ca/totals.p:null;

  // ── Feed actions
  const addFeed=()=>{if(!rations.includes(addId)){setRations(r=>[...r,addId]);setAmounts(a=>({...a,[addId]:""}));}};
  const removeFeed=id=>{setRations(r=>r.filter(x=>x!==id));setAmounts(a=>{const n={...a};delete n[id];return n;});};

  // ── Lab test actions
  const openNewTest=()=>{setEditTest(null);setFormData({...BLANK_TEST,id:"lab_"+Date.now()});setParseErr(null);setTestTab("form");};
  const openEditTest=t=>{setEditTest(t.id);setFormData({...t,ph:t.pH||t.ph,andf:t.aNDF||t.andf});setParseErr(null);setTestTab("form");};
  const saveTest=async()=>{
    if(!formData.name.trim())return;
    const row=testToDb({...formData,archived:false});
    await db.upsertTest(row);
    const fresh=await db.getTests();
    setLabTests(fresh.map(testFromDb));
    setTestTab("list");
  };
  const archiveTest=async(id,val)=>{
    const t=labTests.find(x=>x.id===id); if(!t)return;
    await db.upsertTest(testToDb({...t,archived:val}));
    setLabTests(prev=>prev.map(x=>x.id===id?{...x,archived:val}:x));
  };
  const deleteTest=async(id)=>{
    await db.deleteTest(id);
    setLabTests(prev=>prev.filter(x=>x.id!==id));
    setConfirmDel(null);
  };

  // ── Saved ration actions
  const saveCurrentRation=async()=>{
    if(!rationName.trim())return;
    const row=rationToDb({id:"ration_"+Date.now(),name:rationName.trim(),animalId,selGroup,numHead,rations,amounts,feedCosts,date:today()});
    await db.upsertRation(row);
    const fresh=await db.getRations();
    setSavedRations(fresh.map(rationFromDb));
    setRationName(""); setShowSaveBox(false);
  };
  const loadRation=r=>{
    setAnimalId(r.animalId||r.animal_id);
    setNumHead(r.numHead||r.num_head||1);
    setRations(r.rations||[]);
    setAmounts(r.amounts||{});
    setFeedCosts(r.feedCosts||r.feed_costs||{});
    setSelGroup(r.selGroup||r.sel_group||"Ewe – Maintenance");
    setTab("builder");
  };
  const deleteRation=async(id)=>{
    await db.deleteRation(id);
    setSavedRations(prev=>prev.filter(x=>x.id!==id));
    setConfirmDelR(null);
  };

  // ── Group actions
  const openNewGroup=()=>{setEditGroup(null);setGroupForm({...BLANK_GROUP,id:"grp_"+Date.now()});setGroupTab("form");};
  const openEditGroup=g=>{setEditGroup(g.id);setGroupForm({...g,headCount:g.headCount||g.head_count||0});setGroupTab("form");};
  const saveGroup=async()=>{
    if(!groupForm.name.trim())return;
    const row=groupToDb({...groupForm});
    await db.upsertGroup(row);
    const fresh=await db.getGroups();
    setGroups(fresh.map(groupFromDb));
    setGroupTab("list");
  };
  const deleteGroup=async(id)=>{
    await db.deleteGroup(id);
    setGroups(prev=>prev.filter(x=>x.id!==id));
    setConfirmDelG(null);
  };
  const assignRationToGroup=async(groupId, ration)=>{
    const g=groups.find(x=>x.id===groupId); if(!g)return;
    const updated={...g,currentRationId:ration.id,currentRationName:ration.name,rationChangedDate:today()};
    await db.upsertGroup(groupToDb(updated));
    setGroups(prev=>prev.map(x=>x.id===groupId?updated:x));
    setAssignModal(null);
  };

  // ── PDF parser
  const parsePDF=async file=>{
    setParsing(true);setParseErr(null);
    try{
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=()=>rej(new Error("Read failed"));r.readAsDataURL(file);});
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:'Extract all values from this feed lab report and return ONLY a JSON object:\n{"name":"short name","feed_type":"feed type","description":"description","sample_no":"sample no","lab_date":"YYYY-MM-DD","dm":number,"moisture":number,"ph":number_or_null,"cp":number,"adf":number_or_null,"andf":number_or_null,"tdn":number_use_OARDC_if_available,"nem":number_or_null,"neg":number_or_null,"ca":number,"p":number,"mg":number_or_null,"k":number_or_null,"ash":number_or_null,"fat":number_or_null,"rfv":number_or_null,"notes":"lab name and sample info"}\nReturn ONLY JSON, no markdown.'}]}]})});
      const data=await resp.json();
      const raw=data.content?.find(b=>b.type==="text")?.text||"";
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setFormData(prev=>({...prev,...parsed,id:prev.id,source:"lab",cat:prev.cat}));
    }catch(err){setParseErr("Parse failed: "+err.message);}
    finally{setParsing(false);}
  };

  const recs=useMemo(()=>{
    if(!rationFeeds.length)return[];
    const r=[];
    if(pcts.dmi!==null&&pcts.dmi<85)  r.push({t:"low",m:"DMI below requirement — increase feed offered"});
    if(pcts.dmi!==null&&pcts.dmi>120) r.push({t:"hi", m:"DMI exceeds requirement"});
    if(pcts.tdn!==null&&pcts.tdn<85)  r.push({t:"low",m:"Energy (TDN) deficient — add corn, barley, or higher-quality hay"});
    if(pcts.tdn!==null&&pcts.tdn>120) r.push({t:"hi", m:"Energy (TDN) excessive — reduce grain"});
    if(pcts.cp !==null&&pcts.cp <85)  r.push({t:"low",m:"Protein deficient — add SBM, canola meal, or DDGS"});
    if(pcts.cp !==null&&pcts.cp >130) r.push({t:"hi", m:"Protein excessive — reduce supplement"});
    if(pcts.ca !==null&&pcts.ca <85)  r.push({t:"low",m:"Calcium low — add limestone or alfalfa"});
    if(pcts.p  !==null&&pcts.p  <85)  r.push({t:"low",m:"Phosphorus low — add dicalcium phosphate or grain"});
    if(caP!==null&&caP<1.5) r.push({t:"warn",m:`Ca:P ${caP.toFixed(2)}:1 too narrow — urinary calculi risk`});
    if(caP!==null&&caP>5.0) r.push({t:"warn",m:`Ca:P ${caP.toFixed(2)}:1 very wide — may impair P absorption`});
    if(!r.length) r.push({t:"ok",m:"Ration balanced — all nutrients within acceptable range"});
    return r;
  },[pcts,caP,rationFeeds]);

  const MBar=({label,have,need,unit,pct,dec=3})=>{
    const color=sc(pct);const bw=Math.min(Math.max(pct||0,0),150);const diff=pct!==null?have-need:null;
    return(
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:1.5,textTransform:"uppercase"}}>{label}</span>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:12}}><span style={{color:C.text}}>{have.toFixed(dec)}</span><span style={{color:C.textMute}}> / </span><span style={{color:C.textDim}}>{need.toFixed(dec)} {unit}</span></span>
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

  // FField and GField inlined below to avoid focus loss on re-render

  const groupedByWeight=useMemo(()=>ANIMAL_CLASSES.filter(a=>a.group===selGroup),[selGroup]);
  const groupedForForm=useMemo(()=>ANIMAL_CLASSES.filter(a=>a.group===groupForm.sel_group),[groupForm.sel_group]);

  if(loading) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accentDim,letterSpacing:2}}>CONNECTING TO DATABASE...</div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Georgia,serif"}}>
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
        .btn-green{background:${C.greenBg};color:${C.labGreen};border:1px solid ${C.greenBdr};border-radius:4px;padding:6px 12px;font-size:9px;letter-spacing:1px}
        .btn-danger{background:transparent;color:#904040;border:1px solid #401818;border-radius:4px;padding:6px 12px;font-size:9px}
        .btn-danger:hover{background:#1a0808;color:${C.red}}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100}
      `}</style>

      {/* HEADER */}
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"12px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:C.accent,letterSpacing:-0.5,lineHeight:1}}>Sheep Ration Tool</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:2}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute,letterSpacing:2}}>NRC 2007 · EWES · LAMBS · RAMS · BARKA FARMS</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:dbStatus==="ok"?C.green:dbStatus==="error"?C.red:C.orange}}/>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:7,color:dbStatus==="ok"?C.green:C.textMute}}>{dbStatus==="ok"?"SYNCED":dbStatus==="error"?"DB ERROR":"..."}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,overflow:"hidden"}}>
          {["dashboard","builder","rations","library","my tests"].map(t=>(
            <button key={t} onClick={()=>{setTab(t);if(t==="my tests")setTestTab("list");if(t==="dashboard")setGroupTab("list");}} style={{padding:"6px 13px",background:tab===t?C.accentBg:"transparent",color:tab===t?C.accent:C.textMute,border:"none",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",position:"relative"}}>
              {t}
              {t==="dashboard"&&groups.length>0&&<span style={{position:"absolute",top:3,right:3,background:C.accentDim,color:C.bg,borderRadius:8,fontSize:7,padding:"0 3px",fontWeight:700,lineHeight:"12px"}}>{groups.length}</span>}
              {t==="my tests"&&activeLab.length>0&&<span style={{position:"absolute",top:3,right:3,background:C.green,color:C.bg,borderRadius:8,fontSize:7,padding:"0 3px",fontWeight:700,lineHeight:"12px"}}>{activeLab.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:["builder","rations","library"].includes(tab)?"295px 1fr":"1fr",minHeight:"calc(100vh - 56px)"}}>

        {/* LEFT PANEL — only on builder/rations/library */}
        {["builder","rations","library"].includes(tab)&&(
          <div style={{background:C.panel,borderRight:`1px solid ${C.border}`,padding:"14px 13px",overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>Animal Category</div>
              <select value={selGroup} onChange={e=>{setSelGroup(e.target.value);const first=ANIMAL_CLASSES.find(a=>a.group===e.target.value);if(first)setAnimalId(first.id);}} style={{width:"100%",marginBottom:8}}>
                {ANIMAL_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
              </select>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:5,textTransform:"uppercase"}}>{animal.adg!==undefined?"Body Weight / ADG":"Body Weight"}</div>
              <select value={animalId} onChange={e=>setAnimalId(e.target.value)} style={{width:"100%"}}>
                {groupedByWeight.map(a=>(<option key={a.id} value={a.id}>{a.bw} lb{a.adg!==undefined?` · ${a.adg} lb/day gain`:""}</option>))}
              </select>
            </div>
            <div>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:5,textTransform:"uppercase"}}>Number of Head</div>
              <input type="number" min={1} value={numHead} onChange={e=>setNumHead(parseInt(e.target.value)||1)} style={{width:"100%"}}/>
            </div>
            <div style={{background:C.accentBg,border:`1px solid ${C.accentDim}`,borderRadius:6,padding:"10px 12px"}}>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accent,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Requirements / Head / Day</div>
              {[["DMI",animal.dmi,"lb DM"],["TDN",animal.tdn,"lb"],["CP",animal.cp,"lb"],["Ca",(animal.ca*453.6).toFixed(1),"g"],["P",(animal.p*453.6).toFixed(1),"g"]].map(([l,v,u])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim}}>{l}</span>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.text}}>{v} <span style={{color:C.textMute}}>{u}</span></span>
                </div>
              ))}
              <div style={{fontFamily:"DM Mono,monospace",fontSize:7,color:C.accentDim,textAlign:"right",marginTop:6,letterSpacing:1}}>NRC 2007</div>
            </div>
            {tab==="builder"&&(
              <div>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>Add to Ration</div>
                {activeLab.length>0&&(
                  <div style={{marginBottom:8}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.labGreen,letterSpacing:1,marginBottom:4}}>YOUR LAB TESTS</div>
                    {activeLab.map(t=>(
                      <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3,padding:"4px 7px",background:C.greenBg,border:`1px solid ${C.greenBdr}`,borderRadius:4}}>
                        <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</span>
                        <button onClick={()=>{if(!rations.includes(t.id)){setRations(r=>[...r,t.id]);setAmounts(a=>({...a,[t.id]:""}));}}} style={{background:C.greenBg,color:C.labGreen,border:`1px solid ${C.greenBdr}`,borderRadius:3,padding:"2px 7px",fontSize:10,marginLeft:5,flexShrink:0}}>+</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute,letterSpacing:1,marginBottom:4}}>BOOK FEEDS</div>
                <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>
                  {["All","Grain","Protein","Mineral"].map(c=>(<button key={c} onClick={()=>setFilterCat(c)} style={{padding:"2px 6px",fontSize:8,background:filterCat===c?C.accentBg:C.bg,color:filterCat===c?C.accent:C.textMute,border:`1px solid ${filterCat===c?C.accentDim:C.border}`,borderRadius:3}}>{c}</button>))}
                </div>
                <div style={{display:"flex",gap:5}}>
                  <select value={addId} onChange={e=>setAddId(e.target.value)} style={{flex:1,minWidth:0}}>
                    {FEED_CATS.filter(c=>filterCat==="All"||c===filterCat).map(cat=>(<optgroup key={cat} label={cat}>{BOOK_FEEDS.filter(f=>f.cat===cat).map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}</optgroup>))}
                  </select>
                  <button onClick={addFeed} className="btn-primary" style={{padding:"5px 10px",fontSize:15,letterSpacing:0}}>+</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT / FULL PANEL */}
        <div style={{padding:"16px 20px",overflowY:"auto"}}>

          {/* ════ DASHBOARD ════ */}
          {tab==="dashboard"&&(
            <>
              {groupTab==="list"&&(
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,textTransform:"uppercase"}}>Flock Groups — {groups.length}</div>
                    <button className="btn-primary" onClick={openNewGroup}>+ New Group</button>
                  </div>
                  {groups.length===0?(
                    <div style={{border:`1px dashed ${C.border}`,borderRadius:6,padding:"40px 0",textAlign:"center",color:C.textMute,fontFamily:"DM Mono,monospace",fontSize:12}}>
                      No groups yet — create your first group to assign rations
                    </div>
                  ):(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12}}>
                      {groups.map(g=>{
                        const ac=ANIMAL_CLASSES.find(a=>a.id===g.animalId);
                        const ration=savedRations.find(r=>r.id===g.currentRationId);
                        return(
                          <div key={g.id} style={{background:C.card,border:`1px solid ${C.border2}`,borderRadius:7,padding:"14px 16px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                              <div>
                                <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:C.accent,marginBottom:2}}>{g.name}</div>
                                <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim}}>{g.headCount||g.head_count||0} head · {ac?.group||g.selGroup||""}</div>
                                <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute}}>{ac?.bw||""}{ac?.bw?" lb":""}{ac?.adg?` · ${ac.adg} lb/d gain`:""}</div>
                              </div>
                              <div style={{display:"flex",gap:4}}>
                                <button className="btn-ghost" onClick={()=>openEditGroup(g)} style={{padding:"4px 8px",fontSize:8}}>Edit</button>
                                <button className="btn-danger" onClick={()=>setConfirmDelG(g.id)} style={{padding:"4px 8px",fontSize:8}}>✕</button>
                              </div>
                            </div>
                            {/* Current ration */}
                            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"10px 12px",marginBottom:8}}>
                              <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Current Ration</div>
                              {g.currentRationName?(
                                <>
                                  <div style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.text,marginBottom:3}}>{g.currentRationName}</div>
                                  <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute}}>Assigned {g.rationChangedDate?fmtDate(g.rationChangedDate):""}</div>
                                  {ration&&(
                                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:7}}>
                                      {(ration.rations||[]).slice(0,4).map(fid=>{
                                        const feed=allFeeds.find(f=>f.id===fid);
                                        const af=parseFloat((ration.amounts||{})[fid]||0);
                                        return feed?(<div key={fid} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:3,padding:"2px 7px",fontFamily:"DM Mono,monospace",fontSize:8,color:C.textDim}}>{feed.name} <span style={{color:C.accent}}>{af.toFixed(1)}</span></div>):null;
                                      })}
                                      {(ration.rations||[]).length>4&&<div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute,padding:"2px 7px"}}>+{(ration.rations||[]).length-4} more</div>}
                                    </div>
                                  )}
                                </>
                              ):(
                                <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.textMute,fontStyle:"italic"}}>No ration assigned</div>
                              )}
                            </div>
                            <div style={{display:"flex",gap:6}}>
                              <button className="btn-green" onClick={()=>setAssignModal(g.id)} style={{flex:1,textAlign:"center",fontSize:9,letterSpacing:1,padding:"5px"}}>Assign Ration</button>
                              {g.currentRationId&&<button className="btn-ghost" onClick={()=>{const r=savedRations.find(x=>x.id===g.currentRationId);if(r)loadRation(r);}} style={{fontSize:9,padding:"5px 10px"}}>Load →</button>}
                            </div>
                            {confirmDelG===g.id&&(
                              <div style={{marginTop:8,padding:"8px 10px",background:C.redBg,border:`1px solid #3a1818`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.red}}>Delete "{g.name}"?</span>
                                <div style={{display:"flex",gap:5}}>
                                  <button onClick={()=>deleteGroup(g.id)} style={{background:"#3a1818",color:"#ff8888",border:"1px solid #5a2a2a",borderRadius:3,padding:"3px 10px",fontSize:9}}>Delete</button>
                                  <button className="btn-ghost" onClick={()=>setConfirmDelG(null)} style={{padding:"3px 8px"}}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              {groupTab==="form"&&(
                <div style={{maxWidth:600}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,textTransform:"uppercase"}}>{editGroup?"Edit Group":"New Group"}</div>
                    <button className="btn-ghost" onClick={()=>setGroupTab("list")}>← Cancel</button>
                  </div>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"18px 20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Group Name *</label>
                      <input type="text" value={groupForm["name"]??""} onChange={e=>setGroupForm(p=>{...p,["name"]:e.target.value})} style={{width:150}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Head Count</label>
                      <input type="number" value={groupForm["head_count"]??""} onChange={e=>setGroupForm(p=>({...p,["head_count"]:parseInt(e.target.value)||0}))} style={{width:150}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Animal Category</label>
                      <select value={groupForm.sel_group||groupForm.selGroup||"Ewe – Maintenance"} onChange={e=>{const first=ANIMAL_CLASSES.find(a=>a.group===e.target.value);setGroupForm(p=>({...p,sel_group:e.target.value,selGroup:e.target.value,animal_id:first?.id||p.animal_id,animalId:first?.id||p.animalId}));}} style={{width:150}}>
                        {ANIMAL_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Body Weight / ADG</label>
                      <select value={groupForm.animal_id||groupForm.animalId||"ew_m_110"} onChange={e=>setGroupForm(p=>({...p,animal_id:e.target.value,animalId:e.target.value}))} style={{width:150}}>
                        {groupedForForm.map(a=>(<option key={a.id} value={a.id}>{a.bw} lb{a.adg!==undefined?` · ${a.adg} lb/d gain`:""}</option>))}
                      </select>
                    </div>
                    <div style={{marginBottom:9}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,display:"block",marginBottom:5}}>Notes</label>
                      <textarea value={groupForm.notes||""} onChange={e=>setGroupForm(p=>({...p,notes:e.target.value}))} style={{width:"100%",height:50,resize:"vertical"}} placeholder="Location, breed, notes..."/>
                    </div>
                    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      <button className="btn-ghost" onClick={()=>setGroupTab("list")}>Cancel</button>
                      <button className="btn-primary" onClick={saveGroup}>Save Group</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════ BUILDER ════ */}
          {tab==="builder"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,textTransform:"uppercase"}}>Ration Builder — As-Fed lb / Head / Day</div>
                {!showSaveBox?(
                  <button className="btn-primary" onClick={()=>setShowSaveBox(true)} style={{fontSize:9,letterSpacing:1,padding:"5px 12px",whiteSpace:"nowrap"}}>💾 Save Ration</button>
                ):(
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input type="text" value={rationName} onChange={e=>setRationName(e.target.value)} placeholder="Ration name..." style={{width:160}} onKeyDown={e=>e.key==="Enter"&&saveCurrentRation()}/>
                    <button className="btn-primary" onClick={saveCurrentRation} style={{whiteSpace:"nowrap",padding:"5px 10px"}}>Save</button>
                    <button className="btn-ghost" onClick={()=>{setShowSaveBox(false);setRationName("");}} style={{padding:"5px 8px"}}>✕</button>
                  </div>
                )}
              </div>
              {rationFeeds.length===0?(
                <div style={{border:`1px dashed ${C.border}`,borderRadius:6,padding:"28px 0",textAlign:"center",color:C.textMute,fontFamily:"DM Mono,monospace",fontSize:12,marginBottom:14}}>← Add ingredients from the left panel</div>
              ):(
                <div style={{marginBottom:14,overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`}}>
                        {["Feed","$/cwt","As-Fed lb","DM lb","TDN lb","CP lb","Ca lb","P lb",""].map(h=>(<th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,textAlign:h==="Feed"?"left":"right",padding:"4px 6px 4px",fontWeight:400,letterSpacing:1}}>{h}</th>))}
                      </tr>
                    </thead>
                    <tbody>
                      {rationFeeds.map((feed,i)=>{
                        const af=parseFloat(amounts[feed.id]||0);const dm=af*(feed.dm/100);
                        return(
                          <tr key={feed.id} className="feed-row" style={{borderBottom:`1px solid ${C.bg}`,background:i%2===0?"transparent":C.card}}>
                            <td style={{padding:"5px 6px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:4}}>
                                {feed.source==="lab"&&<span className="tag" style={{background:C.greenBg,color:C.labGreen,border:`1px solid ${C.greenBdr}`}}>LAB</span>}
                                <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.text}}>{feed.name}</span>
                              </div>
                              <div style={{fontFamily:"DM Mono,monospace",fontSize:7,color:C.textMute,marginTop:1}}>{feed.cat} · {feed.dm}% DM</div>
                            </td>
                            <td style={{padding:"5px 6px"}}><input type="number" min={0} step={1} value={feedCosts[feed.id]||""} onChange={e=>setFeedCosts(p=>({...p,[feed.id]:e.target.value}))} style={{width:55,textAlign:"right"}} placeholder="0"/></td>
                            <td style={{padding:"5px 6px"}}><input type="number" min={0} step={0.1} value={amounts[feed.id]||""} onChange={e=>setAmounts(p=>({...p,[feed.id]:e.target.value}))} style={{width:60,textAlign:"right"}} placeholder="0.0"/></td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"5px 6px"}}>{dm.toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"5px 6px"}}>{(dm*feed.tdn/100).toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"5px 6px"}}>{(dm*feed.cp/100).toFixed(3)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"5px 6px"}}>{(dm*feed.ca/100).toFixed(4)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textDim,textAlign:"right",padding:"5px 6px"}}>{(dm*feed.p/100).toFixed(4)}</td>
                            <td style={{padding:"5px 3px"}}><button onClick={()=>removeFeed(feed.id)} style={{background:"transparent",color:"#6a2a2a",border:`1px solid #2a1212`,borderRadius:3,padding:"2px 5px",fontSize:10}}>✕</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{borderTop:`2px solid ${C.accentDim}`}}>
                        <td colSpan={2} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,padding:"6px 6px",letterSpacing:1}}>TOTAL / HEAD / DAY</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"6px"}}>{totals.asFed.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"6px"}}>{totals.dmi.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"6px"}}>{totals.tdn.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"6px"}}>{totals.cp.toFixed(3)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"6px"}}>{totals.ca.toFixed(4)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.accent,textAlign:"right",padding:"6px"}}>{totals.p.toFixed(4)}</td>
                        <td/>
                      </tr>
                    </tfoot>
                  </table>
                  {totals.cost>0&&<div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.accent,textAlign:"right",marginTop:5}}>${totals.cost.toFixed(2)}/head/day · ${(totals.cost*numHead).toFixed(2)}/herd/day</div>}
                </div>
              )}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"14px 16px",marginBottom:10}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>Nutrient Balance · have / need · delta · status</div>
                <MBar label="Dry Matter Intake" have={totals.dmi} need={animal.dmi} unit="lb DM" pct={pcts.dmi} dec={2}/>
                <MBar label="TDN" have={totals.tdn} need={animal.tdn} unit="lb" pct={pcts.tdn} dec={2}/>
                <MBar label="Crude Protein" have={totals.cp} need={animal.cp} unit="lb" pct={pcts.cp} dec={3}/>
                <MBar label="Calcium" have={totals.ca} need={animal.ca} unit="lb" pct={pcts.ca} dec={4}/>
                <MBar label="Phosphorus" have={totals.p} need={animal.p} unit="lb" pct={pcts.p} dec={4}/>
                <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:1}}>Ca:P RATIO</span>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:12,color:caP!==null&&caP>=1.5&&caP<=5?C.green:C.red}}>{caP!==null?caP.toFixed(2)+" : 1":"—"}<span style={{fontSize:8,color:C.textMute,marginLeft:8}}>target 1.5–5:1</span></span>
                </div>
              </div>
              {recs.length>0&&(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:"10px 14px",marginBottom:10}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Recommendations</div>
                  {recs.map((r,i)=>(<div key={i} style={{fontFamily:"DM Mono,monospace",fontSize:11,color:r.t==="ok"?C.green:r.t==="low"?C.red:r.t==="hi"?C.orange:C.orange,marginBottom:4}}>{r.t==="ok"?"✓":r.t==="low"?"▲":r.t==="hi"?"▼":"⚠"} {r.m}</div>))}
                </div>
              )}

            </>
          )}

          {/* ════ RATIONS ════ */}
          {tab==="rations"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Saved Rations — {savedRations.length}</div>
              {savedRations.length===0?(
                <div style={{border:`1px dashed ${C.border}`,borderRadius:6,padding:"32px 0",textAlign:"center",color:C.textMute,fontFamily:"DM Mono,monospace",fontSize:12}}>No saved rations yet — build a ration and click "Save This Ration"</div>
              ):(
                savedRations.map(r=>(
                  <div key={r.id} style={{background:C.card,border:`1px solid ${C.border2}`,borderRadius:6,padding:"12px 14px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <span style={{fontFamily:"DM Mono,monospace",fontSize:14,color:C.text,fontWeight:500}}>{r.name}</span>
                          {rationUsage[r.id]&&<span className="tag" style={{background:C.greenBg,color:C.green,border:`1px solid ${C.greenBdr}`}}>IN USE</span>}
                        </div>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim}}>{ANIMAL_CLASSES.find(a=>a.id===(r.animalId||r.animal_id))?.group||""} · {ANIMAL_CLASSES.find(a=>a.id===(r.animalId||r.animal_id))?.bw||""} lb · {r.numHead||r.num_head||1} head</div>
                        {rationUsage[r.id]&&<div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.green,marginTop:2}}>Fed to: {rationUsage[r.id].join(", ")}</div>}
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute,marginTop:2}}>Created {fmtDate(r.date||r.created_at?.split("T")[0])} · {(r.rations||[]).length} ingredient{(r.rations||[]).length!==1?"s":""}</div>
                      </div>
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button className="btn-primary" onClick={()=>loadRation(r)}>Load</button>
                        <button className="btn-danger" onClick={()=>setConfirmDelR(r.id)}>Delete</button>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {(r.rations||[]).map(fid=>{
                        const feed=allFeeds.find(f=>f.id===fid);
                        const af=parseFloat((r.amounts||{})[fid]||0);
                        return feed?(<div key={fid} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:3,padding:"3px 8px",fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim}}>{feed.name} <span style={{color:C.accent}}>{af.toFixed(1)} lb</span></div>):null;
                      })}
                    </div>
                    {confirmDelR===r.id&&(
                      <div style={{marginTop:8,padding:"8px 10px",background:C.redBg,border:`1px solid #3a1818`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.red}}>Delete "{r.name}"?</span>
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>deleteRation(r.id)} style={{background:"#3a1818",color:"#ff8888",border:"1px solid #5a2a2a",borderRadius:3,padding:"3px 10px",fontSize:9}}>Delete</button>
                          <button className="btn-ghost" onClick={()=>setConfirmDelR(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* ════ LIBRARY ════ */}
          {tab==="library"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Book Feed Library — {BOOK_FEEDS.length} Feeds</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                {["All","Legume Hay","Grass Hay","Silage","Straw","Grain","Protein","Mineral"].map(c=>(<button key={c} onClick={()=>setFilterCat(c)} style={{padding:"3px 8px",fontSize:8,background:filterCat===c?C.accentBg:C.card,color:filterCat===c?C.accent:C.textMute,border:`1px solid ${filterCat===c?C.accentDim:C.border}`,borderRadius:3}}>{c}</button>))}
              </div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Feed","Category","DM%","TDN%","CP%","Ca%","P%"].map(h=>(<th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,textAlign:["Feed","Category"].includes(h)?"left":"right",padding:"4px 7px 5px",fontWeight:400}}>{h}</th>))}</tr></thead>
                <tbody>
                  {(filterCat==="All"?BOOK_FEEDS:BOOK_FEEDS.filter(f=>f.cat===filterCat)).map((f,i)=>(
                    <tr key={f.id} style={{borderBottom:`1px solid ${C.bg}`,background:i%2===0?"transparent":C.card}}>
                      <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.text,padding:"5px 7px"}}>{f.name}</td>
                      <td style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,padding:"5px 7px"}}>{f.cat}</td>
                      {[f.dm,f.tdn,f.cp,f.ca,f.p].map((v,j)=>(<td key={j} style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.textDim,textAlign:"right",padding:"5px 7px"}}>{v}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ════ MY TESTS ════ */}
          {tab==="my tests"&&(
            <>
              {testTab!=="form"&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,textTransform:"uppercase"}}>Feed Tests — {activeLab.length} Active{archivedLab.length>0?` · ${archivedLab.length} Archived`:""}</div>
                  <div style={{display:"flex",gap:6}}>
                    {archivedLab.length>0&&<button className="btn-ghost" onClick={()=>setShowArch(p=>!p)}>{showArch?"Hide Archived":"Show Archived"}</button>}
                    <button className="btn-primary" onClick={openNewTest}>+ New Entry</button>
                  </div>
                </div>
              )}
              {testTab==="list"&&(
                <>
                  {[...activeLab,...(showArch?archivedLab:[])].length===0?(
                    <div style={{border:`1px dashed ${C.border}`,borderRadius:6,padding:"32px 0",textAlign:"center",color:C.textMute,fontFamily:"DM Mono,monospace",fontSize:12}}>No feed tests yet — click "+ New Entry"</div>
                  ):(
                    [...activeLab,...(showArch?archivedLab:[])].map(t=>(
                      <div key={t.id} style={{background:C.card,border:`1px solid ${t.archived?C.border:C.border2}`,borderRadius:6,padding:"11px 13px",marginBottom:7,opacity:t.archived?0.6:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:13,color:C.text,fontWeight:500}}>{t.name}</span>
                              <span className="tag" style={{background:t.source==="lab"?C.greenBg:C.accentBg,color:t.source==="lab"?C.labGreen:C.accent,border:`1px solid ${t.source==="lab"?C.greenBdr:C.accentDim}`}}>{t.source==="lab"?"LAB":"MANUAL"}</span>
                              {t.archived&&<span className="tag" style={{background:C.card,color:C.textMute,border:`1px solid ${C.border}`}}>ARCHIVED</span>}
                            </div>
                            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim}}>{t.cat}{t.labDate?` · ${fmtDate(t.labDate)}`:""}{t.sampleNo?` · #${t.sampleNo}`:""}</div>
                          </div>
                          <div style={{display:"flex",gap:4,flexShrink:0}}>
                            <button className="btn-ghost" onClick={()=>openEditTest(t)} style={{padding:"4px 8px",fontSize:8}}>Edit</button>
                            {t.archived?<button className="btn-ghost" onClick={()=>archiveTest(t.id,false)} style={{padding:"4px 8px",fontSize:8}}>Restore</button>:<button className="btn-ghost" onClick={()=>archiveTest(t.id,true)} style={{padding:"4px 8px",fontSize:8}}>Archive</button>}
                            <button className="btn-danger" onClick={()=>setConfirmDel(t.id)} style={{padding:"4px 8px",fontSize:8}}>✕</button>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {[["DM",t.dm+"%"],["TDN",t.tdn+"%"],["CP",t.cp+"%"],["Ca",t.ca+"%"],["P",t.p+"%"],t.rfv?["RFV",""+t.rfv]:null].filter(Boolean).map(([l,v])=>(
                            <div key={l} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:3,padding:"2px 7px",display:"flex",gap:4}}>
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim}}>{l}</span>
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.text}}>{v}</span>
                            </div>
                          ))}
                        </div>
                        {confirmDel===t.id&&(
                          <div style={{marginTop:8,padding:"8px 10px",background:C.redBg,border:`1px solid #3a1818`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.red}}>Delete "{t.name}" permanently?</span>
                            <div style={{display:"flex",gap:5}}>
                              <button onClick={()=>deleteTest(t.id)} style={{background:"#3a1818",color:"#ff8888",border:"1px solid #5a2a2a",borderRadius:3,padding:"3px 9px",fontSize:9}}>Delete</button>
                              <button className="btn-ghost" onClick={()=>setConfirmDel(null)} style={{padding:"3px 7px"}}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
              {testTab==="form"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,textTransform:"uppercase"}}>{editTest?"Edit Feed Test":"New Feed Test"}</div>
                    <button className="btn-ghost" onClick={()=>setTestTab("list")}>← Cancel</button>
                  </div>
                  {!editTest&&(
                    <div style={{background:C.greenBg,border:`1px dashed ${C.greenBdr}`,borderRadius:5,padding:"11px 13px",marginBottom:12}}>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.labGreen,letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>Import from Lab PDF</div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.textDim,marginBottom:8,lineHeight:1.6}}>Upload a Dairyland Labs PDF — all fields auto-filled by AI.</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <label style={{background:C.greenBg,color:C.labGreen,border:`1px solid ${C.greenBdr}`,borderRadius:4,padding:"5px 12px",fontSize:9,letterSpacing:1,cursor:"pointer",display:"inline-block",textTransform:"uppercase"}}>
                          {parsing?"Reading...":"📄 Upload PDF"}
                          <input type="file" accept="application/pdf" disabled={parsing} onChange={e=>{if(e.target.files[0])parsePDF(e.target.files[0]);}} style={{display:"none"}}/>
                        </label>
                        {parsing&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim}}>Parsing with AI...</span>}
                        {parseErr&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.red}}>{parseErr}</span>}
                        {!parsing&&!parseErr&&formData.sample_no&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.green}}>✓ Parsed — review below</span>}
                      </div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Identification</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Name *</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="text" step="0.01" value={formData["name"]??""} onChange={e=>setFormData(p=>{...p,["name"]:e.target.value})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Category</label>
                        <select value={formData.cat} onChange={e=>setFormData(p=>({...p,cat:e.target.value}))} style={{width:130}}>{FEED_CATS.map(c=><option key={c}>{c}</option>)}</select>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Description</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="text" step="0.01" value={formData["description"]??""} onChange={e=>setFormData(p=>{...p,["description"]:e.target.value})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Sample No.</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="text" step="0.01" value={formData["sample_no"]??""} onChange={e=>setFormData(p=>{...p,["sample_no"]:e.target.value})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Lab Date (YYYY-MM-DD)</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="text" step="0.01" value={formData["lab_date"]??""} onChange={e=>setFormData(p=>{...p,["lab_date"]:e.target.value})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Source</label>
                        <select value={formData.source} onChange={e=>setFormData(p=>({...p,source:e.target.value}))} style={{width:130}}><option value="manual">Manual Entry</option><option value="lab">Lab Test</option></select>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>$/cwt</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute}}>as-fed</span>
                        <input type="number" step="0.01" value={formData["cost_per_ton"]??""} onChange={e=>setFormData(p=>{...p,["cost_per_ton"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,marginTop:12,textTransform:"uppercase"}}>As-Fed Basis</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Dry Matter %</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["dm"]??""} onChange={e=>setFormData(p=>{...p,["dm"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Moisture %</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["moisture"]??""} onChange={e=>setFormData(p=>{...p,["moisture"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>pH</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="text" step="0.01" value={formData["ph"]??""} onChange={e=>setFormData(p=>{...p,["ph"]:e.target.value})} style={{width:130}}/>
                      </div>
                    </div>
                    </div>
                    <div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>DM Basis (%) ★ = used in ration</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>TDN % ★</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute}}>used</span>
                        <input type="number" step="0.01" value={formData["tdn"]??""} onChange={e=>setFormData(p=>{...p,["tdn"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>CP % ★</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute}}>used</span>
                        <input type="number" step="0.01" value={formData["cp"]??""} onChange={e=>setFormData(p=>{...p,["cp"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Ca % ★</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute}}>used</span>
                        <input type="number" step="0.01" value={formData["ca"]??""} onChange={e=>setFormData(p=>{...p,["ca"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>P % ★</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.textMute}}>used</span>
                        <input type="number" step="0.01" value={formData["p"]??""} onChange={e=>setFormData(p=>{...p,["p"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>ADF %</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["adf"]??""} onChange={e=>setFormData(p=>{...p,["adf"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>aNDF %</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["andf"]??""} onChange={e=>setFormData(p=>{...p,["andf"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Ash %</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["ash"]??""} onChange={e=>setFormData(p=>{...p,["ash"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Fat (EE) %</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["fat"]??""} onChange={e=>setFormData(p=>{...p,["fat"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>K %</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["k"]??""} onChange={e=>setFormData(p=>{...p,["k"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>Mg %</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["mg"]??""} onChange={e=>setFormData(p=>{...p,["mg"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:8,marginTop:12,textTransform:"uppercase"}}>Energy (Mcal/cwt DM)</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>NEM</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["nem"]??""} onChange={e=>setFormData(p=>{...p,["nem"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>NEG</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["neg"]??""} onChange={e=>setFormData(p=>{...p,["neg"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textDim,letterSpacing:1,minWidth:140}}>RFV</label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step="0.01" value={formData["rfv"]??""} onChange={e=>setFormData(p=>{...p,["rfv"]:parseFloat(e.target.value)||0})} style={{width:130}}/>
                      </div>
                    </div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:C.accentDim,letterSpacing:2,marginBottom:5,marginTop:12,textTransform:"uppercase"}}>Notes</div>
                      <textarea value={formData.notes||""} onChange={e=>setFormData(p=>({...p,notes:e.target.value}))} style={{width:"100%",height:55,resize:"vertical"}} placeholder="Lab, date, crop info..."/>
                    </div>
                  </div>
                  <div style={{marginTop:14,display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button className="btn-ghost" onClick={()=>setTestTab("list")}>Cancel</button>
                    <button className="btn-primary" onClick={saveTest} style={{opacity:formData.name.trim()?1:0.4}}>{editTest?"Save Changes":"Add Feed Test"}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ASSIGN RATION MODAL */}
      {assignModal&&(
        <div className="modal-overlay" onClick={()=>setAssignModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.panel,border:`1px solid ${C.border2}`,borderRadius:8,padding:"22px 24px",width:480,maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.accentDim,letterSpacing:2,textTransform:"uppercase"}}>Assign Ration to: {groups.find(g=>g.id===assignModal)?.name}</div>
              <button className="btn-ghost" onClick={()=>setAssignModal(null)} style={{padding:"3px 8px"}}>✕</button>
            </div>
            {savedRations.length===0?(
              <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:C.textMute,padding:"20px 0",textAlign:"center"}}>No saved rations — build one in the Builder tab first.</div>
            ):(
              savedRations.map(r=>(
                <div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:"10px 12px",marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>assignRationToGroup(assignModal,r)}>
                  <div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:12,color:C.text,marginBottom:2}}>{r.name}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.textMute}}>{ANIMAL_CLASSES.find(a=>a.id===(r.animalId||r.animal_id))?.group||""} · {fmtDate(r.date)} · {(r.rations||[]).length} ingredients</div>
                  </div>
                  <button className="btn-primary" style={{flexShrink:0}}>Assign</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
