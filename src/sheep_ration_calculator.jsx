import { useState, useMemo, useEffect } from "react";

const STORAGE_KEY = "sheep_lab_tests_v1";

async function loadTests() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? JSON.parse(val) : null;
  } catch (e) { return null; }
}

async function saveTests(tests) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  } catch (e) {
    console.error("Storage save failed:", e);
  }
}

// ─── NRC 1985 REQUIREMENTS ────────────────────────────────────────────────────
const ANIMAL_CLASSES = [
  { id:"110_maint",   label:"110 lb – Maintenance",           bw:110, dmi:2.2, tdn:1.2,  cp:0.21, ca:2.0, p:1.8 },
  { id:"110_flush",   label:"110 lb – Flushing",              bw:110, dmi:3.5, tdn:2.15, cp:0.33, ca:5.3, p:2.6 },
  { id:"110_early_g", label:"110 lb – Early Gestation",       bw:110, dmi:2.6, tdn:1.5,  cp:0.25, ca:2.9, p:2.1 },
  { id:"110_late_g1", label:"110 lb – Late Gest (<150)",      bw:110, dmi:3.5, tdn:2.1,  cp:0.38, ca:5.9, p:4.8 },
  { id:"110_late_g2", label:"110 lb – Late Gest (>150)",      bw:110, dmi:3.7, tdn:2.4,  cp:0.43, ca:6.2, p:3.4 },
  { id:"110_lact_s",  label:"110 lb – Lactation Single",      bw:110, dmi:4.6, tdn:3.0,  cp:0.67, ca:8.9, p:6.1 },
  { id:"110_lact_t",  label:"110 lb – Lactation Twin",        bw:110, dmi:5.3, tdn:3.4,  cp:0.86, ca:10.5,p:7.3 },
  { id:"132_maint",   label:"132 lb – Maintenance",           bw:132, dmi:2.4, tdn:1.3,  cp:0.23, ca:2.3, p:2.1 },
  { id:"132_flush",   label:"132 lb – Flushing",              bw:132, dmi:3.7, tdn:2.4,  cp:0.34, ca:5.5, p:2.9 },
  { id:"132_early_g", label:"132 lb – Early Gestation",       bw:132, dmi:2.9, tdn:1.6,  cp:0.27, ca:3.2, p:2.5 },
  { id:"132_late_g1", label:"132 lb – Late Gest (<150)",      bw:132, dmi:3.7, tdn:2.2,  cp:0.40, ca:6.0, p:5.2 },
  { id:"132_late_g2", label:"132 lb – Late Gest (>150)",      bw:132, dmi:4.0, tdn:2.6,  cp:0.45, ca:6.9, p:4.0 },
  { id:"132_lact_s",  label:"132 lb – Lactation Single",      bw:132, dmi:5.1, tdn:3.3,  cp:0.70, ca:9.1, p:6.6 },
  { id:"132_lact_t",  label:"132 lb – Lactation Twin",        bw:132, dmi:5.7, tdn:3.7,  cp:0.89, ca:10.7,p:7.7 },
  { id:"154_maint",   label:"154 lb – Maintenance",           bw:154, dmi:2.6, tdn:1.5,  cp:0.25, ca:2.5, p:2.4 },
  { id:"154_flush",   label:"154 lb – Flushing",              bw:154, dmi:4.0, tdn:2.65, cp:0.36, ca:5.7, p:3.2 },
  { id:"154_early_g", label:"154 lb – Early Gestation",       bw:154, dmi:3.1, tdn:1.7,  cp:0.29, ca:3.5, p:2.9 },
  { id:"154_late_g1", label:"154 lb – Late Gest (<150)",      bw:154, dmi:4.0, tdn:2.3,  cp:0.42, ca:6.2, p:5.6 },
  { id:"154_late_g2", label:"154 lb – Late Gest (>150)",      bw:154, dmi:4.2, tdn:2.8,  cp:0.47, ca:7.6, p:4.5 },
  { id:"154_lact_s",  label:"154 lb – Lactation Single",      bw:154, dmi:5.5, tdn:3.6,  cp:0.73, ca:9.3, p:7.0 },
  { id:"154_lact_t",  label:"154 lb – Lactation Twin",        bw:154, dmi:6.2, tdn:4.0,  cp:0.92, ca:11.0,p:8.1 },
  { id:"176_maint",   label:"176 lb – Maintenance",           bw:176, dmi:2.9, tdn:1.6,  cp:0.27, ca:2.7, p:2.8 },
  { id:"176_flush",   label:"176 lb – Flushing",              bw:176, dmi:4.2, tdn:2.85, cp:0.38, ca:5.9, p:3.6 },
  { id:"176_early_g", label:"176 lb – Early Gestation",       bw:176, dmi:3.3, tdn:1.8,  cp:0.31, ca:3.8, p:3.3 },
  { id:"176_late_g1", label:"176 lb – Late Gest (<150)",      bw:176, dmi:4.2, tdn:2.4,  cp:0.44, ca:6.3, p:6.1 },
  { id:"176_late_g2", label:"176 lb – Late Gest (>150)",      bw:176, dmi:4.4, tdn:2.9,  cp:0.49, ca:8.3, p:5.1 },
  { id:"176_lact_s",  label:"176 lb – Lactation Single",      bw:176, dmi:5.7, tdn:3.7,  cp:0.76, ca:9.5, p:7.4 },
  { id:"176_lact_t",  label:"176 lb – Lactation Twin",        bw:176, dmi:6.6, tdn:4.3,  cp:0.96, ca:11.2,p:8.6 },
  { id:"198_maint",   label:"198 lb – Maintenance",           bw:198, dmi:3.1, tdn:1.7,  cp:0.29, ca:2.9, p:3.1 },
  { id:"198_flush",   label:"198 lb – Flushing",              bw:198, dmi:4.4, tdn:3.0,  cp:0.39, ca:6.1, p:3.9 },
  { id:"198_early_g", label:"198 lb – Early Gestation",       bw:198, dmi:3.5, tdn:1.9,  cp:0.33, ca:4.1, p:3.6 },
  { id:"198_late_g1", label:"198 lb – Late Gest (<150)",      bw:198, dmi:4.4, tdn:2.5,  cp:0.47, ca:6.4, p:6.5 },
  { id:"198_late_g2", label:"198 lb – Late Gest (>150)",      bw:198, dmi:4.6, tdn:3.0,  cp:0.51, ca:8.9, p:5.7 },
  { id:"198_lact_s",  label:"198 lb – Lactation Single",      bw:198, dmi:5.9, tdn:3.8,  cp:0.78, ca:9.6, p:7.8 },
  { id:"198_lact_t",  label:"198 lb – Lactation Twin",        bw:198, dmi:7.0, tdn:4.6,  cp:0.99, ca:11.4,p:9.1 },
];

