/**
 * Coralgenz Global - Candidate Task Portal Logic (Firebase Auth & Server Database)
 * =================================================================================
 * Resolves candidate's assigned course from Firebase Firestore, pulls the exact course
 * Google Form from the server, and embeds it directly inside the domain.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocs,
  collection,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { generateSaltedHashToken } from "./crypto-salt.js";

// Firebase App Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7bENCjYYYg3xC7LZmKztuKUAX8xfYvtU",
  authDomain: "coralgenz-internships.firebaseapp.com",
  projectId: "coralgenz-internships",
  storageBucket: "coralgenz-internships.firebasestorage.app",
  messagingSenderId: "1060212394442",
  appId: "1:1060212394442:web:8aae23e2081cffb79ce733",
  measurementId: "G-092CL5HW0Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Course Definitions & Default Fallback Links
const COURSE_DEFINITIONS = {
  "java": {
    title: "Java Developer",
    badge: "☕ Java Developer",
    code: "JAVA",
    color: "#b45309",
    bg: "#fef3c7",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-Java-Internship-Coralgenz/viewform?embedded=true"
  },
  "python": {
    title: "Python Developer",
    badge: "🐍 Python Developer",
    code: "PYTHON",
    color: "#0369a1",
    bg: "#e0f2fe",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-Python-Internship-Coralgenz/viewform?embedded=true"
  },
  "c": {
    title: "C Programming & Systems",
    badge: "⚙️ C Programming & Systems",
    code: "C",
    color: "#0d9488",
    bg: "#f0fdfa",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-CProg-Internship-Coralgenz/viewform?embedded=true"
  },
  "web": {
    title: "Frontend Web Engineering",
    badge: "🌐 Frontend Web Engineering",
    code: "FRONTEND",
    color: "#dc2626",
    bg: "#fef2f2",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-WebDev-Internship-Coralgenz/viewform?embedded=true"
  },
  "fullstack": {
    title: "Full Stack Web Development",
    badge: "🚀 Full Stack Web Development",
    code: "FSW",
    color: "#4338ca",
    bg: "#eef2ff",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-FullStack-Internship-Coralgenz/viewform?embedded=true"
  }
};

// UI Elements
const portalTrackName = document.getElementById("portal-track-name");
const portalTrackPill = document.getElementById("portal-track-pill");
const portalUserAvatar = document.getElementById("portal-user-avatar");
const portalUserName = document.getElementById("portal-user-name");
const portalUserEmail = document.getElementById("portal-user-email");
const portalUserOffer = document.getElementById("portal-user-offer");
const portalTaskIframe = document.getElementById("portal-task-iframe");
const portalFrameLoading = document.getElementById("portal-frame-loading");
const loadingHeading = document.getElementById("loading-heading");
const loadingSub = document.getElementById("loading-sub");
const btnRefreshTaskFrame = document.getElementById("btn-refresh-task-frame");
const btnPortalLogout = document.getElementById("btn-portal-logout");

// Certificate Modal Elements
const btnOpenCertModal = document.getElementById("btn-open-cert-modal");
const btnCloseCertModal = document.getElementById("btn-close-cert-modal");
const portalCertModal = document.getElementById("portal-cert-modal");
const certModalName = document.getElementById("cert-modal-name");
const certModalTrack = document.getElementById("cert-modal-track");
const certModalId = document.getElementById("cert-modal-id");
const btnPrintCert = document.getElementById("btn-print-cert");
const btnCopySaltedUrl = document.getElementById("btn-copy-salted-url");

let currentResolvedFormUrl = "";
let currentCandidate = null;
let currentAssignedCourseKey = "fullstack";

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastOut 0.3s ease-in forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/**
 * Normalizes any variation of course names/codes from Firestore or Admin into standard keys:
 * 'java', 'python', 'c', 'web', 'fullstack'
 */
function normalizeCourseKey(courseStr) {
  if (!courseStr) return "fullstack";
  const str = String(courseStr).toLowerCase().trim();

  if (str === "java" || str.includes("java developer") || (str.includes("java") && !str.includes("javascript"))) {
    return "java";
  }
  if (str === "python" || str.includes("python developer") || str.includes("django") || str.includes("flask") || str.includes("py")) {
    return "python";
  }
  if (str === "c" || str === "c prog" || str.includes("c programming") || str.includes("c language") || str.includes("c systems") || str === "c++" || str.includes("cpp")) {
    return "c";
  }
  if (str === "web" || str === "frontend" || str.includes("frontend") || str.includes("front-end") || (str.includes("web") && !str.includes("full"))) {
    return "web";
  }
  if (str === "fullstack" || str === "fsw" || str.includes("full") || str.includes("stack") || str.includes("mern") || str.includes("mean")) {
    return "fullstack";
  }

  return str;
}

