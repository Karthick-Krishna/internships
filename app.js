/**
 * Coralgenz Internship Website - Main JavaScript Controller
 * Theme: Coralgenz Official Light Theme & Pure Development Focus
 * Backend: Firebase Authentication (Email & Password)
 * Security: Anti-Inspect & DevTools Protection Active
 * =========================================================
 */

// ==========================================
// 0. ANTI-INSPECT & DEVTOOLS RESTRICTION
// ==========================================
(function initAntiInspect() {
  // Prevent Right Click
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  }, { capture: true });

  // Prevent Developer Shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isModifier = e.ctrlKey || e.metaKey;
    const isShiftOrAlt = e.shiftKey || e.altKey;

    if (isModifier && isShiftOrAlt && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (isModifier && ['U', 'u', 'S', 's'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });
})();

// Import Firebase SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { 
  generateSaltedHashToken, 
  verifyAndDecodeSaltedHash, 
  isSaltedHashToken 
} from "./crypto-salt.js";

// ==========================================
// 1. FIREBASE AUTHENTICATION & FIRESTORE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD7bENCjYYYg3xC7LZmKztuKUAX8xfYvtU",
  authDomain: "coralgenz-internships.firebaseapp.com",
  projectId: "coralgenz-internships",
  storageBucket: "coralgenz-internships.firebasestorage.app",
  messagingSenderId: "1060212394442",
  appId: "1:1060212394442:web:8aae23e2081cffb79ce733",
  measurementId: "G-092CL5HW0Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics is optional in local or blocked environments
}

// ==========================================
// 2. CONFIGURATION: OFFICIAL APPLICATION GOOGLE FORM URL
// ==========================================
const OFFICIAL_APPLY_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScCFRGE3_ivVEoQyh4962KlxTBpI7-Ix2p95i7zbIZ7WDblMw/viewform?embedded=true";
const GOOGLE_FORM_URL = OFFICIAL_APPLY_FORM_URL;