// ─── BOOK FEED LIBRARY ────────────────────────────────────────────────────────
const BOOK_FEEDS = [
  { id:"alf_hay_mid",    name:"Alfalfa Hay – Mid Bloom",     cat:"Legume Forage", dm:89,tdn:58,cp:17,  ca:1.40,p:0.24,nem:58,neg:26 },
  { id:"alf_hay_full",   name:"Alfalfa Hay – Full Bloom",    cat:"Legume Forage", dm:88,tdn:54,cp:16,  ca:1.20,p:0.23,nem:54,neg:20 },
  { id:"alf_hay_mature", name:"Alfalfa Hay – Mature",        cat:"Legume Forage", dm:88,tdn:50,cp:13,  ca:1.18,p:0.19,nem:50,neg:12 },
  { id:"alf_silage",     name:"Alfalfa Silage",              cat:"Legume Forage", dm:30,tdn:55,cp:18,  ca:1.40,p:0.29,nem:55,neg:21 },
  { id:"clover_red_hay", name:"Clover Red Hay",              cat:"Legume Forage", dm:88,tdn:55,cp:15,  ca:1.50,p:0.25,nem:55,neg:21 },
  { id:"brome_hay",      name:"Bromegrass Hay",              cat:"Grass Forage",  dm:89,tdn:55,cp:10,  ca:0.40,p:0.23,nem:55,neg:21 },
  { id:"grass_hay",      name:"Grass Hay (book avg)",        cat:"Grass Forage",  dm:88,tdn:58,cp:10,  ca:0.60,p:0.21,nem:58,neg:26 },
  { id:"timothy_hay_e",  name:"Timothy Hay – Early Bloom",   cat:"Grass Forage",  dm:88,tdn:59,cp:11,  ca:0.58,p:0.26,nem:59,neg:28 },
  { id:"timothy_hay_f",  name:"Timothy Hay – Full Bloom",    cat:"Grass Forage",  dm:88,tdn:57,cp:8,   ca:0.43,p:0.20,nem:57,neg:25 },
  { id:"orchard_hay",    name:"Orchardgrass Hay",            cat:"Grass Forage",  dm:88,tdn:59,cp:10,  ca:0.32,p:0.30,nem:59,neg:28 },
  { id:"prairie_hay",    name:"Prairie Hay",                 cat:"Grass Forage",  dm:91,tdn:50,cp:7,   ca:0.40,p:0.15,nem:50,neg:12 },
  { id:"oat_hay",        name:"Oat Hay",                     cat:"Grass Forage",  dm:90,tdn:54,cp:10,  ca:0.40,p:0.27,nem:54,neg:20 },
  { id:"corn_silage_m",  name:"Corn Silage – Milk Stage",    cat:"Silage",        dm:26,tdn:65,cp:8,   ca:0.40,p:0.27,nem:66,neg:37 },
  { id:"corn_silage_ma", name:"Corn Silage – Mature",        cat:"Silage",        dm:34,tdn:72,cp:8,   ca:0.28,p:0.23,nem:75,neg:47 },
  { id:"sorghum_silage", name:"Sorghum Silage",              cat:"Silage",        dm:32,tdn:59,cp:9,   ca:0.48,p:0.21,nem:59,neg:28 },
  { id:"wheat_straw",    name:"Wheat Straw",                 cat:"Straw",         dm:91,tdn:43,cp:3,   ca:0.17,p:0.06,nem:44,neg:0  },
  { id:"oat_straw",      name:"Oat Straw",                   cat:"Straw",         dm:91,tdn:48,cp:4,   ca:0.24,p:0.07,nem:48,neg:9  },
  { id:"corn_stover",    name:"Corn Stover",                 cat:"Straw",         dm:80,tdn:54,cp:5,   ca:0.45,p:0.15,nem:54,neg:20 },
  { id:"corn_grain",     name:"Corn Grain – Whole",          cat:"Grain",         dm:88,tdn:88,cp:9,   ca:0.02,p:0.30,nem:98,neg:65 },
  { id:"corn_rolled",    name:"Corn Grain – Rolled/Ground",  cat:"Grain",         dm:88,tdn:88,cp:9,   ca:0.02,p:0.30,nem:98,neg:65 },
  { id:"oats",           name:"Oats",                        cat:"Grain",         dm:89,tdn:76,cp:13,  ca:0.05,p:0.41,nem:81,neg:52 },
  { id:"barley",         name:"Barley Grain",                cat:"Grain",         dm:89,tdn:84,cp:12,  ca:0.06,p:0.38,nem:92,neg:61 },
  { id:"wheat",          name:"Wheat Grain",                 cat:"Grain",         dm:89,tdn:88,cp:14,  ca:0.05,p:0.43,nem:98,neg:65 },
  { id:"milo",           name:"Sorghum Grain (Milo)",        cat:"Grain",         dm:89,tdn:82,cp:11,  ca:0.04,p:0.32,nem:89,neg:59 },
  { id:"sbm_44",         name:"Soybean Meal 44%",            cat:"Protein",       dm:90,tdn:84,cp:49,  ca:0.36,p:0.70,nem:92,neg:61 },
  { id:"sbm_49",         name:"Soybean Meal 49%",            cat:"Protein",       dm:90,tdn:87,cp:54,  ca:0.28,p:0.71,nem:96,neg:64 },
  { id:"whole_sb",       name:"Soybeans – Whole",            cat:"Protein",       dm:88,tdn:92,cp:41,  ca:0.27,p:0.64,nem:103,neg:70},
  { id:"sbh",            name:"Soybean Hulls",               cat:"Protein",       dm:90,tdn:77,cp:13,  ca:0.60,p:0.19,nem:82,neg:52 },
  { id:"canola_meal",    name:"Canola Meal",                 cat:"Protein",       dm:90,tdn:72,cp:41,  ca:0.74,p:1.14,nem:75,neg:47 },
  { id:"ddgs",           name:"DDGS – Corn, Dry",            cat:"Protein",       dm:91,tdn:99,cp:30,  ca:0.09,p:0.66,nem:113,neg:75},
  { id:"cgf",            name:"Corn Gluten Feed",            cat:"Protein",       dm:90,tdn:80,cp:22,  ca:0.11,p:0.84,nem:86,neg:56 },
  { id:"cottonseed_w",   name:"Cottonseed – Whole",          cat:"Protein",       dm:91,tdn:95,cp:23,  ca:0.16,p:0.64,nem:107,neg:73},
  { id:"wheat_bran",     name:"Wheat Bran",                  cat:"Protein",       dm:89,tdn:70,cp:17,  ca:0.13,p:1.32,nem:73,neg:44 },
  { id:"beet_pulp_d",    name:"Beet Pulp – Dried",           cat:"Protein",       dm:91,tdn:76,cp:10,  ca:0.65,p:0.08,nem:81,neg:52 },
  { id:"limestone",      name:"Limestone – Ground",          cat:"Mineral",       dm:98,tdn:0, cp:0,   ca:34.0,p:0.02,nem:0, neg:0  },
  { id:"dical_phos",     name:"Dicalcium Phosphate",         cat:"Mineral",       dm:96,tdn:0, cp:0,   ca:22.0,p:18.65,nem:0,neg:0  },
  { id:"salt",           name:"Salt (NaCl)",                 cat:"Mineral",       dm:100,tdn:0,cp:0,   ca:0,   p:0,   nem:0, neg:0  },
  { id:"amm_chloride",   name:"Ammonium Chloride",           cat:"Mineral",       dm:99,tdn:0, cp:0,   ca:0,   p:0,   nem:0, neg:0  },
];

// ─── YOUR LAB TESTS (pre-loaded from Dairyland Labs PDFs) ────────────────────
const INITIAL_LAB_TESTS = [
  {
    id: "lab_grass_balage",
    name: "Grass Balage (Jon's)",
    cat: "Grass Forage",
    source: "lab",
    archived: false,
    sampleNo: "5FJFV",
    labDate: "2025-12-12",
    feedType: "Haylage – Grass / Mixed grass silage",
    description: "grass balage",
    // As-is values
    dm: 42.17,
    // Dry matter basis values (from report)
    cp: 6.87,
    adf: 41.02,
    aNDF: 58.51,
    tdn: 57.0,    // OARDC TDN 1x = 59.12; ADF = 56.95; using OARDC
    ca: 0.61,
    p: 0.26,
    nem: 56.45,   // Mcal/cwt
    neg: 30.69,
    // extras
    moisture: 57.83,
    pH: 4.05,
    ash: 8.88,
    fat: 3.30,
    rfv: 90.54,
    k: 0.74,
    mg: 0.22,
    costPerTon: 0,
    notes: "Dairyland Labs #5FJFV, Dec 2025",
  },
  {
    id: "lab_2nd_cut_grass",
    name: "2nd Cut Grass Hay (Jon's)",
    cat: "Grass Forage",
    source: "lab",
    archived: false,
    sampleNo: "5FJFT",
    labDate: "2025-12-12",
    feedType: "Hay – Grass / Mixed grass hay",
    description: "2nd cut grass, 12-8-25",
    dm: 72.59,
    cp: 6.73,
    adf: 48.45,
    aNDF: 66.61,
    tdn: 51.12,   // OARDC TDN 1x
    ca: 0.45,
    p: 0.12,
    nem: 44.19,
    neg: 19.35,
    moisture: 27.41,
    pH: null,
    ash: 10.47,
    fat: 2.01,
    rfv: 71.44,
    k: 0.91,
    mg: 0.25,
    costPerTon: 0,
    notes: "Dairyland Labs #5FJFT, Dec 2025",
  },
];