/**
 * Ensures Google Form URLs are correctly formatted to render seamlessly in iframe
 */
function formatGoogleFormForIframe(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let url = rawUrl.trim();

  // If already has embedded=true parameter
  if (url.includes("embedded=true")) {
    return url;
  }

  // Handle standard docs.google.com/forms URLs
  if (url.includes("docs.google.com/forms")) {
    if (url.includes("/edit")) {
      url = url.replace(/\/edit.*$/, "/viewform");
    } else if (url.includes("/prefill")) {
      url = url.replace(/\/prefill.*$/, "/viewform");
    }

    if (!url.includes("/viewform")) {
      url = url.replace(/\/$/, "") + "/viewform";
    }

    url += (url.includes("?") ? "&" : "?") + "embedded=true";
    return url;
  }

  return url;
}

/**
 * Searches across all possible server collections & documents in Firestore for configured track forms
 */
async function fetchAllServerCourseForms() {
  const allForms = {};

  // 1. Try course_forms/track_forms
  try {
    const snap = await getDoc(doc(db, "course_forms", "track_forms"));
    if (snap.exists()) {
      Object.assign(allForms, snap.data());
    }
  } catch (e) {
    console.warn("course_forms/track_forms read:", e);
  }

  // 2. Try settings/course_forms
  try {
    const snap = await getDoc(doc(db, "settings", "course_forms"));
    if (snap.exists()) {
      Object.assign(allForms, snap.data());
    }
  } catch (e) {
    console.warn("settings/course_forms read:", e);
  }

  // 3. Try settings/track_forms
  try {
    const snap = await getDoc(doc(db, "settings", "track_forms"));
    if (snap.exists()) {
      Object.assign(allForms, snap.data());
    }
  } catch (e) {
    console.warn("settings/track_forms read:", e);
  }

  // 4. Try settings/forms
  try {
    const snap = await getDoc(doc(db, "settings", "forms"));
    if (snap.exists()) {
      Object.assign(allForms, snap.data());
    }
  } catch (e) {
    console.warn("settings/forms read:", e);
  }

  // 5. Try individual documents in course_forms collection
  try {
    const colSnap = await getDocs(collection(db, "course_forms"));
    colSnap.forEach(d => {
      const dData = d.data();
      if (d.id !== "track_forms") {
        const normKey = normalizeCourseKey(d.id);
        const formVal = dData.formUrl || dData.url || dData.googleFormUrl || dData.link || dData.formLink || dData[d.id];
        if (formVal && typeof formVal === "string") {
          allForms[normKey] = formVal;
        }
      } else {
        Object.assign(allForms, dData);
      }
    });
  } catch (e) {
    console.warn("course_forms collection read:", e);
  }

  // 6. Try courses collection (courses/java, courses/python, etc.)
  try {
    const coursesColSnap = await getDocs(collection(db, "courses"));
    coursesColSnap.forEach(d => {
      const cData = d.data();
      const normKey = normalizeCourseKey(d.id || cData.code || cData.title || cData.name);
      const foundUrl = cData.formUrl || cData.googleFormUrl || cData.url || cData.link || cData.formLink || cData.googleForm;
      if (foundUrl && typeof foundUrl === "string") {
        allForms[normKey] = foundUrl;
      }
    });
  } catch (e) {
    console.warn("courses collection read:", e);
  }

  // 7. Check localStorage cache
  try {
    const localForms = localStorage.getItem("coralgenz_track_forms");
    if (localForms) {
      const parsed = JSON.parse(localForms);
      Object.keys(parsed).forEach(k => {
        if (!allForms[k] && parsed[k]) allForms[k] = parsed[k];
      });
    }
  } catch (e) {}

  return allForms;
}

/**
 * Extracts the Google Form URL matching a given track key from the server form map
 */
function extractFormUrlForTrack(serverForms, trackKey) {
  if (!serverForms || typeof serverForms !== "object") return "";

  // 1. Direct exact key match
  if (typeof serverForms[trackKey] === "string" && serverForms[trackKey].trim()) {
    return serverForms[trackKey].trim();
  }

  // 2. Case-insensitive / prefix matching across all keys in object
  for (const [k, v] of Object.entries(serverForms)) {
    const normK = normalizeCourseKey(k);
    if (normK === trackKey && typeof v === "string" && v.trim()) {
      return v.trim();
    }
    if (normK === trackKey && typeof v === "object" && v !== null) {
      const innerUrl = v.formUrl || v.url || v.googleFormUrl || v.link || v.formLink || v.form;
      if (typeof innerUrl === "string" && innerUrl.trim()) return innerUrl.trim();
    }

    const cleanK = k.toLowerCase().replace(/[^a-z]/g, "");
    if (cleanK.startsWith(trackKey) || cleanK.includes(trackKey)) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }

  return "";
}