// ==========================================
// 3. DETAILED TRACK DATA FOR MODAL
// ==========================================
const TRACKS_DATA = {
  "c-dev": {
    title: "C Programming & Systems Fundamentals",
    icon: "⚙️",
    meta: ["⚡ ₹499 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Build an unbreakable computer science foundation. Master procedural logic, pointers, dynamic memory management, low-level data structures, and hardware-software interaction in C.",
    curriculum: [
      "Procedural programming syntax, data types, control structures, and modular functions",
      "Mastering memory addresses, pointers, pointer arithmetic, and double pointers",
      "Dynamic memory allocation (malloc, calloc, realloc, free) and avoiding memory leaks",
      "Custom data types with structs, unions, bitfields, and file I/O operations",
      "Implementing foundational data structures (LinkedLists, Stacks) from scratch in C"
    ],
    skills: ["C Language", "Pointers & Memory", "Dynamic Memory", "Structs & Unions", "File I/O", "Data Structures in C", "Debugging (GDB)"]
  },
  "sql-db": {
    title: "SQL & Relational Database Engineering",
    icon: "🗄️",
    meta: ["⚡ ₹499 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Master database architecture and relational data modeling. Learn high-performance SQL querying, ACID transactions, complex joins, database indexing, and query optimization.",
    curriculum: [
      "Relational database design, Entity-Relationship (ER) modeling, and 3NF normalization",
      "Writing complex SQL queries, multi-table JOINs, subqueries, and window functions",
      "ACID transactions, concurrency control, locks, and stored procedures / triggers",
      "Database index optimization, execution plan analysis (EXPLAIN), and performance tuning",
      "Enterprise database administration with PostgreSQL and MySQL"
    ],
    skills: ["SQL", "PostgreSQL", "MySQL", "Relational DB", "Schema Design", "Query Optimization", "Database Indexing", "Transactions"]
  },
  "ui-ux": {
    title: "UI/UX & Product Design",
    icon: "🎨",
    meta: ["⚡ ₹499 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Bridge aesthetics and functionality. You will conduct user research, craft sleek design systems, build interactive prototypes in Figma, and design seamless digital experiences.",
    curriculum: [
      "User research, journey mapping, personas, and information architecture",
      "Wireframing, high-fidelity responsive UI design in Figma",
      "Design systems, reusable component libraries, tokens, and auto-layout",
      "Interactive micro-animations, clickable prototypes, and usability testing",
      "Design-to-code developer handoff and accessibility (WCAG) compliance"
    ],
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Wireframing", "UI Micro-interactions", "Usability Testing"]
  },
  "cpp-dev": {
    title: "C++ & Core Data Structures",
    icon: "⚡",
    meta: ["⚡ ₹499 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Master modern C++ and performance-critical software engineering. Dive deep into Object-Oriented Programming, Standard Template Library (STL), memory management, and high-efficiency algorithms.",
    curriculum: [
      "Modern C++ (C++17/20), OOP principles (Encapsulation, Inheritance, Polymorphism)",
      "Memory management with pointers, references, smart pointers (unique/shared), and RAII",
      "Deep dive into Standard Template Library (STL): Vectors, Maps, Sets, Queues, Iterators",
      "Operator overloading, generic programming with templates, and exception handling",
      "Building optimized CLI and system tools with performance profiling"
    ],
    skills: ["Modern C++", "OOP Principles", "STL Containers", "Smart Pointers", "Templates", "Memory Management", "Algorithms"]
  },
  "dsa-dev": {
    title: "Data Structures & Algorithms (DSA)",
    icon: "🧩",
    meta: ["⚡ ₹499 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Crack technical coding interviews with confidence. Master core algorithmic thinking, recursive problem-solving, tree/graph traversals, dynamic programming, and complexity analysis.",
    curriculum: [
      "Time and space complexity analysis (Big-O notation) and array manipulation patterns",
      "Linear data structures: Singly & Doubly Linked Lists, Stacks, Monotonic Queues",
      "Hierarchical data structures: Binary Trees, BSTs, Heaps, and Priority Queues",
      "Graph algorithms: BFS, DFS, Dijkstra, Topological Sort, and Disjoint Set (Union-Find)",
      "Dynamic Programming (1D/2D DP), Greedy strategies, Backtracking, and LeetCode patterns"
    ],
    skills: ["Data Structures", "Algorithms", "Big-O Analysis", "Binary Trees & Graphs", "Dynamic Programming", "Recursion", "LeetCode Patterns"]
  },
  "frontend": {
    title: "Frontend Web Engineering",
    icon: "💻",
    meta: ["⚡ ₹499 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Focus on crafting ultra-fast, smooth, and visually striking web interfaces. Master modern JavaScript, CSS animation techniques, component state, and web performance optimization.",
    curriculum: [
      "Advanced responsive layouts with modern CSS Grid, Flexbox, and TailwindCSS",
      "JavaScript ES6+, DOM manipulation, and asynchronous programming",
      "Component-driven development with React and state management",
      "Web performance auditing, Core Web Vitals optimization, and SEO best practices",
      "Creating smooth scroll interactions, micro-animations, and UI polish"
    ],
    skills: ["HTML5", "CSS3 / Modern CSS", "JavaScript ES6+", "React", "TailwindCSS", "Web Vitals", "Git Workflow"]
  },
  "python-dev": {
    title: "Python Developer",
    icon: "🐍",
    meta: ["⚡ ₹499 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Build scalable backend systems, automation workflows, and high-performance REST APIs using Python, Django, FastAPI, and PostgreSQL with clean, production-grade architecture.",
    curriculum: [
      "Advanced Python programming, data structures, and asynchronous programming",
      "Backend web development with Django and high-speed APIs with FastAPI",
      "Database integration, migrations, and querying with PostgreSQL & SQLAlchemy",
      "Task automation scripts, third-party API integrations, and web scraping",
      "Containerizing Python apps with Docker and deploying to cloud backends"
    ],
    skills: ["Python 3", "Django", "FastAPI", "PostgreSQL", "SQLAlchemy", "Automation", "REST APIs", "Docker"]
  },
  "java-dev": {
    title: "Java Developer",
    icon: "☕",
    meta: ["⚡ ₹499 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Master enterprise Java backend engineering. Architect robust Spring Boot microservices, high-throughput RESTful APIs, and database persistence using Hibernate and MySQL.",
    curriculum: [
      "Core Java 17+, Object-Oriented Design patterns, and Collections Framework",
      "Building scalable Spring Boot microservices and RESTful Web Services",
      "Data persistence, ORM mapping, and transaction management with Hibernate & JPA",
      "Securing backend endpoints with Spring Security and JWT authentication",
      "Database optimization in MySQL and unit testing with JUnit & Mockito"
    ],
    skills: ["Java 17+", "Spring Boot", "Hibernate / JPA", "RESTful APIs", "MySQL", "Microservices", "Maven", "JUnit"]
  },
  "fullstack": {
    title: "Full Stack Web Development",
    icon: "🌐",
    meta: ["⚡ ₹599 (Pay Only After Offer Letter)", "🌐 Remote"],
    description: "Immerse yourself in full-cycle modern web product engineering. Architect robust web platforms from responsive frontends to scalable microservices and SQL/NoSQL databases.",
    curriculum: [
      "Frontend architecture with React.js, Next.js, and TypeScript",
      "Building scalable REST & GraphQL APIs with Node.js and Express",
      "Database schema modeling and relational querying with PostgreSQL & Prisma",
      "Authentication flows (JWT, OAuth2), state management, and middleware security",
      "Deploying and monitoring production web apps with CI/CD"
    ],
    skills: ["React.js", "Node.js", "TypeScript", "PostgreSQL", "Next.js", "REST APIs", "Prisma", "Git/GitHub"]
  },
  "git-basics": {
    title: "Git Basics & GitHub Collaboration",
    icon: "🐙",
    meta: ["⏳ Coming Soon", "🌐 Remote"],
    description: "Master modern version control and team engineering workflows. Learn repository architectures, branch management, merge conflict resolution, pull request lifecycles, and open-source collaboration on GitHub.",
    curriculum: [
      "Git architecture, terminal CLI commands, repository initialization, and commits",
      "Branching workflows (Feature Branching, Git Flow), merging, and conflict resolution",
      "Remote repository management, GitHub pull requests, code reviews, and forks",
      "Advanced Git techniques: interactive rebase, cherry-pick, stash, tags, and revert",
      "Automating repository CI/CD checks and open-source contribution best practices"
    ],
    skills: ["Git CLI", "GitHub", "Branching & Merging", "Merge Conflicts", "Pull Requests", "Rebase", "Open Source", "Version Control"]
  },
  "prompt-eng": {
    title: "Prompt Engineering & Generative AI",
    icon: "✨",
    meta: ["⏳ Coming Soon", "🌐 Remote"],
    description: "Master enterprise prompt design patterns, few-shot prompting, chain-of-thought, system message architectures, RAG (Retrieval-Augmented Generation), and LLM API integrations with OpenAI, Claude, and Gemini.",
    curriculum: [
      "Advanced prompt patterns: Few-Shot, Chain-of-Thought (CoT), ReAct, and Directional Stimulus",
      "Retrieval-Augmented Generation (RAG) architecture and vector embeddings with Chroma / Pinecone",
      "Building production LLM application pipelines using LangChain and LlamaIndex",
      "Evaluating prompt performance, hallucination reduction, and context window optimization",
      "Integrating multimodal models (Vision, Audio, Code Generation) via REST APIs"
    ],
    skills: ["Prompt Engineering", "LLM APIs", "RAG Systems", "LangChain", "OpenAI / Claude API", "Vector Embeddings", "Context Optimization"]
  },
  "genai-agents": {
    title: "Generative AI & Autonomous Agents",
    icon: "🤖",
    meta: ["⏳ Coming Soon", "🌐 Remote"],
    description: "Architect autonomous multi-agent systems, AI agent workflows (LangGraph/CrewAI), vector databases (Pinecone/Chroma), function calling tools, and full-stack GenAI application backends.",
    curriculum: [
      "Multi-agent system architecture and agent coordination with LangGraph and CrewAI",
      "Function calling, tool use, and structured JSON outputs from Large Language Models",
      "Designing persistent agent memory, state machines, and autonomous reasoning loops",
      "Building end-to-end autonomous coding, research, and data extraction agents",
      "Deploying secure, production-ready AI agent microservices with FastAPI and Docker"
    ],
    skills: ["LangGraph", "CrewAI", "AI Agents", "Function Calling", "Vector DBs", "FastAPI", "Autonomous Workflows"]
  },
  "ai-ml": {
    title: "Applied AI & Machine Learning",
    icon: "🧠",
    meta: ["⏳ Coming Soon", "🌐 Remote"],
    description: "Dive into cutting-edge Applied AI. Build and train machine learning models, neural networks, natural language processing pipelines, and custom model fine-tuning with PyTorch.",
    curriculum: [
      "Supervised & unsupervised machine learning algorithms with Scikit-Learn",
      "Deep learning architectures (ANN, CNN, Transformers) with PyTorch",
      "Natural Language Processing (NLP), tokenization, and HuggingFace Transformers",
      "Fine-tuning open-source LLMs (Llama 3, Mistral) using LoRA / QLoRA techniques",
      "Deploying ML inference APIs using FastAPI and containerized endpoints"
    ],
    skills: ["Python", "PyTorch", "Scikit-Learn", "Transformers", "NLP", "HuggingFace", "Model Fine-Tuning", "FastAPI"]
  },
  "data-analytics": {
    title: "Data Science & Analytics",
    icon: "📊",
    meta: ["⏳ Coming Soon", "🌐 Remote"],
    description: "Transform complex raw data into actionable business intelligence. Learn data wrangling, exploratory data analysis, interactive dashboard visualization, and predictive statistical modeling.",
    curriculum: [
      "Exploratory Data Analysis (EDA) and data cleansing with Python Pandas & NumPy",
      "Advanced SQL querying, data warehousing concepts, and relational joins",
      "Interactive dashboard creation with PowerBI, Tableau, and Matplotlib/Seaborn",
      "Statistical modeling, hypothesis testing, and fundamental regression analytics",
      "Automating ETL pipelines and presenting data-driven business insights"
    ],
    skills: ["Python", "Pandas", "NumPy", "SQL", "PowerBI", "Data Visualization", "ETL Pipelines", "Statistics"]
  },
  "mobile-dev": {
    title: "Mobile App Development",
    icon: "📱",
    meta: ["⏳ Coming Soon", "🌐 Remote"],
    description: "Build fluid, cross-platform native iOS & Android applications using Flutter and React Native. Master mobile state management, native device APIs, and app store deployment.",
    curriculum: [
      "Cross-platform mobile UI architecture with Flutter/Dart and React Native",
      "State management using Riverpod / Redux Toolkit and navigation patterns",
      "Integrating REST APIs, offline data caching, and Firebase push notifications",
      "Hardware API integration (Camera, Geolocation, Biometrics, Device Storage)",
      "App performance optimization, mobile security, and Play Store / App Store preparation"
    ],
    skills: ["Flutter", "Dart", "React Native", "Firebase", "REST APIs", "Mobile UI/UX", "State Management", "Git"]
  }
};

// ==========================================
// 3. IN-DOMAIN APPLICATION GATEWAY CONTROLLER
// ==========================================
const applyModal = document.getElementById("apply-modal");
const applyModalClose = document.getElementById("apply-modal-close");
const applyIframe = document.getElementById("in-domain-apply-iframe");
const applyLoadingIndicator = document.getElementById("apply-loading-indicator");
const btnApplyRefresh = document.getElementById("btn-apply-refresh");
const applyModalTrackBadge = document.getElementById("apply-modal-track-badge");

function openApplyModal(optionalTrackTitle = "") {
  const trackParam = optionalTrackTitle ? "?track=" + encodeURIComponent(optionalTrackTitle) : "";
  showToast(`Opening Official Application Portal... 🚀`);
  setTimeout(() => {
    window.location.href = "apply.html" + trackParam;
  }, 200);
}

function handleApplyRedirect(event, optionalTrackTitle = "") {
  if (event) {
    event.preventDefault();
    if (typeof event.stopPropagation === "function") event.stopPropagation();
  }
  openApplyModal(optionalTrackTitle);
}

// Toast notification helper
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span class="toast-icon">✨</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ==========================================
// 4. MODAL CONTROLLER
// ==========================================
const roleModal = document.getElementById("role-modal");
const modalTitle = document.getElementById("modal-title");
const modalIcon = document.getElementById("modal-icon");
const modalMeta = document.getElementById("modal-meta");
const modalDesc = document.getElementById("modal-description");
const modalCurriculum = document.getElementById("modal-curriculum");
const modalSkills = document.getElementById("modal-skills");
const modalClose = document.getElementById("modal-close");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalApplyBtn = document.getElementById("modal-apply-btn");

let currentActiveTrackTitle = "";

function openTrackModal(trackId) {
  const data = TRACKS_DATA[trackId];
  if (!data) return;

  currentActiveTrackTitle = data.title;
  modalTitle.textContent = data.title;
  modalIcon.textContent = data.icon;

  // Render meta tags
  modalMeta.innerHTML = data.meta.map(m => `<span class="meta-tag">${m}</span>`).join("");

  // Render description
  modalDesc.textContent = data.description;

  // Render curriculum
  modalCurriculum.innerHTML = data.curriculum.map(item => `<li>${item}</li>`).join("");

  // Render skills
  modalSkills.innerHTML = data.skills.map(s => `<span class="modal-skill-pill">${s}</span>`).join("");

  // Show modal
  roleModal.classList.add("active");
  roleModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeTrackModal() {
  roleModal.classList.remove("active");
  roleModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Modal Event Listeners
if (modalClose) modalClose.addEventListener("click", closeTrackModal);
if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeTrackModal);

if (roleModal) {
  roleModal.addEventListener("click", (e) => {
    if (e.target === roleModal) closeTrackModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && roleModal.classList.contains("active")) {
    closeTrackModal();
  }
});

// ==========================================
// 5. COMING SOON OPPORTUNITIES TOGGLE
// ==========================================
function initComingSoonToggle() {
  const toggleComingSoonBtn = document.getElementById("btn-toggle-coming-soon");
  const comingSoonCards = document.querySelectorAll(".track-card-coming-soon");

  if (!toggleComingSoonBtn) return;

  toggleComingSoonBtn.addEventListener("click", function(e) {
    e.preventDefault();
    const isExpanded = this.classList.contains("active");

    if (isExpanded) {
      // Hide coming soon cards
      comingSoonCards.forEach(card => {
        card.classList.remove("is-visible");
        card.style.display = "none";
      });
      this.classList.remove("active");
      this.setAttribute("aria-expanded", "false");
      const labelSpan = this.querySelector(".toggle-btn-text") || this.querySelector("span:first-child");
      if (labelSpan) labelSpan.textContent = "✨ View Coming Soon Opportunities";
      const iconSpan = this.querySelector(".toggle-icon");
      if (iconSpan) iconSpan.textContent = "▼";
    } else {
      // Show coming soon cards
      comingSoonCards.forEach(card => {
        card.classList.add("is-visible");
        card.style.display = "flex";
      });
      this.classList.add("active");
      this.setAttribute("aria-expanded", "true");
      const labelSpan = this.querySelector(".toggle-btn-text") || this.querySelector("span:first-child");
      if (labelSpan) labelSpan.textContent = "▲ Hide Coming Soon Opportunities";
      const iconSpan = this.querySelector(".toggle-icon");
      if (iconSpan) iconSpan.textContent = "▲";

      // Smooth scroll to the revealed cards
      const firstComingSoonCard = document.querySelector(".track-card-coming-soon");
      if (firstComingSoonCard) {
        firstComingSoonCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initComingSoonToggle);
} else {
  initComingSoonToggle();
}

// Track Filter Buttons & Mobile Filter Chips
const filterButtons = document.querySelectorAll(".filter-btn, .filter-chip");
const trackCards = document.querySelectorAll(".track-card");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    const filter = btn.getAttribute("data-filter");

    trackCards.forEach(card => {
      const category = card.getAttribute("data-category");
      if (filter === "all" || category === filter) {
        card.style.display = "flex";
        card.classList.remove("hidden");
        card.style.opacity = "0";
        card.style.transform = "translateY(12px) scale(0.98)";
        requestAnimationFrame(() => {
          card.style.transition = "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
          card.style.opacity = "1";
          card.style.transform = "translateY(0) scale(1)";
        });
      } else {
        card.style.display = "none";
        card.classList.add("hidden");
      }
    });
  });
});

// ==========================================
// SCROLL PROGRESS & SCROLL-REVEAL OBSERVER
// ==========================================
(function initScrollAndReveal() {
  const progressBar = document.getElementById("scroll-progress-bar");
  
  function updateScrollProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();

  // Scroll entrance animation using IntersectionObserver
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -30px 0px"
    });

    document.querySelectorAll(".reveal-on-scroll, .section, .track-card, .perk-card, .timeline-step, .testimonial-card, .faq-item").forEach(el => {
      if (!el.classList.contains("reveal-on-scroll")) {
        el.classList.add("reveal-on-scroll");
      }
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal-on-scroll").forEach(el => el.classList.add("revealed"));
  }
})();

// View Details Buttons
const viewDetailButtons = document.querySelectorAll(".view-details-btn");
viewDetailButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    const trackId = btn.getAttribute("data-track-id");
    openTrackModal(trackId);
  });
});

// ==========================================
// 6. APPLY BUTTON EVENT LISTENERS (IN-DOMAIN MODAL)
// ==========================================
document.querySelectorAll(".apply-trigger, .pill-btn-main, #nav-apply-btn, #modal-apply-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trackTitle = btn.getAttribute("data-track-title") || 
                       btn.closest(".track-card")?.querySelector(".track-title")?.textContent?.trim() || 
                       currentActiveTrackTitle || "";
    openApplyModal(trackTitle);
  });
});