const CATS = ["Legume Forage","Grass Forage","Silage","Straw","Grain","Protein","Mineral"];
const BWS = [110,132,154,176,198];

const BLANK_TEST = { name:"",cat:"Grass Forage",dm:88,cp:10,tdn:55,ca:0.50,p:0.20,nem:55,neg:21,costPerTon:0,notes:"",moisture:0,pH:"",ash:0,fat:0,rfv:0,k:0,mg:0,source:"manual",archived:false,feedType:"",sampleNo:"",labDate:"",description:"" };

const pctOf=(h,n)=>n>0?(h/n)*100:null;
const sc=p=>p===null?"#555":p<85?"#d95f3b":p<=115?"#4caf7d":"#e8a838";
const sl=p=>p===null?"—":p<85?"LOW":p<=115?"OK":"HIGH";
const fmtDate=d=>d?new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";

export default function SheepRationTool() {
  // ── state
  const [animalId, setAnimalId]   = useState("176_maint");
  const [numHead, setNumHead]     = useState(1);
  const [rations, setRations]     = useState([]);
  const [amounts, setAmounts]     = useState({});
  const [feedCosts, setFeedCosts] = useState({});
  const [tab, setTab]             = useState("builder");
  const [filterCat, setFilterCat] = useState("All");
  const [addId, setAddId]         = useState(BOOK_FEEDS[0].id);
  const [labTests, setLabTestsRaw]   = useState(INITIAL_LAB_TESTS);
  const [storageReady, setStorageReady] = useState(false);

  // Load from storage on mount; fall back to built-in defaults if nothing saved
  useEffect(() => {
    loadTests().then(saved => {
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setLabTestsRaw(saved);
      }
      setStorageReady(true);
    });
  }, []);

  // Save to storage whenever labTests changes (after initial load)
  const setLabTests = (updater) => {
    setLabTestsRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveTests(next);
      return next;
    });
  };
  const [testTab, setTestTab]     = useState("list");   // list | form | detail
  const [editTest, setEditTest]   = useState(null);     // null = new entry
  const [viewTest, setViewTest]   = useState(null);
  const [formData, setFormData]   = useState(BLANK_TEST);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDel, setConfirmDel]     = useState(null);
  const [parsing, setParsing]           = useState(false);
  const [parseError, setParseError]     = useState(null);

  const parsePDF = async (file) => {
    setParsing(true);
    setParseError(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("File read failed"));
        r.readAsDataURL(file);
      });
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
              { type: "text", text: "This is a forage/feed lab analysis report. Extract all values and return ONLY a JSON object with these exact keys (use null for any not found):\n{\"name\":\"short name from description field\",\"feedType\":\"feed type from header\",\"description\":\"description field\",\"sampleNo\":\"sample number\",\"labDate\":\"YYYY-MM-DD\",\"dm\":dry_matter_pct_asfed,\"moisture\":moisture_pct,\"pH\":pH_or_null,\"cp\":crude_protein_pct_DM,\"adf\":ADF_pct_DM,\"aNDF\":aNDF_pct_DM,\"tdn\":TDN_pct_DM_use_OARDC_if_available,\"nem\":NEM_Mcal_cwt_or_null,\"neg\":NEG_Mcal_cwt_or_null,\"ca\":calcium_pct_DM,\"p\":phosphorus_pct_DM,\"mg\":magnesium_pct_DM,\"k\":potassium_pct_DM,\"ash\":ash_pct_DM,\"fat\":fat_EE_pct_DM,\"rfv\":RFV_or_null,\"notes\":\"lab name, sample no, date\"}\nReturn ONLY the JSON object, no markdown fences, no explanation." }
            ]
          }]
        })
      });
      const data = await response.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setFormData(prev => ({
        ...prev,
        name:        parsed.name        || prev.name,
        feedType:    parsed.feedType    || "",
        description: parsed.description || "",
        sampleNo:    parsed.sampleNo    || "",
        labDate:     parsed.labDate     || "",
        dm:          parsed.dm          ?? prev.dm,
        moisture:    parsed.moisture    ?? 0,
        pH:          parsed.pH          ?? "",
        cp:          parsed.cp          ?? prev.cp,
        adf:         parsed.adf         ?? 0,
        aNDF:        parsed.aNDF        ?? 0,
        tdn:         parsed.tdn         ?? prev.tdn,
        nem:         parsed.nem         ?? 0,
        neg:         parsed.neg         ?? 0,
        ca:          parsed.ca          ?? prev.ca,
        p:           parsed.p           ?? prev.p,
        mg:          parsed.mg          ?? 0,
        k:           parsed.k           ?? 0,
        ash:         parsed.ash         ?? 0,
        fat:         parsed.fat         ?? 0,
        rfv:         parsed.rfv         ?? 0,
        notes:       parsed.notes       || "",
        source:      "lab",
      }));
    } catch (err) {
      setParseError("Could not parse PDF — " + err.message);
    } finally {
      setParsing(false);
    }
  };

  const animal = ANIMAL_CLASSES.find(a=>a.id===animalId);
  const activeLab = labTests.filter(t=>!t.archived);
  const archivedLab = labTests.filter(t=>t.archived);

  // All feeds = book + active lab tests
  const allFeeds = useMemo(()=>[
    ...activeLab.map(t=>({
      id:t.id, name:t.name, cat:t.cat, source:"lab",
      dm:t.dm, tdn:t.tdn, cp:t.cp, ca:t.ca, p:t.p, nem:t.nem, neg:t.neg
    })),
    ...BOOK_FEEDS
  ],[activeLab]);

  const rationFeeds = rations.map(id=>allFeeds.find(f=>f.id===id)).filter(Boolean);

  const totals = useMemo(()=>{
    let dmi=0,tdn=0,cp=0,ca=0,p=0,asFed=0,cost=0;
    rationFeeds.forEach(feed=>{
      const af=parseFloat(amounts[feed.id]||0);
      const dm=af*(feed.dm/100);
      dmi+=dm; tdn+=dm*(feed.tdn/100); cp+=dm*(feed.cp/100);
      ca+=dm*(feed.ca/100)*453.6; p+=dm*(feed.p/100)*453.6;
      asFed+=af;
      const cpt=parseFloat(feedCosts[feed.id]||0);
      cost+=af*(cpt/2000);
    });
    return{dmi,tdn,cp,ca,p,asFed,cost};
  },[rationFeeds,amounts,feedCosts]);

  const pcts={
    dmi:pctOf(totals.dmi,animal.dmi), tdn:pctOf(totals.tdn,animal.tdn),
    cp:pctOf(totals.cp,animal.cp),    ca:pctOf(totals.ca,animal.ca), p:pctOf(totals.p,animal.p),
  };
  const caP=totals.p>0?totals.ca/totals.p:null;

  const addFeed=()=>{
    if(!rations.includes(addId)){
      setRations(p=>[...p,addId]);
      setAmounts(p=>({...p,[addId]:""}));
    }
  };
  const removeFeed=id=>{
    setRations(r=>r.filter(x=>x!==id));
    setAmounts(a=>{const n={...a};delete n[id];return n;});
  };

  // Lab test CRUD
  const openNew=()=>{ setEditTest(null); setFormData({...BLANK_TEST,id:"lab_"+Date.now()}); setTestTab("form"); };
  const openEdit=t=>{ setEditTest(t.id); setFormData({...t}); setTestTab("form"); };
  const saveTest=()=>{
    if(!formData.name.trim())return;
    const entry={...formData,id:formData.id||"lab_"+Date.now(),source:formData.source||"manual",archived:false};
    if(editTest){
      setLabTests(prev=>prev.map(t=>t.id===editTest?entry:t));
    } else {
      setLabTests(prev=>[entry,...prev]);
    }
    setTestTab("list");
  };
  const archiveTest=id=>setLabTests(prev=>prev.map(t=>t.id===id?{...t,archived:true}:t));
  const unarchiveTest=id=>setLabTests(prev=>prev.map(t=>t.id===id?{...t,archived:false}:t));
  const deleteTest=id=>{ setLabTests(prev=>prev.filter(t=>t.id!==id)); setConfirmDel(null); };
  const viewDetail=t=>{ setViewTest(t); setTestTab("detail"); };

  const recs=useMemo(()=>{
    if(rationFeeds.length===0)return[];
    const r=[];
    if(pcts.dmi!==null&&pcts.dmi<85)  r.push({t:"low", m:"DMI below requirement — increase feed offered"});
    if(pcts.dmi!==null&&pcts.dmi>120) r.push({t:"high",m:"DMI exceeds requirement"});
    if(pcts.tdn!==null&&pcts.tdn<85)  r.push({t:"low", m:"Energy (TDN) deficient — add corn, barley, or better hay"});
    if(pcts.tdn!==null&&pcts.tdn>120) r.push({t:"high",m:"Energy (TDN) excessive — reduce grain"});
    if(pcts.cp!==null&&pcts.cp<85)    r.push({t:"low", m:"Protein deficient — add SBM, canola meal, or DDGS"});
    if(pcts.cp!==null&&pcts.cp>130)   r.push({t:"high",m:"Protein excessive — reduce supplement"});
    if(pcts.ca!==null&&pcts.ca<85)    r.push({t:"low", m:"Calcium low — add limestone or alfalfa"});
    if(pcts.p!==null&&pcts.p<85)      r.push({t:"low", m:"Phosphorus low — add dicalcium phosphate or grain"});
    if(caP!==null&&caP<1.5)           r.push({t:"warn",m:`Ca:P ${caP.toFixed(2)}:1 too narrow — urinary calculi risk; add limestone`});
    if(caP!==null&&caP>5.0)           r.push({t:"warn",m:`Ca:P ${caP.toFixed(2)}:1 very wide — may impair P absorption`});
    if(r.length===0)                   r.push({t:"ok",  m:"Ration balanced — all nutrients within range"});
    return r;
  },[pcts,caP,rationFeeds]);

  const MetricBar=({label,have,need,unit,pct,dec=2})=>{
    const color=sc(pct);
    const bw=pct!==null?Math.min(Math.max(pct,0),150):0;
    const diff=pct!==null?have-need:null;
    return(
      <div style={{marginBottom:11}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#5a7a4a",letterSpacing:1.5}}>{label}</span>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:11}}>
              <span style={{color:"#ddd"}}>{have.toFixed(dec)}</span>
              <span style={{color:"#303030"}}> / </span>
              <span style={{color:"#666"}}>{need.toFixed(dec)} {unit}</span>
            </span>
            {diff!==null&&<span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:diff<0?"#d95f3b":diff>0?"#e8a838":"#4caf7d",minWidth:62,textAlign:"right"}}>{diff>=0?"+":""}{diff.toFixed(dec)}</span>}
            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:700,color,minWidth:32,textAlign:"right"}}>{sl(pct)}</span>
          </div>
        </div>
        <div style={{background:"#151515",borderRadius:2,height:4,position:"relative"}}>
          <div style={{position:"absolute",left:"66.7%",top:-1,bottom:-1,width:1,background:"#1e2e1e"}}/>
          <div style={{width:bw*0.667+"%",background:color,height:"100%",borderRadius:2,transition:"width 0.3s ease",maxWidth:"100%"}}/>
        </div>
      </div>
    );
  };

  // ── FORM field helper
  const FField=({label,k,type="number",step="0.01",note})=>(
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:1,minWidth:120}}>{label}</label>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {note&&<span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#444"}}>{note}</span>}
          <input type={type} step={step} value={formData[k]??""} onChange={e=>setFormData(p=>({...p,[k]:type==="number"?parseFloat(e.target.value)||0:e.target.value}))} style={{width:130}}/>
        </div>
      </div>
    </div>
  );

  const filteredBookFeeds = filterCat==="All"?BOOK_FEEDS:BOOK_FEEDS.filter(f=>f.cat===filterCat);

  return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#ddd",fontFamily:"Georgia,serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0a0a}::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
        select,input[type=number],input[type=text],textarea{background:#121212!important;color:#ccc!important;border:1px solid #222!important;border-radius:3px;padding:5px 7px;font-family:DM Mono,monospace;font-size:11px;outline:none;transition:border-color 0.15s}
        select:focus,input:focus,textarea:focus{border-color:#344a34!important}
        select option{background:#121212}
        button{cursor:pointer;font-family:DM Mono,monospace}
        .feed-row:hover{background:#0d0d0d!important}
        .lab-badge{display:inline-block;padding:1px 6px;border-radius:2px;font-size:8px;font-family:DM Mono,monospace;letter-spacing:1px;font-weight:500}
      `}</style>

      {/* HEADER */}
      <div style={{padding:"14px 22px 10px",borderBottom:"1px solid #151515",background:"#060606",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:21,fontWeight:900,color:"#e4e0d5",letterSpacing:-0.5}}>Sheep Ration Tool</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",letterSpacing:2}}>NRC 1985 · TDN/CP · 110–198 LB EWES · LAB TEST MANAGER</div>
            <div style={{display:"flex",alignItems:"center",gap:3}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:storageReady?"#4caf7d":"#555"}}/>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:7,color:storageReady?"#3a6a3a":"#444"}}>{storageReady?"SAVED":"..."}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",border:"1px solid #1c1c1c",borderRadius:4,overflow:"hidden"}}>
          {["builder","summary","herd","library","my tests"].map(t=>(
            <button key={t} onClick={()=>{setTab(t);if(t==="my tests")setTestTab("list");}} style={{padding:"6px 13px",background:tab===t?"#131e13":"transparent",color:tab===t?"#6ea856":"#4a4a4a",border:"none",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",transition:"all 0.15s",position:"relative"}}>
              {t}
              {t==="my tests"&&activeLab.length>0&&<span style={{position:"absolute",top:3,right:4,background:"#4a7a3a",color:"#cef",borderRadius:8,fontSize:7,padding:"0 4px",fontWeight:700}}>{activeLab.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"290px 1fr",minHeight:"calc(100vh - 58px)"}}>

        {/* ── LEFT PANEL ── */}
        <div style={{borderRight:"1px solid #121212",padding:"14px 13px",background:"#080808",overflowY:"auto"}}>
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2,marginBottom:6}}>BODY WEIGHT</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:9}}>
              {BWS.map(bw=>(
                <button key={bw} onClick={()=>{const f=ANIMAL_CLASSES.find(a=>a.bw===bw);if(f)setAnimalId(f.id);}} style={{padding:"3px 8px",background:animal.bw===bw?"#182818":"#0e0e0e",color:animal.bw===bw?"#7ab060":"#444",border:`1px solid ${animal.bw===bw?"#2a4a2a":"#1c1c1c"}`,borderRadius:3,fontSize:11}}>{bw} lb</button>
              ))}
            </div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2,marginBottom:5}}>STAGE</div>
            <select value={animalId} onChange={e=>setAnimalId(e.target.value)} style={{width:"100%"}}>
              {ANIMAL_CLASSES.filter(a=>a.bw===animal.bw).map(a=>(
                <option key={a.id} value={a.id}>{a.label.replace(`${a.bw} lb – `,"")}</option>
              ))}
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2,marginBottom:5}}>NUMBER OF HEAD</div>
            <input type="number" min={1} value={numHead} onChange={e=>setNumHead(parseInt(e.target.value)||1)} style={{width:"100%"}}/>
          </div>

          {/* Requirements */}
          <div style={{background:"#0c0c0c",border:"1px solid #182818",borderRadius:5,padding:"10px 12px",marginBottom:14}}>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:8}}>REQUIREMENTS / HEAD / DAY</div>
            {[["DMI",animal.dmi,"lb DM"],["TDN",animal.tdn,"lb"],["CP",animal.cp,"lb"],["Ca",animal.ca,"g"],["P",animal.p,"g"]].map(([l,v,u])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#4a4a4a"}}>{l}</span>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#888"}}>{v} {u}</span>
              </div>
            ))}
            <div style={{fontFamily:"DM Mono,monospace",fontSize:7,color:"#2a4a2a",textAlign:"right",marginTop:6}}>NRC Sheep 6th Ed. 1985</div>
          </div>

          {/* Add feed */}
          <div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2,marginBottom:5}}>ADD TO RATION</div>
            {/* Lab tests quick-add */}
            {activeLab.length>0&&(
              <div style={{marginBottom:8}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:1,marginBottom:4}}>YOUR TESTED FEEDS</div>
                {activeLab.map(t=>(
                  <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontFamily:"Source Serif 4,serif",fontSize:12,color:"#b0b8a0",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</span>
                    <button onClick={()=>{if(!rations.includes(t.id)){setRations(p=>[...p,t.id]);setAmounts(p=>({...p,[t.id]:""}));}}} style={{background:"#182818",color:"#6ea856",border:"1px solid #253525",borderRadius:3,padding:"2px 8px",fontSize:10,marginLeft:6,whiteSpace:"nowrap"}}>+ Add</button>
                  </div>
                ))}
              </div>
            )}
            {/* Book feeds */}
            <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",letterSpacing:1,marginBottom:4}}>BOOK FEEDS</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>
              {["All","Grain","Protein","Mineral"].map(c=>(
                <button key={c} onClick={()=>setFilterCat(c)} style={{padding:"2px 6px",fontSize:8,background:filterCat===c?"#182818":"#0c0c0c",color:filterCat===c?"#6ea856":"#3a3a3a",border:`1px solid ${filterCat===c?"#284828":"#181818"}`,borderRadius:2}}>{c}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:5,marginBottom:6}}>
              <select value={addId} onChange={e=>setAddId(e.target.value)} style={{flex:1,minWidth:0}}>
                {(filterCat==="All"?CATS:CATS.filter(c=>c===filterCat)).map(cat=>(
                  <optgroup key={cat} label={cat}>
                    {BOOK_FEEDS.filter(f=>f.cat===cat).map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}
                  </optgroup>
                ))}
              </select>
              <button onClick={addFeed} style={{background:"#152015",color:"#6ea856",border:"1px solid #253525",borderRadius:3,padding:"5px 10px",fontSize:14}}>+</button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{padding:"14px 18px",overflowY:"auto"}}>

          {/* ═══════════════════ BUILDER ═══════════════════ */}
          {tab==="builder"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2,marginBottom:10}}>RATION — AS-FED lb / HEAD / DAY</div>
              {rationFeeds.length===0?(
                <div style={{color:"#252525",fontFamily:"DM Mono,monospace",fontSize:12,padding:"26px 0",textAlign:"center",border:"1px dashed #1a1a1a",borderRadius:4,marginBottom:14}}>← Add tested feeds or book feeds from the left panel</div>
              ):(
                <div style={{marginBottom:14}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid #181818"}}>
                        {["Feed","$/Ton","As-Fed lb","DM lb","TDN lb","CP lb","Ca g","P g",""].map(h=>(
                          <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",letterSpacing:1,textAlign:h==="Feed"?"left":"right",padding:"3px 6px 4px",fontWeight:400}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rationFeeds.map((feed,i)=>{
                        const af=parseFloat(amounts[feed.id]||0);
                        const dm=af*(feed.dm/100);
                        const isLab=feed.source==="lab";
                        return(
                          <tr key={feed.id} className="feed-row" style={{borderBottom:"1px solid #0f0f0f",background:i%2===0?"transparent":"#090909"}}>
                            <td style={{padding:"5px 6px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:5}}>
                                {isLab&&<span className="lab-badge" style={{background:"#1a3a1a",color:"#6ea856",border:"1px solid #2a5a2a"}}>LAB</span>}
                                <span style={{fontFamily:"Source Serif 4,serif",fontSize:13,color:"#c4c0b5"}}>{feed.name}</span>
                              </div>
                              <div style={{fontFamily:"DM Mono,monospace",fontSize:7,color:"#2a3a2a",marginTop:1}}>{feed.cat} · {feed.dm}% DM</div>
                            </td>
                            <td style={{padding:"5px 6px"}}>
                              <input type="number" min={0} step={10} value={feedCosts[feed.id]||""} onChange={e=>setFeedCosts(p=>({...p,[feed.id]:e.target.value}))} style={{width:58,textAlign:"right"}} placeholder="0"/>
                            </td>
                            <td style={{padding:"5px 6px"}}>
                              <input type="number" min={0} step={0.1} value={amounts[feed.id]||""} onChange={e=>setAmounts(p=>({...p,[feed.id]:e.target.value}))} style={{width:58,textAlign:"right"}} placeholder="0.0"/>
                            </td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"5px 6px"}}>{dm.toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"5px 6px"}}>{(dm*feed.tdn/100).toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"5px 6px"}}>{(dm*feed.cp/100).toFixed(3)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"5px 6px"}}>{(dm*feed.ca/100*453.6).toFixed(1)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"5px 6px"}}>{(dm*feed.p/100*453.6).toFixed(1)}</td>
                            <td style={{padding:"5px 3px"}}>
                              <button onClick={()=>removeFeed(feed.id)} style={{background:"transparent",color:"#3a1818",border:"1px solid #1c1010",borderRadius:2,padding:"2px 5px",fontSize:10}}>✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{borderTop:"2px solid #1c2c1c"}}>
                        <td colSpan={2} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#4a6a3a",letterSpacing:1,padding:"6px 6px"}}>TOTAL / HEAD / DAY</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#c4c0b5",textAlign:"right",padding:"6px"}}>{totals.asFed.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#c4c0b5",textAlign:"right",padding:"6px"}}>{totals.dmi.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#c4c0b5",textAlign:"right",padding:"6px"}}>{totals.tdn.toFixed(2)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#c4c0b5",textAlign:"right",padding:"6px"}}>{totals.cp.toFixed(3)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#c4c0b5",textAlign:"right",padding:"6px"}}>{totals.ca.toFixed(1)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#c4c0b5",textAlign:"right",padding:"6px"}}>{totals.p.toFixed(1)}</td>
                        <td/>
                      </tr>
                    </tfoot>
                  </table>
                  {totals.cost>0&&(
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#6ea856",textAlign:"right",marginTop:5}}>
                      ${totals.cost.toFixed(3)}/head/day · ${(totals.cost*numHead).toFixed(2)}/herd/day · ${(totals.cost*numHead*365).toFixed(0)}/yr
                    </div>
                  )}
                </div>
              )}

              {/* Balance bars */}
              <div style={{background:"#090909",border:"1px solid #142014",borderRadius:5,padding:"14px 16px",marginBottom:12}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:10}}>NUTRIENT BALANCE  have / need · delta · status</div>
                <MetricBar label="DRY MATTER INTAKE" have={totals.dmi} need={animal.dmi} unit="lb DM" pct={pcts.dmi}/>
                <MetricBar label="TDN" have={totals.tdn} need={animal.tdn} unit="lb" pct={pcts.tdn}/>
                <MetricBar label="CRUDE PROTEIN" have={totals.cp} need={animal.cp} unit="lb" pct={pcts.cp} dec={3}/>
                <MetricBar label="CALCIUM" have={totals.ca} need={animal.ca} unit="g" pct={pcts.ca} dec={1}/>
                <MetricBar label="PHOSPHORUS" have={totals.p} need={animal.p} unit="g" pct={pcts.p} dec={1}/>
                <div style={{borderTop:"1px solid #121212",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#4a6a3a",letterSpacing:1}}>Ca:P RATIO</span>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:12,color:caP!==null&&caP>=1.5&&caP<=5?"#4caf7d":"#d95f3b"}}>
                    {caP!==null?caP.toFixed(2)+" : 1":"—"}
                    <span style={{fontSize:8,color:"#333",marginLeft:8}}>target 1.5–5:1</span>
                  </span>
                </div>
              </div>
              {recs.length>0&&(
                <div style={{background:"#070d07",border:"1px solid #142014",borderRadius:4,padding:"10px 13px"}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",letterSpacing:2,marginBottom:7}}>RECOMMENDATIONS</div>
                  {recs.map((r,i)=>(
                    <div key={i} style={{fontFamily:"DM Mono,monospace",fontSize:11,color:r.t==="ok"?"#4caf7d":r.t==="low"?"#d95f3b":r.t==="high"?"#e8a838":"#e8a838",marginBottom:3}}>
                      {r.t==="ok"?"✓":r.t==="low"?"▲":r.t==="high"?"▼":"⚠"} {r.m}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══════════════════ SUMMARY ═══════════════════ */}
          {tab==="summary"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2,marginBottom:10}}>{animal.label.toUpperCase()} — EVALUATION</div>
              {rationFeeds.length===0?(
                <div style={{color:"#252525",fontFamily:"DM Mono,monospace",fontSize:12,padding:28,textAlign:"center"}}>Build a ration in the Builder tab first.</div>
              ):(
                <>
                  <div style={{background:"#090909",border:"1px solid #142014",borderRadius:5,padding:"14px 16px",marginBottom:14}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:10}}>DEFICIENCIES / SURPLUSES</div>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{borderBottom:"1px solid #181818"}}>
                          {["Nutrient","Required","Provided","Difference","% Met"].map(h=>(
                            <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",textAlign:h==="Nutrient"?"left":"right",padding:"3px 8px",fontWeight:400}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {l:"DMI (lb)",req:animal.dmi,have:totals.dmi,pct:pcts.dmi,dec:2},
                          {l:"TDN (lb)",req:animal.tdn,have:totals.tdn,pct:pcts.tdn,dec:2},
                          {l:"CP (lb)", req:animal.cp, have:totals.cp, pct:pcts.cp, dec:3},
                          {l:"Ca (g)",  req:animal.ca, have:totals.ca, pct:pcts.ca, dec:1},
                          {l:"P (g)",   req:animal.p,  have:totals.p,  pct:pcts.p,  dec:1},
                        ].map(row=>{
                          const diff=row.have-row.req; const col=sc(row.pct);
                          return(
                            <tr key={row.l} style={{borderBottom:"1px solid #0f0f0f"}}>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#888",padding:"6px 8px"}}>{row.l}</td>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#555",textAlign:"right",padding:"6px 8px"}}>{row.req.toFixed(row.dec)}</td>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:col,textAlign:"right",padding:"6px 8px"}}>{row.have.toFixed(row.dec)}</td>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:col,textAlign:"right",padding:"6px 8px"}}>{diff>=0?"+":""}{diff.toFixed(row.dec)}</td>
                              <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:col,textAlign:"right",padding:"6px 8px"}}>{row.pct!==null?row.pct.toFixed(0)+"%":"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#4a6a3a",letterSpacing:2,marginBottom:7}}>INGREDIENT DETAIL</div>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid #181818"}}>
                        {["Feed","As-Fed lb","% Ration","DM lb","TDN lb","CP lb","Ca g","P g"].map(h=>(
                          <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",textAlign:h==="Feed"?"left":"right",padding:"3px 7px",fontWeight:400}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rationFeeds.map(feed=>{
                        const af=parseFloat(amounts[feed.id]||0);
                        const dm=af*(feed.dm/100);
                        return(
                          <tr key={feed.id} style={{borderBottom:"1px solid #0f0f0f"}}>
                            <td style={{padding:"6px 7px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:4}}>
                                {feed.source==="lab"&&<span className="lab-badge" style={{background:"#1a3a1a",color:"#6ea856",border:"1px solid #2a5a2a"}}>LAB</span>}
                                <span style={{fontFamily:"Source Serif 4,serif",fontSize:12,color:"#c4c0b5"}}>{feed.name}</span>
                              </div>
                            </td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{af.toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{totals.asFed>0?(af/totals.asFed*100).toFixed(1):0}%</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{dm.toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{(dm*feed.tdn/100).toFixed(2)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{(dm*feed.cp/100).toFixed(3)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{(dm*feed.ca/100*453.6).toFixed(1)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{(dm*feed.p/100*453.6).toFixed(1)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* ═══════════════════ HERD ═══════════════════ */}
          {tab==="herd"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2,marginBottom:10}}>HERD TOTALS — {numHead} HEAD</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
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
                  <div key={l} style={{background:"#0c0c0c",border:"1px solid #151515",borderRadius:4,padding:"10px 11px"}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:7,color:"#3a5a2a",letterSpacing:1,marginBottom:4}}>{l.toUpperCase()}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:14,color:"#ddd"}}>{v}</div>
                  </div>
                ))}
              </div>
              {rationFeeds.length>0&&(
                <>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#4a6a3a",letterSpacing:2,marginBottom:7}}>BY INGREDIENT</div>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid #181818"}}>
                        {["Ingredient","lb/Day","lb/Week","lb/30 Days","$/Day","$/Month"].map(h=>(
                          <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",textAlign:h==="Ingredient"?"left":"right",padding:"3px 7px",fontWeight:400}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rationFeeds.map(feed=>{
                        const af=parseFloat(amounts[feed.id]||0)*numHead;
                        const cpt=parseFloat(feedCosts[feed.id]||0);
                        const cd=af*(cpt/2000);
                        return(
                          <tr key={feed.id} style={{borderBottom:"1px solid #0f0f0f"}}>
                            <td style={{fontFamily:"Source Serif 4,serif",fontSize:12,color:"#c4c0b5",padding:"6px 7px"}}>{feed.name}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{af.toFixed(1)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{(af*7).toFixed(0)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",textAlign:"right",padding:"6px 7px"}}>{(af*30).toFixed(0)}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:cpt>0?"#666":"#2a2a2a",textAlign:"right",padding:"6px 7px"}}>{cpt>0?"$"+cd.toFixed(2):"—"}</td>
                            <td style={{fontFamily:"DM Mono,monospace",fontSize:11,color:cpt>0?"#666":"#2a2a2a",textAlign:"right",padding:"6px 7px"}}>{cpt>0?"$"+(cd*30).toFixed(0):"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* ═══════════════════ LIBRARY ═══════════════════ */}
          {tab==="library"&&(
            <>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2,marginBottom:10}}>BOOK FEED LIBRARY — {BOOK_FEEDS.length} ENTRIES</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                {["All","Legume Forage","Grass Forage","Silage","Straw","Grain","Protein","Mineral"].map(c=>(
                  <button key={c} onClick={()=>setFilterCat(c)} style={{padding:"3px 8px",fontSize:8,background:filterCat===c?"#182818":"#0c0c0c",color:filterCat===c?"#6ea856":"#3a3a3a",border:`1px solid ${filterCat===c?"#284828":"#181818"}`,borderRadius:2}}>
                    {c} ({c==="All"?BOOK_FEEDS.length:BOOK_FEEDS.filter(f=>f.cat===c).length})
                  </button>
                ))}
              </div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #1a1a1a"}}>
                    {["Feed","Cat","DM%","TDN%","CP%","Ca%","P%","NEM","NEG"].map(h=>(
                      <th key={h} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",textAlign:["Feed","Cat"].includes(h)?"left":"right",padding:"3px 6px 4px",fontWeight:400}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(filterCat==="All"?BOOK_FEEDS:BOOK_FEEDS.filter(f=>f.cat===filterCat)).map((f,i)=>(
                    <tr key={f.id} style={{borderBottom:"1px solid #0e0e0e",background:i%2===0?"transparent":"#090909"}}>
                      <td style={{fontFamily:"Source Serif 4,serif",fontSize:12,color:"#c4c0b5",padding:"5px 6px"}}>{f.name}</td>
                      <td style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a",padding:"5px 6px",whiteSpace:"nowrap"}}>{f.cat}</td>
                      {[f.dm,f.tdn,f.cp,f.ca,f.p,f.nem,f.neg].map((v,j)=>(
                        <td key={j} style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#555",textAlign:"right",padding:"5px 6px"}}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ═══════════════════ MY TESTS ═══════════════════ */}
          {tab==="my tests"&&(
            <>
              {/* Sub-nav */}
              {testTab!=="form"&&testTab!=="detail"&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2}}>
                    MY FEED TESTS — {activeLab.length} ACTIVE{archivedLab.length>0?` · ${archivedLab.length} ARCHIVED`:""}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {archivedLab.length>0&&(
                      <button onClick={()=>setShowArchived(p=>!p)} style={{background:"transparent",color:"#556644",border:"1px solid #1e1e1e",borderRadius:3,padding:"5px 10px",fontSize:9,letterSpacing:1}}>
                        {showArchived?"HIDE ARCHIVED":"SHOW ARCHIVED"}
                      </button>
                    )}
                    <button onClick={openNew} style={{background:"#152015",color:"#6ea856",border:"1px solid #253525",borderRadius:3,padding:"5px 12px",fontSize:9,letterSpacing:1}}>+ NEW ENTRY</button>
                  </div>
                </div>
              )}

              {/* LIST */}
              {testTab==="list"&&(
                <>
                  {[...activeLab,...(showArchived?archivedLab:[])].length===0?(
                    <div style={{color:"#252525",fontFamily:"DM Mono,monospace",fontSize:12,padding:28,textAlign:"center",border:"1px dashed #1a1a1a",borderRadius:4}}>No feed tests yet — click "+ NEW ENTRY" to add one.</div>
                  ):(
                    [...activeLab,...(showArchived?archivedLab:[])].map(t=>(
                      <div key={t.id} style={{background:"#0c0c0c",border:`1px solid ${t.archived?"#1c1c14":"#182818"}`,borderRadius:5,padding:"12px 14px",marginBottom:8,opacity:t.archived?0.65:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                              <span style={{fontFamily:"Source Serif 4,serif",fontSize:15,color:"#d4d0c5"}}>{t.name}</span>
                              <span className="lab-badge" style={{background:t.source==="lab"?"#1a3a1a":"#1a1a2a",color:t.source==="lab"?"#6ea856":"#6a8ab0",border:`1px solid ${t.source==="lab"?"#2a5a2a":"#2a3a5a"}`}}>{t.source==="lab"?"LAB":"MANUAL"}</span>
                              {t.archived&&<span className="lab-badge" style={{background:"#1a1a12",color:"#888",border:"1px solid #2a2a1a"}}>ARCHIVED</span>}
                            </div>
                            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#3a5a2a"}}>
                              {t.cat}{t.labDate?` · ${fmtDate(t.labDate)}`:""}{t.sampleNo?` · Sample #${t.sampleNo}`:""}
                            </div>
                            {t.description&&<div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#445533",marginTop:2}}>{t.description}</div>}
                          </div>
                          <div style={{display:"flex",gap:5,flexShrink:0}}>
                            <button onClick={()=>viewDetail(t)} style={{background:"transparent",color:"#4a6a3a",border:"1px solid #1e2e1e",borderRadius:3,padding:"3px 8px",fontSize:9}}>VIEW</button>
                            <button onClick={()=>openEdit(t)} style={{background:"transparent",color:"#4a5a6a",border:"1px solid #1e242e",borderRadius:3,padding:"3px 8px",fontSize:9}}>EDIT</button>
                            {t.archived
                              ?<button onClick={()=>unarchiveTest(t.id)} style={{background:"transparent",color:"#6a6a4a",border:"1px solid #2a2a1e",borderRadius:3,padding:"3px 8px",fontSize:9}}>RESTORE</button>
                              :<button onClick={()=>archiveTest(t.id)} style={{background:"transparent",color:"#6a5a3a",border:"1px solid #2a241e",borderRadius:3,padding:"3px 8px",fontSize:9}}>ARCHIVE</button>
                            }
                            <button onClick={()=>setConfirmDel(t.id)} style={{background:"transparent",color:"#6a2a2a",border:"1px solid #2a1818",borderRadius:3,padding:"3px 8px",fontSize:9}}>DELETE</button>
                          </div>
                        </div>
                        {/* Quick stats */}
                        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                          {[["DM",t.dm+"%"],["TDN",t.tdn+"%"],["CP",t.cp+"%"],["Ca",t.ca+"%"],["P",t.p+"%"],t.rfv?["RFV",t.rfv]:null].filter(Boolean).map(([l,v])=>(
                            <div key={l} style={{background:"#080808",border:"1px solid #151515",borderRadius:3,padding:"4px 8px",display:"flex",gap:5,alignItems:"center"}}>
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a5a2a"}}>{l}</span>
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#aaa"}}>{v}</span>
                            </div>
                          ))}
                        </div>
                        {/* Delete confirm inline */}
                        {confirmDel===t.id&&(
                          <div style={{marginTop:8,padding:"8px 10px",background:"#1a0808",border:"1px solid #3a1818",borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#cc6666"}}>Delete "{t.name}" permanently?</span>
                            <div style={{display:"flex",gap:6}}>
                              <button onClick={()=>deleteTest(t.id)} style={{background:"#3a1818",color:"#ff8888",border:"1px solid #5a2a2a",borderRadius:3,padding:"3px 10px",fontSize:9}}>YES, DELETE</button>
                              <button onClick={()=>setConfirmDel(null)} style={{background:"transparent",color:"#666",border:"1px solid #222",borderRadius:3,padding:"3px 10px",fontSize:9}}>CANCEL</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}

              {/* DETAIL VIEW */}
              {testTab==="detail"&&viewTest&&(()=>{
                const t=labTests.find(x=>x.id===viewTest.id)||viewTest;
                return(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                          <span style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"#d4d0c5"}}>{t.name}</span>
                          <span className="lab-badge" style={{background:t.source==="lab"?"#1a3a1a":"#1a1a2a",color:t.source==="lab"?"#6ea856":"#6a8ab0",border:`1px solid ${t.source==="lab"?"#2a5a2a":"#2a3a5a"}`}}>{t.source==="lab"?"LAB":"MANUAL"}</span>
                        </div>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#3a5a2a"}}>{t.feedType}{t.labDate?` · ${fmtDate(t.labDate)}`:""}{t.sampleNo?` · #${t.sampleNo}`:""}</div>
                      </div>
                      <button onClick={()=>setTestTab("list")} style={{background:"transparent",color:"#555",border:"1px solid #1c1c1c",borderRadius:3,padding:"5px 10px",fontSize:9}}>← BACK</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      {/* As-fed */}
                      <div style={{background:"#0c0c0c",border:"1px solid #182818",borderRadius:5,padding:"12px 14px"}}>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:10}}>AS-FED BASIS</div>
                        {[["Dry Matter",t.dm+"%"],["Moisture",(t.moisture||100-t.dm).toFixed(2)+"%"],t.pH?["pH",t.pH]:null].filter(Boolean).map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#555"}}>{l}</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#aaa"}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {/* DM basis key */}
                      <div style={{background:"#0c0c0c",border:"1px solid #182818",borderRadius:5,padding:"12px 14px"}}>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:10}}>DRY MATTER BASIS</div>
                        {[["CP",t.cp+"%"],["TDN",t.tdn+"%"],["Ca",t.ca+"%"],["P",t.p+"%"],t.k?["K",t.k+"%"]:null,t.mg?["Mg",t.mg+"%"]:null,t.ash?["Ash",t.ash+"%"]:null,t.fat?["Fat (EE)",t.fat+"%"]:null].filter(Boolean).map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#555"}}>{l}</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#aaa"}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {/* Energy */}
                      <div style={{background:"#0c0c0c",border:"1px solid #182818",borderRadius:5,padding:"12px 14px"}}>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:10}}>ENERGY (Mcal/cwt DM)</div>
                        {[["NEM",t.nem],["NEG",t.neg]].map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#555"}}>{l}</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#aaa"}}>{v||"—"}</span>
                          </div>
                        ))}
                        {t.rfv&&(
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#555"}}>RFV</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#aaa"}}>{t.rfv}</span>
                          </div>
                        )}
                      </div>
                      {/* Notes */}
                      {t.notes&&(
                        <div style={{background:"#0c0c0c",border:"1px solid #182818",borderRadius:5,padding:"12px 14px"}}>
                          <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:8}}>NOTES</div>
                          <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#666",lineHeight:1.6}}>{t.notes}</div>
                        </div>
                      )}
                    </div>
                    <div style={{marginTop:14,display:"flex",gap:6}}>
                      <button onClick={()=>openEdit(t)} style={{background:"transparent",color:"#4a5a6a",border:"1px solid #1e242e",borderRadius:3,padding:"6px 14px",fontSize:9,letterSpacing:1}}>EDIT</button>
                      {t.archived
                        ?<button onClick={()=>{unarchiveTest(t.id);setTestTab("list");}} style={{background:"transparent",color:"#6a6a4a",border:"1px solid #2a2a1e",borderRadius:3,padding:"6px 14px",fontSize:9,letterSpacing:1}}>RESTORE</button>
                        :<button onClick={()=>{archiveTest(t.id);setTestTab("list");}} style={{background:"transparent",color:"#6a5a3a",border:"1px solid #2a241e",borderRadius:3,padding:"6px 14px",fontSize:9,letterSpacing:1}}>ARCHIVE</button>
                      }
                    </div>
                  </div>
                );
              })()}

              {/* FORM */}
              {testTab==="form"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:2}}>{editTest?"EDIT FEED TEST":"NEW FEED TEST"}</div>
                    <button onClick={()=>setTestTab("list")} style={{background:"transparent",color:"#555",border:"1px solid #1c1c1c",borderRadius:3,padding:"5px 10px",fontSize:9}}>← CANCEL</button>
                  </div>
                  {/* PDF UPLOAD PARSER */}
                  {!editTest&&(
                    <div style={{background:"#0c140c",border:"1px dashed #2a4a2a",borderRadius:5,padding:"12px 14px",marginBottom:14}}>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:8}}>IMPORT FROM LAB PDF</div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#556644",marginBottom:10,lineHeight:1.6}}>
                        Upload a Dairyland Labs (or similar) PDF and all fields will be auto-filled. You can review and edit before saving.
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                        <label style={{background:"#152015",color:"#6ea856",border:"1px solid #253525",borderRadius:3,padding:"6px 14px",fontSize:9,letterSpacing:1,cursor:"pointer",display:"inline-block"}}>
                          {parsing?"READING PDF...":"📄 UPLOAD PDF"}
                          <input type="file" accept="application/pdf" disabled={parsing} onChange={e=>{if(e.target.files[0])parsePDF(e.target.files[0]);}} style={{display:"none"}}/>
                        </label>
                        {parsing&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a7a4a"}}>Parsing with AI, please wait...</span>}
                        {parseError&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#d95f3b"}}>{parseError}</span>}
                        {!parsing&&!parseError&&formData.sampleNo&&<span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4caf7d"}}>✓ PDF parsed — review fields below</span>}
                      </div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    {/* Left col */}
                    <div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:8}}>IDENTIFICATION</div>
                      <FField label="Name *" k="name" type="text"/>
                      <div style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:1,minWidth:120}}>Category</label>
                          <select value={formData.cat} onChange={e=>setFormData(p=>({...p,cat:e.target.value}))} style={{width:130}}>
                            {CATS.map(c=><option key={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <FField label="Description" k="description" type="text"/>
                      <FField label="Feed Type" k="feedType" type="text"/>
                      <FField label="Sample No." k="sampleNo" type="text"/>
                      <FField label="Lab Date" k="labDate" type="text" note="YYYY-MM-DD"/>
                      <div style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <label style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"#4a6a3a",letterSpacing:1,minWidth:120}}>Source</label>
                          <select value={formData.source} onChange={e=>setFormData(p=>({...p,source:e.target.value}))} style={{width:130}}>
                            <option value="manual">Manual Entry</option>
                            <option value="lab">Lab Test</option>
                          </select>
                        </div>
                      </div>
                      <FField label="$/Ton" k="costPerTon" note="as-fed"/>

                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:8,marginTop:14}}>AS-FED</div>
                      <FField label="Dry Matter %" k="dm" note="as-is"/>
                      <FField label="Moisture %" k="moisture"/>
                      <FField label="pH" k="pH" type="text"/>
                    </div>

                    {/* Right col */}
                    <div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:8}}>DRY MATTER BASIS (%)</div>
                      <FField label="TDN %" k="tdn" note="used in ration"/>
                      <FField label="CP %" k="cp" note="used in ration"/>
                      <FField label="Ca %" k="ca" note="used in ration"/>
                      <FField label="P %" k="p" note="used in ration"/>
                      <FField label="ADF %" k="adf"/>
                      <FField label="aNDF %" k="aNDF"/>
                      <FField label="Ash %" k="ash"/>
                      <FField label="Fat (EE) %" k="fat"/>
                      <FField label="K %" k="k"/>
                      <FField label="Mg %" k="mg"/>

                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:8,marginTop:14}}>ENERGY (Mcal/cwt DM)</div>
                      <FField label="NEM" k="nem"/>
                      <FField label="NEG" k="neg"/>
                      <FField label="RFV" k="rfv" note="calc'd"/>

                      <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"#3a6a2a",letterSpacing:2,marginBottom:8,marginTop:14}}>NOTES</div>
                      <textarea value={formData.notes||""} onChange={e=>setFormData(p=>({...p,notes:e.target.value}))} style={{width:"100%",height:60,resize:"vertical",fontSize:11}} placeholder="Lab, date, crop info..."/>
                    </div>
                  </div>

                  <div style={{marginTop:16,display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setTestTab("list")} style={{background:"transparent",color:"#555",border:"1px solid #1e1e1e",borderRadius:3,padding:"7px 16px",fontSize:9,letterSpacing:1}}>CANCEL</button>
                    <button onClick={saveTest} style={{background:formData.name.trim()?"#152015":"#0e130e",color:formData.name.trim()?"#6ea856":"#3a4a3a",border:`1px solid ${formData.name.trim()?"#253525":"#1a1a1a"}`,borderRadius:3,padding:"7px 20px",fontSize:9,letterSpacing:1}}>
                      {editTest?"SAVE CHANGES":"ADD FEED TEST"}
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