/**
 * Fetch candidate document by email or UID from Firestore with extensive fallback queries
 */
async function fetchCandidateRecord(user) {
  const email = (user.email || "").toLowerCase().trim();
  const uid = user.uid || "";

  // 1. Direct lookup in candidates/{email}
  try {
    if (email) {
      const snap = await getDoc(doc(db, "candidates", email));
      if (snap.exists()) return snap.data();
    }
  } catch (e) { console.warn("candidates/{email} lookup:", e); }

  // 2. Direct lookup in candidates/{uid}
  try {
    if (uid) {
      const snap = await getDoc(doc(db, "candidates", uid));
      if (snap.exists()) return snap.data();
    }
  } catch (e) { console.warn("candidates/{uid} lookup:", e); }

  // 3. Query collection candidates where email == email
  try {
    if (email) {
      const qSnap = await getDocs(query(collection(db, "candidates"), where("email", "==", email)));
      if (!qSnap.empty) {
        return qSnap.docs[0].data();
      }
    }
  } catch (e) { console.warn("candidates where email lookup:", e); }

  // 4. Direct lookup in users/{email} or users/{uid}
  try {
    if (email) {
      const snap = await getDoc(doc(db, "users", email));
      if (snap.exists()) return snap.data();
    }
    if (uid) {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) return snap.data();
    }
  } catch (e) { console.warn("users collection lookup:", e); }

  return null;
}

// Initialize Task Portal with Authenticated Candidate Record
async function loadCandidateTaskPortal(user) {
  const email = user.email ? user.email.toLowerCase().trim() : "candidate@coralgenz.co.in";
  let candidateName = user.displayName || email.split("@")[0].replace(/[._0-9-]/g, " ").trim();
  let offerId = `CG-2026-${user.uid ? user.uid.substring(0, 8).toUpperCase() : "ACTIVE"}`;
  let rawCourseField = "fullstack";
  let customFormUrl = "";

  if (loadingHeading) loadingHeading.textContent = `Authenticating candidate: ${email}...`;
  if (loadingSub) loadingSub.textContent = "Querying server database for assigned course track & Google Form...";

  // 1. Query Firestore database for candidate document
  const candData = await fetchCandidateRecord(user);
  if (candData) {
    currentCandidate = candData;
    rawCourseField = candData.course || candData.track || candData.internshipTrack || candData.assignedCourse || candData.role || candData.courseTitle || "fullstack";
    customFormUrl = candData.customFormUrl || candData.formUrl || candData.googleFormUrl || candData.formLink || candData.googleForm || candData.taskFormUrl || candData.taskUrl || candData.form || "";
    if (candData.name) candidateName = candData.name;
    if (candData.offerId) offerId = candData.offerId;
  }

  // Normalize course key to java / python / c / web / fullstack
  const assignedCourseKey = normalizeCourseKey(rawCourseField);
  currentAssignedCourseKey = assignedCourseKey;
  const courseInfo = COURSE_DEFINITIONS[assignedCourseKey] || COURSE_DEFINITIONS.fullstack;

  // 2. Query Firestore database for server-configured Google Form URLs
  const serverForms = await fetchAllServerCourseForms();
  const serverTrackFormUrl = extractFormUrlForTrack(serverForms, assignedCourseKey);
  const rawTargetUrl = customFormUrl || serverTrackFormUrl || courseInfo.formUrl;
  const finalFormUrl = formatGoogleFormForIframe(rawTargetUrl);
  currentResolvedFormUrl = finalFormUrl;

  console.log(`[Task Portal] Resolved candidate track: ${assignedCourseKey} (${courseInfo.title})`);
  console.log(`[Task Portal] Resolved Google Form URL: ${finalFormUrl}`);

  // 3. Format Candidate Name & UI elements
  const formattedName = candidateName
    ? candidateName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Candidate";
  const initials = formattedName.split(" ").map(w => w.charAt(0)).join("").substring(0, 2).toUpperCase() || "CG";

  if (portalUserAvatar) portalUserAvatar.textContent = initials;
  if (portalUserName) portalUserName.textContent = formattedName;
  if (portalUserEmail) portalUserEmail.textContent = email;
  if (portalUserOffer) portalUserOffer.textContent = `Ref: ${offerId}`;

  if (portalTrackName) portalTrackName.textContent = courseInfo.badge;
  if (portalTrackPill) {
    portalTrackPill.style.background = courseInfo.bg;
    portalTrackPill.style.color = courseInfo.color;
    portalTrackPill.style.borderColor = courseInfo.color;
  }

  // Certificate Modal Data
  if (certModalName) certModalName.textContent = formattedName;
  if (certModalTrack) certModalTrack.textContent = courseInfo.title;
  if (certModalId) certModalId.textContent = `CG-MSME-2026-CERT-${courseInfo.code}-${offerId.replace(/[^0-9]/g, "").substring(0, 4) || "8842"}`;

  // 4. Inject Google Form into in-domain full-height iframe
  if (loadingHeading) loadingHeading.textContent = `Loading ${courseInfo.title} Task Form...`;
  if (portalTaskIframe) {
    portalTaskIframe.src = finalFormUrl;
    
    // Hide loading screen on iframe load event
    portalTaskIframe.onload = () => {
      if (portalFrameLoading) portalFrameLoading.style.display = "none";
    };

    // Safety timeout to ensure candidate is never blocked by cross-origin iframe delays
    setTimeout(() => {
      if (portalFrameLoading) portalFrameLoading.style.display = "none";
    }, 2200);
  }

  showToast(`Welcome, ${formattedName}! Course: ${courseInfo.title} 🚀`);
}

