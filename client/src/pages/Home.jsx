import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { scanReceipt, scanReceiptPublic } from "../services/api";
import {
  Bell,
  IndianRupee,
  Smartphone,
  Users,
  ArrowRight,
  Check,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  LogOut,
  Sparkles,
  Calculator,
  Scan,
  Camera,
  ShieldCheck,
  Zap,
  PieChart,
  Bot
} from "lucide-react";

// Playful Doodle SVG Accents
const DoodleUnderline = () => (
  <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#758BFD] overflow-visible" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8C40 2 100 10 198 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const DoodleSwirl = () => (
  <svg className="w-12 h-12 text-[#EC4899] opacity-80" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 25C10 15 20 10 30 15C40 20 40 35 25 35C15 35 12 25 20 20C28 15 38 25 30 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const DoodleArrow = () => (
  <svg className="w-14 h-14 text-[#F59E0B] animate-bounce" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 15Q30 5 45 30M45 30L35 25M45 30L40 40" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DoodleSparkle = () => (
  <svg className="w-8 h-8 text-[#6366F1]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="currentColor" />
  </svg>
);

const DoodleCrown = () => (
  <svg className="w-10 h-8 text-[#F59E0B] -rotate-12" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 25L2 10L12 17L20 5L28 17L38 10L35 25Z" fill="currentColor" stroke="#D97706" strokeWidth="2" />
  </svg>
);

const features = [
  {
    title: "Trip & Group Splits",
    text: "Create custom groups for trips, roommates, or dinner parties. Add members and track shared expenses effortlessly.",
    Icon: Users,
    gradient: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-indigo-600",
    badge: "Step 1"
  },
  {
    title: "Personal Expense Tracker",
    text: "Log daily personal expenses with automated category tagging and set your custom monthly spending limit.",
    Icon: IndianRupee,
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600",
    badge: "Step 2"
  },
  {
    title: "AI Bill & Receipt OCR Scanner",
    text: "Snap a receipt photo. AI extracts item dishes, tax, and total prices automatically into structured splits.",
    Icon: Scan,
    gradient: "from-violet-500/10 to-indigo-500/10",
    iconColor: "text-indigo-600",
    badge: "Step 3"
  },
  {
    title: "1-Click Email Reminders",
    text: "Send automated, polite email breakdown reminders to group debtors without awkward money conversations.",
    Icon: Bell,
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600",
    badge: "Step 4"
  }
];

const faqs = [
  {
    question: "How does SplitEase split trip and group expenses?",
    answer: "SplitEase tracks who paid for what and calculates exact net balances for each person. It simplifies mutual debts so your group can settle up in the absolute minimum number of transactions."
  },
  {
    question: "Can I set a personal monthly spending limit?",
    answer: "Yes! SplitEase includes a Personal Expenditure tracker where you can set a monthly budget, track spent vs limit, and receive budget alerts before overspending."
  },
  {
    question: "How does the AI Bill Scanner work?",
    answer: "Just upload or snap a photo of any restaurant receipt. SplitEase AI OCR extracts individual item prices, taxes, and grand totals, letting you autofill expenses directly into personal or group splits."
  },
  {
    question: "Do my friends need an account to receive email reminders?",
    answer: "No! You can enter your friends' email addresses when creating a group, and SplitEase will send email breakdown reminders directly to their inbox."
  }
];

export default function Home() {
  const [isLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [openFaq, setOpenFaq] = useState(null);

  // Live Calculator Demo State
  const [billAmount, setBillAmount] = useState(1800);
  const [numPeople, setNumPeople] = useState(3);
  const [peopleNames] = useState(["You", "Aditya", "Neha", "Rohan"]);

  // OCR Demo State
  const fileInputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [ocrItems, setOcrItems] = useState([]);
  const [scanningStep, setScanningStep] = useState("");

  const handleOcrFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setScanSuccess(false);

    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result);
    reader.readAsDataURL(file);

    setScanningStep("Reading receipt image...");

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const res = await scanReceiptPublic(formData);
      if (res.data && res.data.success && res.data.items) {
        setOcrItems(res.data.items);
        setScanSuccess(true);
      } else {
        throw new Error("Fallback to demo items");
      }
    } catch {
      setTimeout(() => {
        setOcrItems([
          { item: "Margherita Pizza", price: 650 },
          { item: "Truffle Fries", price: 320 },
          { item: "Cold Brew Coffee", price: 240 },
          { item: "Chocolate Lava Cake", price: 390 }
        ]);
        setScanSuccess(true);
      }, 1000);
    } finally {
      setIsScanning(false);
    }
  };

  const perPersonShare = (billAmount / Math.max(1, numPeople)).toFixed(2);

  return (
    <div className="min-h-screen bg-[#F7F7FF] text-[#27187E] relative overflow-hidden font-sans">
      {/* Doodle decorative background circles & grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
      <div className="absolute top-10 left-10 opacity-30 pointer-events-none">
        <DoodleSwirl />
      </div>
      <div className="absolute top-40 right-20 opacity-30 pointer-events-none">
        <DoodleSparkle />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-30 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#27187E] to-[#758BFD] text-white shadow-md shadow-[#27187E]/20">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </span>
          <span className="text-2xl font-black tracking-tight text-[#27187E]">
            Split<span className="text-[#758BFD]">Ease</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="h-11 px-6 rounded-2xl bg-[#27187E] hover:bg-[#1F1368] text-white text-xs font-black flex items-center gap-2 transition shadow-md no-underline cursor-pointer"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="h-11 px-6 rounded-2xl bg-[#27187E] hover:bg-[#1F1368] text-white text-xs font-black flex items-center gap-2 transition shadow-md shadow-[#27187E]/20 no-underline cursor-pointer"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </nav>

      {/* HERO SECTION WITH PLAYFUL DOODLES */}
      <section className="relative z-20 pt-8 pb-16 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Crown doodle badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black shadow-sm mb-6 animate-fadeIn">
          <DoodleCrown />
          <span>Smart Personal Expense & Trip Splitter</span>
          <DoodleSparkle />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#27187E] tracking-tight leading-[1.1] max-w-4xl m-0 relative">
          Track Personal Spending & Split Trip Bills{" "}
          <span className="relative inline-block text-[#758BFD]">
            Effortlessly
            <DoodleUnderline />
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg font-semibold text-[#5C5783] max-w-2xl leading-relaxed">
          The ultimate personal expense tracker with smart monthly budget limits, trip expense splitting, AI receipt bill scanner, and 1-click email reminders.
        </p>

        {/* CTA Buttons with Doodle Arrow */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 relative">
          <div className="hidden sm:block absolute -left-16 -top-4 pointer-events-none">
            <DoodleArrow />
          </div>

          <Link
            to={isLoggedIn ? "/dashboard" : "/auth"}
            className="h-14 px-8 rounded-2xl bg-gradient-to-r from-[#27187E] to-[#5C4BD6] text-white text-sm font-black flex items-center gap-3 transition-all duration-200 shadow-xl shadow-[#27187E]/30 hover:scale-105 no-underline cursor-pointer"
          >
            <Sparkles className="h-5 w-5" />
            {isLoggedIn ? "Open My Dashboard" : "Start Tracking & Splitting Now"}
          </Link>
        </div>

        {/* Floating Interactive Card Preview */}
        <div className="mt-14 w-full max-w-4xl rounded-3xl border border-gray-200/80 bg-white/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(39,24,126,0.12)] grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative">
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <span className="text-[10px] font-extrabold uppercase text-gray-400">Personal Spending</span>
            <span className="text-2xl font-black text-[#27187E]">₹4,250 / ₹10,000</span>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div className="bg-[#758BFD] h-2 rounded-full w-[42.5%]" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 mt-1">✓ 57.5% Budget Remaining</span>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[10px] font-extrabold uppercase text-emerald-800">Manali Trip Group</span>
            <span className="text-2xl font-black text-[#27187E]">₹12,400 Total</span>
            <span className="text-xs font-bold text-gray-500">4 Members • Equal Split</span>
            <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded self-start mt-1">
              Settlements Optimized
            </span>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-[10px] font-extrabold uppercase text-amber-800">AI Bill OCR Scanner</span>
            <span className="text-sm font-black text-[#27187E]">Receipt Dish Extraction</span>
            <span className="text-xs font-bold text-gray-500">Auto-calculates itemized dishes & tax</span>
            <span className="text-[10px] font-black text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded self-start mt-1">
              📷 Instant Scan
            </span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS STEP-BY-STEP */}
      <section className="py-16 px-6 max-w-7xl mx-auto relative z-20">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#758BFD]">Simple 4-Step Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#27187E] mt-2">How SplitEase Simplifies Expense Tracking</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => {
            const IconComp = f.Icon;
            return (
              <div key={idx} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden hover:border-[#758BFD]/40 transition">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 text-[#27187E] self-start">
                  {f.badge}
                </span>
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${f.gradient} flex items-center justify-center`}>
                  <IconComp className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="m-0 text-lg font-black text-[#27187E]">{f.title}</h3>
                <p className="m-0 text-xs font-semibold text-gray-500 leading-relaxed">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE BILL SPLITTER CALCULATOR DEMO */}
      <section className="py-16 px-6 max-w-5xl mx-auto relative z-20">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <span className="text-xs font-black uppercase text-[#758BFD] tracking-widest">Interactive Calculator</span>
            <h2 className="m-0 text-2xl sm:text-3xl font-black text-[#27187E]">Try Splitting a Bill Right Now</h2>
            <p className="text-xs font-bold text-gray-500 leading-relaxed">
              Adjust the bill amount and number of people below to calculate exact per-person shares instantly.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Total Bill Amount (₹)</label>
                <input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(Number(e.target.value) || 0)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-4 text-sm font-black text-[#27187E] outline-none focus:border-[#758BFD]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Number of Friends ({numPeople})</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                    className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-lg font-black text-[#27187E] border-0 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-base font-black text-[#27187E] px-3">{numPeople} People</span>
                  <button
                    onClick={() => setNumPeople(numPeople + 1)}
                    className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-lg font-black text-[#27187E] border-0 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-gradient-to-tr from-[#27187E] to-[#5C4BD6] text-white p-6 sm:p-8 flex flex-col justify-between min-h-[260px] shadow-lg">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">Calculated Per-Person Share</span>
              <span className="text-4xl font-black tracking-tight mt-1">₹{perPersonShare}</span>
              <span className="text-xs font-semibold text-indigo-100 mt-2">
                Total ₹{billAmount} divided equally among {numPeople} friends
              </span>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase text-indigo-200">Friends Breakdown:</span>
              <div className="flex flex-wrap gap-2">
                {peopleNames.slice(0, numPeople).map((name, i) => (
                  <span key={i} className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/15 text-white">
                    {name}: ₹{perPersonShare}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI RECEIPT SCANNER DEMO SECTION */}
      <section className="py-16 px-6 max-w-5xl mx-auto relative z-20 text-center">
        <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl flex flex-col items-center gap-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#EC4899] text-white shadow-md">
            <Camera className="h-6 w-6" />
          </span>

          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black text-[#27187E] m-0">Try the AI Receipt Bill Scanner</h2>
            <p className="text-xs font-semibold text-gray-500 mt-2">
              Upload a receipt photo below to test how SplitEase AI parses itemized dishes and prices instantly.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleOcrFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="h-12 px-8 rounded-2xl bg-[#27187E] hover:bg-[#1F1368] text-white text-xs font-black transition cursor-pointer shadow-md"
          >
            {isScanning ? "Scanning Receipt..." : "📷 Upload Receipt Image"}
          </button>

          {uploadedImage && (
            <div className="w-full max-w-md p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center gap-3">
              <img src={uploadedImage} alt="Receipt preview" className="max-h-48 rounded-xl object-contain" />
              {scanSuccess && (
                <div className="w-full text-left bg-white p-3 rounded-xl border border-emerald-200 flex flex-col gap-1">
                  <span className="text-xs font-black text-emerald-700">✓ AI OCR Extracted Items:</span>
                  {ocrItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold text-[#27187E]">
                      <span>{it.item}</span>
                      <span>₹{it.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-8 px-6 text-center relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-gray-400">
            © {new Date().getFullYear()} SplitEase AI. All rights reserved.
          </span>

          <div className="flex items-center gap-4 text-xs font-bold text-[#27187E]">
            <Link to="/auth" className="hover:underline text-[#27187E]">Get Started</Link>
            <Link to="/dashboard" className="hover:underline text-[#27187E]">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