// Document-wide delegated listener to catch any dynamically clicked apply button/link
document.addEventListener("click", (e) => {
  const target = e.target;
  const applyBtn = target.closest(".apply-trigger, .pill-btn-main, #nav-apply-btn, #modal-apply-btn, .btn-apply, a[href*='apply'], button[data-action='apply']");
  if (applyBtn) {
    const text = (applyBtn.textContent || "").toLowerCase();
    if (text.includes("apply") || applyBtn.classList.contains("apply-trigger") || applyBtn.id === "nav-apply-btn" || applyBtn.id === "modal-apply-btn") {
      e.preventDefault();
      e.stopPropagation();
      const trackTitle = applyBtn.getAttribute("data-track-title") || 
                         applyBtn.closest(".track-card")?.querySelector(".track-title")?.textContent?.trim() || 
                         currentActiveTrackTitle || "";
      openApplyModal(trackTitle);
    }
  }
});

// ==========================================
// 7. FAQ ACCORDION
// ==========================================
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
  const questionBtn = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  questionBtn.addEventListener("click", () => {
    const isActive = item.classList.contains("active");

    // Close other FAQs
    faqItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove("active");
        otherItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        otherItem.querySelector(".faq-answer").style.maxHeight = null;
      }
    });

    // Toggle current
    if (isActive) {
      item.classList.remove("active");
      questionBtn.setAttribute("aria-expanded", "false");
      answer.style.maxHeight = null;
    } else {
      item.classList.add("active");
      questionBtn.setAttribute("aria-expanded", "true");
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  });
});