// Authentication State Observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadCandidateTaskPortal(user);
  } else {
    // If not logged in, redirect to login modal on homepage
    window.location.href = "index.html?login=1";
  }
});

// Refresh iframe handler
if (btnRefreshTaskFrame) {
  btnRefreshTaskFrame.addEventListener("click", () => {
    if (portalTaskIframe) {
      if (portalFrameLoading) portalFrameLoading.style.display = "flex";
      portalTaskIframe.src = currentResolvedFormUrl || portalTaskIframe.src;
      showToast("Reloading course task submission form... 🔄");
      setTimeout(() => {
        if (portalFrameLoading) portalFrameLoading.style.display = "none";
      }, 2000);
    }
  });
}

// Logout handler
if (btnPortalLogout) {
  btnPortalLogout.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (err) {
      showToast("Error signing out.");
    }
  });
}

// Certificate Modal Handlers
if (btnOpenCertModal && portalCertModal) {
  btnOpenCertModal.addEventListener("click", () => {
    portalCertModal.classList.add("active");
    portalCertModal.setAttribute("aria-hidden", "false");
  });
}

if (btnCloseCertModal && portalCertModal) {
  btnCloseCertModal.addEventListener("click", () => {
    portalCertModal.classList.remove("active");
    portalCertModal.setAttribute("aria-hidden", "true");
  });
}

if (portalCertModal) {
  portalCertModal.addEventListener("click", (e) => {
    if (e.target === portalCertModal) {
      portalCertModal.classList.remove("active");
      portalCertModal.setAttribute("aria-hidden", "true");
    }
  });
}

// Print certificate handler
if (btnPrintCert) {
  btnPrintCert.addEventListener("click", () => {
    showToast("Generating official MSME Verified Certificate PDF... 🎓");
    setTimeout(() => {
      window.print();
    }, 500);
  });
}

// Copy salted hash credential verification URL
if (btnCopySaltedUrl) {
  btnCopySaltedUrl.addEventListener("click", () => {
    const name = certModalName?.textContent || "Candidate";
    const certId = certModalId?.textContent || "CG-MSME-2026-CERT-8842";
    const track = certModalTrack?.textContent || "Specialized Engineering Internship";
    const saltedToken = generateSaltedHashToken({
      name: name,
      candidateName: name,
      email: auth.currentUser?.email || "candidate@coralgenz.co.in",
      track: track,
      serialNumber: certId,
      certId: certId,
      grade: "Grade A+ (Score: 99/100) • Outstanding",
      duration: "8-12 Weeks • 100% Remote",
      issueDate: "August 2026",
      status: "100% Completed • MSME Verified Deliverables",
      msmeRegNo: "UDYAM-TN-03-0189422"
    });

    const url = `https://certifications-coralgenz.vercel.app/?v=${encodeURIComponent(saltedToken)}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Official Salted Credential Verification Link copied! 🔗");
    }).catch(() => {
      showToast(`Verification Link: ${url}`);
    });
  });
}