// ==========================================
// 9. NAVBAR SCROLL EFFECT & MOBILE MENU
// ==========================================
const navbar = document.getElementById("navbar");
const mobileToggle = document.getElementById("mobile-toggle");
const navMenu = document.getElementById("nav-menu");

window.addEventListener("scroll", () => {
  if (window.scrollY > 30) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

if (mobileToggle && navMenu) {
  mobileToggle.addEventListener("click", () => {
    navMenu.classList.toggle("mobile-active");
    mobileToggle.classList.toggle("is-active");
  });

  // Close mobile menu on clicking nav link
  navMenu.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("mobile-active");
      mobileToggle.classList.remove("is-active");
    });
  });
}

// ==========================================
// 10. LIGHT THEME AMBIENT PARTICLES
// ==========================================
const canvas = document.getElementById("particles-canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  let particlesArray = [];
  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 2.2 + 0.8;
      this.speedX = (Math.random() - 0.5) * 0.35;
      this.speedY = (Math.random() - 0.5) * 0.35;
      this.color = Math.random() > 0.5 ? "rgba(255, 86, 2, 0.25)" : "rgba(255, 126, 103, 0.2)";
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x < 0) this.x = w;
      if (this.x > w) this.x = 0;
      if (this.y < 0) this.y = h;
      if (this.y > h) this.y = 0;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function initParticles() {
    particlesArray = [];
    const count = Math.min(Math.floor((w * h) / 24000), 45);
    for (let i = 0; i < count; i++) {
      particlesArray.push(new Particle());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
  }

  initParticles();
  animateParticles();
}

// ==========================================
// 11. CANDIDATE TASK SUBMISSION & CERTIFICATION PORTAL (FIREBASE AUTH & FIRESTORE)
// ==========================================
const COURSE_DEFINITIONS = {
  "java": {
    title: "Java Developer",
    badge: "☕ Java Developer",
    code: "JAVA",
    color: "#b45309",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-Java-Internship-Coralgenz/viewform?embedded=true"
  },
  "python": {
    title: "Python Developer",
    badge: "🐍 Python Developer",
    code: "PYTHON",
    color: "#0369a1",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-Python-Internship-Coralgenz/viewform?embedded=true"
  },
  "c": {
    title: "C Programming & Systems",
    badge: "⚙️ C Programming & Systems",
    code: "C",
    color: "#0d9488",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-CProg-Internship-Coralgenz/viewform?embedded=true"
  },
  "web": {
    title: "Frontend Web Engineering",
    badge: "🌐 Frontend Web Engineering",
    code: "FRONTEND",
    color: "#dc2626",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-WebDev-Internship-Coralgenz/viewform?embedded=true"
  },
  "fullstack": {
    title: "Full Stack Web Development",
    badge: "🚀 Full Stack Web Development",
    code: "FSW",
    color: "#4338ca",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc60E8wJ7L-FullStack-Internship-Coralgenz/viewform?embedded=true"
  }
};

function initCandidateLoginModal() {
  const loginModal = document.getElementById("login-modal");
  const loginModalCard = document.getElementById("login-modal-card");
  const loginModalClose = document.getElementById("login-modal-close");
  const openLoginButtons = document.querySelectorAll(".open-login-modal-btn");
  const loginForm = document.getElementById("candidate-login-form");
  const statusBox = document.getElementById("login-modal-status");
  const submitBtn = document.getElementById("btn-login-submit");
  const submitBtnText = document.getElementById("btn-login-submit-text");
  const btnForgotPassword = document.getElementById("btn-forgot-password");

  // Role Switcher Elements
  const btnRoleCandidate = document.getElementById("btn-role-candidate");
  const btnRoleAdmin = document.getElementById("btn-role-admin");

  if (!loginModal) return;

  function showStatus(targetBox, type, title, message) {
    if (!targetBox) return;
    targetBox.className = `login-modal-status-box status-${type}`;
    targetBox.style.display = "flex";
    const icon = type === "success" ? "✅" : type === "info" ? "ℹ️" : "⚠️";
    targetBox.innerHTML = `
      <span class="status-icon">${icon}</span>
      <div>
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
    `;
  }

  function openLogin() {
    loginModal.classList.add("active");
    loginModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const bottomBar = document.getElementById("mobile-bottom-bar");
    if (bottomBar) bottomBar.style.display = "none";
  }

  function closeLogin() {
    loginModal.classList.remove("active");
    loginModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "auto";
    const bottomBar = document.getElementById("mobile-bottom-bar");
    if (bottomBar) bottomBar.style.removeProperty("display");
  }

  openLoginButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      // If user is already authenticated, directly navigate to in-domain task portal
      if (auth.currentUser) {
        window.location.href = "task-portal.html";
      } else {
        openLogin();
      }
    });
  });

  if (loginModalClose) {
    loginModalClose.addEventListener("click", closeLogin);
  }

  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      closeLogin();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && loginModal.classList.contains("active")) {
      closeLogin();
    }
  });

  // Auto-open login modal if URL has ?login=1
  const pageParams = new URLSearchParams(window.location.search);
  if (pageParams.get("login") === "1") {
    openLogin();
  }

  // --- Forgot Password Handler ---
  if (btnForgotPassword) {
    btnForgotPassword.addEventListener("click", async () => {
      const email = (document.getElementById("candidate-email")?.value || "").trim().toLowerCase();
      if (!email) {
        showStatus(statusBox, "error", "Email Required", "Please enter your registered email address above to receive a password reset link.");
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email);
        showStatus(statusBox, "info", "Password Reset Sent", `A password reset link has been sent to <strong>${email}</strong>. Please check your inbox and spam folders.`);
        showToast("Password reset email sent! 📬");
      } catch (err) {
        let msg = err.message;
        if (err.code === "auth/user-not-found") msg = "No candidate account found with this email address.";
        if (err.code === "auth/invalid-email") msg = "Please enter a valid email address.";
        showStatus(statusBox, "error", "Reset Error", msg);
      }
    });
  }

  // --- Candidate Login Form Submit Handler ---
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = (document.getElementById("candidate-email")?.value || "").trim().toLowerCase();
      const password = document.getElementById("candidate-password")?.value || "";

      if (!email || !password) {
        showStatus(statusBox, "error", "Missing Fields", "Please enter both your registered email address and password.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtnText) submitBtnText.textContent = "Authenticating with Firebase...";
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast(`Welcome back! Loading your Task Portal... 🚀`);

        // Navigate directly to the in-domain task portal page
        setTimeout(() => {
          window.location.href = "task-portal.html";
        }, 400);
      } catch (err) {
        let title = "Sign In Failed";
        let message = err.message;

        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/user-not-found":
          case "auth/wrong-password":
            title = "Invalid Credentials";
            message = "Incorrect email or password. Please verify your credentials or use <strong>Forgot password?</strong>.";
            break;
          case "auth/invalid-email":
            title = "Invalid Email";
            message = "Please enter a valid email address.";
            break;
          case "auth/weak-password":
            title = "Weak Password";
            message = "Password should be at least 6 characters.";
            break;
          case "auth/network-request-failed":
            title = "Network Error";
            message = "Unable to connect to Firebase. Please check your internet connection.";
            break;
          case "auth/too-many-requests":
            title = "Access Throttled";
            message = "Too many failed attempts. Please wait a moment or reset your password.";
            break;
          default:
            message = err.message || "An unexpected authentication error occurred.";
        }

        showStatus(statusBox, "error", title, message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtnText) submitBtnText.textContent = "Sign In to Dashboard";
        }
      }
    });
  }

  // --- Auth State Observer on Homepage ---
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // If user is already authenticated and visits homepage, update login buttons label
      openLoginButtons.forEach(btn => {
        const textSpan = btn.querySelector("span:not(.icon):not(.btn-arrow)") || btn;
        if (textSpan && textSpan.textContent.includes("Login")) {
          textSpan.textContent = "Open Candidate Task Portal 🚀";
        }
      });
    }
  });
}

// ==========================================
// 12. CERTIFICATE VERIFICATION PORTAL (CRYPTOGRAPHIC SALTED HASH DECODER)
// ==========================================
function initCertificateVerificationModal() {
  const verifyModal = document.getElementById("verify-modal");
  const verifyModalClose = document.getElementById("verify-modal-close");
  const openVerifyButtons = document.querySelectorAll(".open-verify-modal-btn");
  
  // Tabs
  const vtabButtons = document.querySelectorAll(".verify-tab-btn");
  const vtabPanes = document.querySelectorAll(".verify-tab-pane");

  // Search Form
  const searchForm = document.getElementById("verify-search-form");
  const searchInput = document.getElementById("verify-query-input");
  // Loading & Result Elements
  const loadingSpinner = document.getElementById("verify-loading-spinner");
  const statusBox = document.getElementById("verify-status-box");
  const resultCard = document.getElementById("verify-result-card");
  const unverifiedCard = document.getElementById("verify-unverified-card");
  const unverifiedMsgBody = document.getElementById("unverified-msg-body");
  const formatBlockedCard = document.getElementById("verify-format-blocked-card");
  const blockedMsgBody = document.getElementById("blocked-msg-body");

  // Result Elements
  const resAvatar = document.getElementById("res-candidate-avatar");
  const resName = document.getElementById("res-candidate-name");
  const resEmail = document.getElementById("res-candidate-email");
  const resTrack = document.getElementById("res-track-name");
  const resCertId = document.getElementById("res-cert-id");
  const resGrade = document.getElementById("res-grade-score");
  const resStatus = document.getElementById("res-cohort-status");
  const resSaltVal = document.getElementById("res-salt-val");
  const resCryptoStatus = document.getElementById("res-crypto-status");
  const resTimestamp = document.getElementById("res-timestamp");
  const btnPrintCert = document.getElementById("btn-print-verified-cert");
  const btnCopyCertUrl = document.getElementById("btn-copy-verified-url");

  // QR Scanner Elements
  const btnStartCamera = document.getElementById("btn-start-camera");
  const qrFileInput = document.getElementById("qr-file-input");
  const qrVideo = document.getElementById("qr-video");
  const qrPlaceholder = document.getElementById("qr-scanner-placeholder");
  const qrFeedback = document.getElementById("qr-scan-feedback");
  let videoStream = null;
  let animationFrameId = null;
  let scanCanvas = null;
  let scanCtx = null;
  let lastVerifiedToken = "";

  if (!verifyModal) return;

  function openVerifyModal() {
    verifyModal.classList.add("active");
    verifyModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (statusBox) statusBox.style.display = "none";
    if (resultCard) resultCard.style.display = "none";
    if (unverifiedCard) unverifiedCard.style.display = "none";
    if (formatBlockedCard) formatBlockedCard.style.display = "none";
    if (searchInput) searchInput.focus();
  }

  function closeVerifyModal() {
    verifyModal.classList.remove("active");
    verifyModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "auto";
    stopCamera();
  }

  openVerifyButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openVerifyModal();
    });
  });

  if (verifyModalClose) {
    verifyModalClose.addEventListener("click", closeVerifyModal);
  }

  verifyModal.addEventListener("click", (e) => {
    if (e.target === verifyModal) {
      closeVerifyModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && verifyModal.classList.contains("active")) {
      closeVerifyModal();
    }
  });

  // Tab switching
  function switchVTab(targetTabId) {
    vtabButtons.forEach(btn => {
      if (btn.getAttribute("data-vtab") === targetTabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    vtabPanes.forEach(pane => {
      if (pane.id === targetTabId) {
        pane.classList.add("active");
      } else {
        pane.classList.remove("active");
      }
    });

    if (targetTabId !== "vtab-qr") {
      stopCamera();
    }
  }

  vtabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.getAttribute("data-vtab");
      if (targetTabId) switchVTab(targetTabId);
    });
  });

  // Escape HTML helper
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[s]));
  }

  // Parse payload (preserves full salted token from URLs or raw input)
  function extractSaltedPayload(rawPayload) {
    let clean = (rawPayload || "").trim();
    try {
      if (clean.startsWith("http://") || clean.startsWith("https://")) {
        const urlObj = new URL(clean);
        clean = urlObj.searchParams.get("v") || 
                urlObj.searchParams.get("token") || 
                urlObj.searchParams.get("id") || 
                urlObj.searchParams.get("verify") || 
                clean;
      }
    } catch (e) {}
    return clean;
  }

  // Cryptographic Salt & Anti-Tamper Verification Lookup
  async function performVerification(queryStr) {
    const rawInput = (queryStr || "").trim();
    if (!rawInput) {
      showToast("Please enter a cryptographic salted token or scan a QR code.");
      return;
    }

    if (loadingSpinner) loadingSpinner.style.display = "flex";
    if (statusBox) statusBox.style.display = "none";
    if (resultCard) resultCard.style.display = "none";
    if (unverifiedCard) unverifiedCard.style.display = "none";
    if (formatBlockedCard) formatBlockedCard.style.display = "none";

    // Simulate high-security cryptographic handshake & signature check
    await new Promise(r => setTimeout(r, 200));

    // Decode and verify the cryptographic salted hash
    const verifiedResult = verifyAndDecodeSaltedHash(rawInput);

    if (loadingSpinner) loadingSpinner.style.display = "none";

    // CASE 1: Normal / Un-salted Format Entered -> STRICTLY BLOCKED!
    if (!verifiedResult.valid && verifiedResult.isNormalFormat) {
      if (formatBlockedCard) {
        if (blockedMsgBody) {
          blockedMsgBody.innerHTML = `The query <strong>"${escapeHtml(rawInput)}"</strong> is in a normal plaintext format (raw serial number or unhashed email).<br><br>To prevent candidate credential forgery and protect data integrity, <strong>our verification gateway strictly requires an authentic Cryptographic Salted Hash QR Code</strong>.`;
        }
        formatBlockedCard.style.display = "block";
        formatBlockedCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      showToast("⛔ Normal un-salted format blocked. Salted QR token required.");
      return;
    }

    // CASE 2: Signature Mismatch / Tampered Data Detected
    if (!verifiedResult.valid && verifiedResult.error === "TAMPERED_PAYLOAD") {
      if (unverifiedCard) {
        if (unverifiedMsgBody) {
          unverifiedMsgBody.innerHTML = `⚠️ <strong>Cryptographic Tamper Alert:</strong> The HMAC-SHA256 signature for this QR code did not match the expected salted hash envelope. The candidate information inside this QR code has been altered, forged, or corrupted.`;
        }
        unverifiedCard.style.display = "block";
        unverifiedCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      showToast("⚠️ Security alert: Tampered QR code detected!");
      return;
    }

    // CASE 3: Invalid Structure or Other Error
    if (!verifiedResult.valid) {
      if (unverifiedCard) {
        if (unverifiedMsgBody) {
          unverifiedMsgBody.innerHTML = escapeHtml(verifiedResult.message || "Invalid cryptographic token format.");
        }
        unverifiedCard.style.display = "block";
        unverifiedCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      showToast("⚠️ Invalid QR verification token.");
      return;
    }

    // CASE 4: Valid Cryptographic Salted Hash Token -> Convert & Display Verified
    lastVerifiedToken = verifiedResult.token || rawInput;
    const candidateData = verifiedResult.data;
    const initials = (candidateData.name || candidateData.candidateName || "Candidate")
      .split(" ")
      .map(w => w.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase() || "CG";

    if (resAvatar) resAvatar.textContent = initials;
    if (resName) resName.textContent = candidateData.name || candidateData.candidateName || "Candidate";
    if (resEmail) resEmail.textContent = candidateData.email || "—";
    if (resTrack) resTrack.textContent = candidateData.track || "Full Stack Web Development";
    const certSerial = candidateData.serialNumber || candidateData.certId || "CG-MSME-2026";
    if (resCertId) resCertId.textContent = certSerial;
    if (resGrade) resGrade.textContent = candidateData.grade || "Grade A+ (Score: 99/100) • Outstanding";
    if (resStatus) resStatus.textContent = candidateData.status || candidateData.duration || "100% Completed • 8-12 Weeks (Remote)";
    if (resTimestamp) resTimestamp.textContent = candidateData.issueDate || `Active • Verified on ${new Date().toLocaleDateString("en-IN")}`;
    if (resSaltVal) resSaltVal.textContent = verifiedResult.salt ? `${verifiedResult.salt.substring(0, 16)}...` : "0x7f3a8b92...";
    if (resCryptoStatus) resCryptoStatus.innerHTML = `HMAC-SHA256 Valid ✓ <small style="color:#16a34a; font-weight:600;">(Tamper Check Passed)</small>`;

    if (resultCard) {
      resultCard.style.display = "block";
      resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    showToast(`✅ Authentic Certificate Verified for ${candidateData.name || candidateData.candidateName}! 🎓`);
  }

  // Search form submit
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const queryVal = searchInput ? searchInput.value : "";
      performVerification(queryVal);
    });
  }

  // Handle scanned QR payload & auto-fetch
  function handleDetectedQr(qrPayload) {
    stopCamera();

    if (qrFeedback) {
      qrFeedback.innerHTML = `✅ QR Code detected! Verifying cryptographic salt & signature...`;
    }

    performVerification(qrPayload);
  }

  // Continuous Camera Frame Scanner Loop (jsQR)
  function scanCameraFrame() {
    if (!videoStream || !qrVideo) return;

    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
      if (!scanCanvas) {
        scanCanvas = document.createElement("canvas");
        scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });
      }

      scanCanvas.width = qrVideo.videoWidth;
      scanCanvas.height = qrVideo.videoHeight;
      scanCtx.drawImage(qrVideo, 0, 0, scanCanvas.width, scanCanvas.height);
      const imageData = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);

      if (typeof jsQR !== "undefined") {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth"
        });

        if (code && code.data && code.data.trim()) {
          handleDetectedQr(code.data);
          return;
        }
      }
    }

    if (videoStream) {
      animationFrameId = requestAnimationFrame(scanCameraFrame);
    }
  }

  // Camera QR Scanner handlers
  async function startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (qrFeedback) qrFeedback.textContent = "Camera access is not supported on this browser. Please use the Upload QR Image option below.";
        return;
      }

      if (qrFeedback) qrFeedback.textContent = "Initializing camera scanner...";
      videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });

      if (qrVideo) {
        qrVideo.srcObject = videoStream;
        qrVideo.setAttribute("playsinline", "true");
        qrVideo.style.display = "block";
        await qrVideo.play();
      }

      if (qrPlaceholder) qrPlaceholder.style.display = "none";
      if (btnStartCamera) btnStartCamera.innerHTML = `<span>🛑 Stop Camera</span>`;
      if (qrFeedback) qrFeedback.textContent = "Point your camera at the certificate's Salted QR code...";

      // Start continuous frame analysis
      animationFrameId = requestAnimationFrame(scanCameraFrame);

    } catch (err) {
      console.warn("Camera start notice:", err);
      if (qrFeedback) qrFeedback.textContent = "Camera access denied or unavailable. Please upload a certificate QR image.";
      stopCamera();
    }
  }

  function stopCamera() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }
    if (qrVideo) {
      qrVideo.pause();
      qrVideo.srcObject = null;
      qrVideo.style.display = "none";
    }
    if (qrPlaceholder) qrPlaceholder.style.display = "block";
    if (btnStartCamera) btnStartCamera.innerHTML = `<span>📷 Start Camera Scanner</span>`;
  }

  if (btnStartCamera) {
    btnStartCamera.addEventListener("click", () => {
      if (videoStream) {
        stopCamera();
        if (qrFeedback) qrFeedback.textContent = "";
      } else {
        startCamera();
      }
    });
  }

  // File upload QR detector with jsQR
  if (qrFileInput) {
    qrFileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (qrFeedback) qrFeedback.textContent = `Analyzing "${file.name}" for authentic salted certificate QR signature...`;

      const reader = new FileReader();
      reader.onload = function() {
        const img = new Image();
        img.onload = function() {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, c.width, c.height);

          let decodedPayload = null;
          if (typeof jsQR !== "undefined") {
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "attemptBoth"
            });
            if (code && code.data && code.data.trim()) {
              decodedPayload = code.data;
            }
          }

          if (decodedPayload) {
            handleDetectedQr(decodedPayload);
          } else {
            // If jsQR did not detect a valid QR code in the image
            if (qrFeedback) qrFeedback.textContent = `⚠️ No QR code could be detected in "${file.name}". Please ensure the QR image is clear.`;
            switchVTab("vtab-search");
            if (searchInput) searchInput.value = file.name;
            performVerification(file.name);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Print & Copy Actions
  if (btnPrintCert) {
    btnPrintCert.addEventListener("click", () => {
      showToast("Generating verified certificate record document... 📄");
      setTimeout(() => {
        window.print();
      }, 500);
    });
  }

  if (btnCopyCertUrl) {
    btnCopyCertUrl.addEventListener("click", () => {
      const token = lastVerifiedToken || (searchInput ? searchInput.value.trim() : "");
      let url = "";
      if (token.startsWith("http")) {
        url = token;
      } else if (isSaltedHashToken(token)) {
        url = `https://certifications-coralgenz.vercel.app/?v=${encodeURIComponent(token)}`;
      } else {
        url = `https://certifications-coralgenz.vercel.app/?id=${encodeURIComponent(resCertId?.textContent || "CG-MSME-2026")}`;
      }

      navigator.clipboard.writeText(url).then(() => {
        showToast("Official Salted Credential Verification URL copied! 🔗");
      }).catch(() => {
        showToast(`Verification Link: ${url}`);
      });
    });
  }

  // Auto-verify if URL parameters are passed (e.g. ?v=... or ?token=... or ?id=...)
  const urlParams = new URLSearchParams(window.location.search);
  const targetParam = (urlParams.get("v") || urlParams.get("token") || urlParams.get("id") || urlParams.get("verify") || urlParams.get("email") || "").trim();
  if (targetParam) {
    openVerifyModal();
    if (searchInput) searchInput.value = targetParam;
    performVerification(targetParam);
  }
}

initCandidateLoginModal();
initCertificateVerificationModal();




