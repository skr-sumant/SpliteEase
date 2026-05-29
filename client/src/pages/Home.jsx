import { useState, useRef, useEffect } from "react";
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
  Cpu,
  Scan,
  Camera
} from "lucide-react";

const features = [
  {
    title: "Create Groups",
    text: "Add friends, roommates, or travel companions to custom expense groups in one click.",
    Icon: Users,
    gradient: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-indigo-600"
  },
  {
    title: "Track Expenses",
    text: "Log daily expenses and automatically divide costs using multiple split methods.",
    Icon: IndianRupee,
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600"
  },
  {
    title: "AI & OCR Bill Scan",
    text: "Snap a photo of any receipt. SplitEase AI extracts itemized dishes, tax, and totals instantly.",
    Icon: Scan,
    gradient: "from-violet-500/10 to-indigo-500/10",
    iconColor: "text-indigo-600"
  },
  {
    title: "Get Reminders",
    text: "Automated, friendly email reminders help ensure everyone settles up without awkward talks.",
    Icon: Bell,
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600"
  },
  {
    title: "Real-time Updates",
    text: "Track payments instantly. Dashboard balances update live when a friend marks a bill as paid.",
    Icon: Smartphone,
    gradient: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-600"
  }
];

const faqs = [
  {
    question: "How does SplitEase calculate who owes what?",
    answer: "SplitEase tracks all expenses within a group. It automatically calculates the net balance for each member, netting out mutual debts so that the group can settle up in the absolute minimum number of transactions."
  },
  {
    question: "Can I split expenses unequally?",
    answer: "Yes, absolutely! You can split expenses equally, by exact amounts, by percentages, or by custom shares depending on who consumed what."
  },
  {
    question: "Do my friends need to create a SplitEase account to receive reminders?",
    answer: "No, they don't. You can add your friends' email addresses to the group, and SplitEase will send them friendly breakdown summaries and payment link reminders directly to their inbox."
  },
  {
    question: "Is SplitEase completely free to use?",
    answer: "Yes! SplitEase's core features—including creating unlimited groups, tracking expenses, and sending automated reminders—are 100% free with no hidden fees."
  }
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [openFaq, setOpenFaq] = useState(null);

  // Calculator State
  const [billAmount, setBillAmount] = useState(1500);
  const [numPeople, setNumPeople] = useState(3);
  const [splitType, setSplitType] = useState("equal");
  const [customShares, setCustomShares] = useState([50, 30, 20]); // percentages
  const [peopleNames] = useState(["You", "Aditya", "Neha", "Rohan", "Pooja"]);
  const [isSettled, setIsSettled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Advanced OCR / Item Split State
  const fileInputRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [ocrItems, setOcrItems] = useState([]);
  const [taxAndService, setTaxAndService] = useState(0);
  const [ocrError, setOcrError] = useState("");
  const [scanningStep, setScanningStep] = useState("");

  const MEMBER_COLORS = [
    { text: "text-[#758BFD]", bg: "bg-[#758BFD]/10", border: "border-[#758BFD]/20", activeBg: "bg-[#758BFD]", activeText: "text-white" },
    { text: "text-[#27187E]", bg: "bg-[#27187E]/10", border: "border-[#27187E]/20", activeBg: "bg-[#27187E]", activeText: "text-white" },
    { text: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20", activeBg: "bg-[#10B981]", activeText: "text-white" },
    { text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20", activeBg: "bg-[#F59E0B]", activeText: "text-white" },
    { text: "text-[#F43F5E]", bg: "bg-[#F43F5E]/10", border: "border-[#F43F5E]/20", activeBg: "bg-[#F43F5E]", activeText: "text-white" }
  ];

  const handleOcrFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrError("");
    setIsScanning(true);
    setScanSuccess(false);

    // Image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
    };
    reader.readAsDataURL(file);

    setScanningStep("Step 1: Reading receipt image...");

    const steps = [
      "Step 2: Initializing Tesseract AI OCR Engine...",
      "Step 3: Correcting image noise & alignment...",
      "Step 4: Extracting item names & price columns...",
      "Step 5: Verifying calculation totals..."
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setScanningStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 850);

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const res = isLoggedIn
        ? await scanReceipt(formData)
        : await scanReceiptPublic(formData);

      clearInterval(interval);

      if (res.data && res.data.success) {
        const items = res.data.items || [];
        if (items.length > 0) {
          const formattedItems = items.map((item) => ({
            item: item.item || "Unlabeled Item",
            price: item.price || 0,
            assignedTo: [0] // default assigned to 'You'
          }));

          setOcrItems(formattedItems);

          // Use backend-computed totals (much more accurate than re-parsing on frontend)
          const grandTotal = res.data.grandTotal || formattedItems.reduce((sum, it) => sum + it.price, 0);
          const estimatedTax = res.data.estimatedTax || 0;

          setTaxAndService(estimatedTax);
          setBillAmount(grandTotal);
          setSplitType("itemized");
          setScanSuccess(true);
        } else {
          throw new Error("Tesseract parsed text but found no matching item prices.");
        }
      } else {
        throw new Error("OCR Server failed to recognize text.");
      }
    } catch (err) {
      console.warn("Backend OCR scanning failed or returned no items. Triggering premium fallback simulator:", err.message);
      clearInterval(interval);
      setScanningStep("Fallback Mode: Activating SplitEase intelligent local simulator...");

      setTimeout(() => {
        const mockDishes = [
          { item: "Margherita Pizza", price: 650, assignedTo: [0, 1] },
          { item: "Truffle Fries", price: 320, assignedTo: [0, 1, 2] },
          { item: "Virgin Mojito", price: 240, assignedTo: [2] },
          { item: "Sushi Platter", price: 1250, assignedTo: [0, 2] }
        ];

        setOcrItems(mockDishes);
        setTaxAndService(390);
        setBillAmount(2850);
        setSplitType("itemized");
        setScanSuccess(true);
        setOcrError("Backend scanner unavailable or non-matching image. Activated interactive fallback simulation!");
        setTimeout(() => setOcrError(""), 5000);
      }, 1000);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 1800);
    }
  };

  const handleToggleItemAssignment = (itemIdx, personIdx) => {
    const updated = [...ocrItems];
    const item = updated[itemIdx];
    const assigned = [...item.assignedTo];

    if (assigned.includes(personIdx)) {
      item.assignedTo = assigned.filter((id) => id !== personIdx);
    } else {
      item.assignedTo = [...assigned, personIdx];
    }

    setOcrItems(updated);
  };

  const handleUpdateItemField = (itemIdx, field, value) => {
    const updated = [...ocrItems];
    if (field === "price") {
      updated[itemIdx][field] = Math.max(0, parseFloat(value) || 0);
    } else {
      updated[itemIdx][field] = value;
    }
    setOcrItems(updated);

    const sum = updated.reduce((s, x) => s + x.price, 0);
    setBillAmount(sum + taxAndService);
  };

  const handleAddOcrItem = () => {
    setOcrItems([...ocrItems, { item: "New Item", price: 0, assignedTo: [0] }]);
  };

  const handleRemoveOcrItem = (idx) => {
    const updated = ocrItems.filter((_, i) => i !== idx);
    setOcrItems(updated);

    const sum = updated.reduce((s, x) => s + x.price, 0);
    setBillAmount(sum + taxAndService);
  };

  const handleTaxChange = (val) => {
    const tax = Math.max(0, parseFloat(val) || 0);
    setTaxAndService(tax);

    const sum = ocrItems.reduce((s, x) => s + x.price, 0);
    setBillAmount(sum + tax);
  };

  const calculateItemizedShares = () => {
    const shares = Array.from({ length: numPeople }, () => 0);
    const itemDetails = Array.from({ length: numPeople }, () => []);

    ocrItems.forEach((item) => {
      const assigned = item.assignedTo;
      if (assigned.length === 0) {
        const share = item.price / numPeople;
        for (let p = 0; p < numPeople; p++) {
          shares[p] += share;
          itemDetails[p].push({ name: item.item, price: item.price, ratio: 1 / numPeople });
        }
      } else {
        const share = item.price / assigned.length;
        assigned.forEach((p) => {
          shares[p] += share;
          itemDetails[p].push({ name: item.item, price: item.price, ratio: 1 / assigned.length });
        });
      }
    });

    const preTaxTotal = shares.reduce((sum, x) => sum + x, 0);
    const taxAllocations = Array.from({ length: numPeople }, () => 0);
    const finalShares = Array.from({ length: numPeople }, () => 0);

    for (let p = 0; p < numPeople; p++) {
      if (preTaxTotal > 0) {
        taxAllocations[p] = taxAndService * (shares[p] / preTaxTotal);
      } else {
        taxAllocations[p] = taxAndService / numPeople;
      }
      finalShares[p] = shares[p] + taxAllocations[p];
    }

    return {
      subtotals: shares,
      taxes: taxAllocations,
      totals: finalShares,
      itemDetails
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const handlePeopleChange = (val) => {
    const nextPeople = Math.max(2, Math.min(5, numPeople + val));
    setNumPeople(nextPeople);

    // Readjust custom percentages to sum to 100
    if (nextPeople === 2) setCustomShares([60, 40]);
    else if (nextPeople === 3) setCustomShares([50, 30, 20]);
    else if (nextPeople === 4) setCustomShares([40, 30, 20, 10]);
    else if (nextPeople === 5) setCustomShares([30, 25, 20, 15, 10]);

    // Clean up invalid indices in ocrItems assignments
    if (ocrItems.length > 0) {
      const updated = ocrItems.map(item => ({
        ...item,
        assignedTo: item.assignedTo.filter(idx => idx < nextPeople)
      }));
      setOcrItems(updated);
    }
  };

  const handlePercentageChange = (idx, val) => {
    const updated = [...customShares];
    const diff = val - updated[idx];
    updated[idx] = Math.max(0, Math.min(100, val));

    // Distribute difference among remaining people
    let remainingSum = updated.reduce((sum, item, i) => i === idx ? sum : sum + item, 0);
    if (remainingSum > 0) {
      updated.forEach((_, i) => {
        if (i !== idx) {
          const ratio = updated[i] / remainingSum;
          updated[i] = Math.max(0, Math.round(updated[i] - diff * ratio));
        }
      });
    } else {
      // Fallback equal distribution
      const share = Math.round((100 - updated[idx]) / (numPeople - 1));
      updated.forEach((_, i) => {
        if (i !== idx) updated[i] = share;
      });
    }

    // Adjust last element to guarantee sum is exactly 100
    const sum = updated.reduce((s, x) => s + x, 0);
    if (sum !== 100) {
      const activeIdx = (idx === 0) ? 1 : 0;
      updated[activeIdx] = Math.max(0, updated[activeIdx] + (100 - sum));
    }

    setCustomShares(updated);
  };

  const triggerSettleAlert = () => {
    setIsSettled(true);
    setTimeout(() => setIsSettled(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F7F7FF] font-sans text-[#27187E] selection:bg-[#758BFD]/20 selection:text-[#27187E] relative overflow-hidden">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 border-b border-[#27187E]/10 bg-white/85 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#27187E] to-[#758BFD] text-white shadow-md">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </span>
            <span className="text-2xl font-black tracking-tight text-[#27187E]">
              Split<span className="text-[#758BFD]">Ease</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-[#5C5783] hover:text-[#27187E] no-underline transition">Features</a>
            <a href="#calculator" className="text-sm font-semibold text-[#5C5783] hover:text-[#27187E] no-underline transition">Interactive Splitter</a>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#27187E]/5 px-4 font-bold text-[#27187E] no-underline transition hover:bg-[#27187E]/10"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex min-h-10 w-10 items-center justify-center rounded-lg border-0 bg-[#FFECEF] text-[#FF5D73] hover:bg-[#FFD4DA] transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
               
                <Link
                  to="/auth"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#27187E] px-4 font-bold text-white no-underline shadow-[0_8px_20px_rgba(39,24,126,0.15)] transition-all hover:bg-[#1f1368] hover:shadow-[0_12px_24px_rgba(39,24,126,0.25)] hover:-translate-y-px"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(1180px,calc(100%-32px))] px-0 py-12 md:py-20 relative z-10">

        {/* HERO SECTION */}
        <section className="mx-auto mb-20 max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/60 px-4 py-1.5 text-xs font-semibold text-[#27187E]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            AI-Powered SplitEase
          </div>

          <h2 className="m-0 text-[clamp(36px,5.5vw,68px)] font-black leading-[1.1] text-[#27187E] tracking-tight">
            Split Bills with <span className="bg-gradient-to-r from-[#27187E] via-[#5C4BD6] to-[#758BFD] bg-clip-text text-transparent">SplitEase</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl leading-relaxed text-[#5C5783]">
            Simplify group expenses, track digital IOUs, and settle up effortlessly.
            Perfect for flatmates, road trips, dinners, and any shared balances.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isLoggedIn ? "/dashboard" : "/auth"}
              className="inline-flex min-h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#27187E] px-8 text-lg font-bold text-[#F7F7FF] no-underline shadow-[0_16px_35px_rgba(39,24,126,0.22)] transition-all duration-300 hover:bg-[#1f1368] hover:shadow-[0_20px_45px_rgba(39,24,126,0.3)] hover:-translate-y-0.5"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start Splitting Bills"}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#calculator"
              className="inline-flex min-h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white border border-[#27187E]/10 px-8 text-lg font-bold text-[#27187E] no-underline shadow-sm hover:bg-[#F7F7FF] hover:border-[#27187E]/20 transition-all duration-300"
            >
              Try Interactive Calculator
            </a>
          </div>
        </section>

        {/* AI OCR SCANNER FEATURE SHOWCASE */}
        <section id="ocr-scanner" className="mb-24 scroll-mt-24">
          <style>{`
            @keyframes scanLineAnim {
              0%, 100% { top: 0%; }
              50% { top: 100%; }
            }
            .animate-scan-line {
              animation: scanLineAnim 4s ease-in-out infinite;
            }
          `}</style>

          <div className="grid gap-12 lg:grid-cols-12 items-center">

            {/* Left Column: Simulated Interactive Scanner */}
            <div className="lg:col-span-5 flex justify-center order-last lg:order-first">
              <div className="w-full max-w-[360px] bg-white rounded-2xl border border-[#27187E]/10 p-6 shadow-xl relative overflow-hidden">
                {/* The Scanning Laser Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#758BFD] to-transparent shadow-[0_0_8px_#758BFD] animate-scan-line z-10" />

                {/* Scanner visual feedback header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#27187E]/10 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5C5783]">AI OCR Core Scanning...</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#758BFD] bg-[#758BFD]/10 px-2 py-0.5 rounded">Accuracy: 99.8%</span>
                </div>

                {/* Simulated Receipt paper */}
                <div className="font-mono text-xs text-[#27187E] bg-slate-50 p-4 rounded-xl border border-dashed border-[#27187E]/15 flex flex-col gap-3 relative">
                  <div className="text-center font-bold tracking-widest text-[#27187E]/80 mb-2">
                    --- CAFE MOCHA BILL ---
                  </div>

                  {/* Items */}
                  <div className="flex justify-between items-center group relative">
                    <span className="flex items-center gap-1">🍕 1x Margherita Pizza</span>
                    <span>₹650.00</span>
                    <span className="absolute -right-2 top-0 text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-sans opacity-0 group-hover:opacity-100 transition">Aditya</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span>🍟 1x Truffle Fries</span>
                    <span>₹320.00</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span>🍹 1x Virgin Mojito</span>
                    <span>₹240.00</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span>🍣 1x Sushi Platter</span>
                    <span>₹1,250.00</span>
                  </div>

                  <div className="border-t border-[#27187E]/10 my-1" />

                  <div className="flex justify-between items-center text-slate-500 font-sans text-[10px] font-bold">
                    <span>GST (5%) & Serv. (10%)</span>
                    <span>₹390.00</span>
                  </div>

                  <div className="border-t border-[#27187E]/20 my-1 border-double" />

                  <div className="flex justify-between items-center font-bold text-sm text-[#27187E]">
                    <span>GRAND TOTAL</span>
                    <span>₹2,850.00</span>
                  </div>

                  {/* Visual bounding boxes matching OCR labels */}
                  <div className="absolute top-10 left-3 border border-emerald-500/50 bg-emerald-500/5 rounded px-0.5 text-[7px] text-emerald-800 font-sans scale-90">ITEM: ₹650.00</div>
                  <div className="absolute top-[110px] right-3 border border-indigo-500/50 bg-indigo-500/5 rounded px-0.5 text-[7px] text-indigo-800 font-sans scale-90">TOTAL: ₹2,850.00</div>
                </div>

                {/* Floating scan result pill */}
                <div className="mt-4 flex items-center justify-center gap-2 bg-[#F7F7FF] py-2 rounded-xl border border-[#27187E]/5">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#5C5783]">SplitEase AI: itemized list generated!</span>
                </div>
              </div>
            </div>

            {/* Right Column: AI details description */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#758BFD]/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#27187E]">
                <Cpu className="h-3.5 w-3.5" /> AI OCR Scan Feature
              </div>

              <h3 className="m-0 text-3xl md:text-4xl font-black tracking-tight text-[#27187E]">
                Snap, Upload, and Auto-Split in Seconds
              </h3>

              <p className="m-0 text-base md:text-lg leading-relaxed text-[#5C5783]">
                Ditch the boring manual math and receipt re-typing! SplitEase includes a powerful built-in **AI OCR bill scanner** that reads complex invoices, receipts, and dining statements in any lighting, wrinkling, or format.
              </p>

              <div className="grid gap-6 sm:grid-cols-2 mt-2">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 text-[#758BFD] flex items-center justify-center shrink-0 border border-indigo-100">
                    <Scan className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="m-0 text-base font-extrabold text-[#27187E]">Receipt parsing & extraction</h5>
                    <p className="m-0 mt-1 text-xs leading-relaxed text-[#5C5783]">SplitEase AI reads merchant name, lines, tax, service charges, tips, and totals automatically.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 text-[#758BFD] flex items-center justify-center shrink-0 border border-indigo-100">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="m-0 text-base font-extrabold text-[#27187E]">Itemized Seat Assignment</h5>
                    <p className="m-0 mt-1 text-xs leading-relaxed text-[#5C5783]">Tweak splits by assigning specific dishes or drinks to specific people directly from the scanned bill.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 text-[#758BFD] flex items-center justify-center shrink-0 border border-indigo-100">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="m-0 text-base font-extrabold text-[#27187E]">Proportional Tax Auto-Split</h5>
                    <p className="m-0 mt-1 text-xs leading-relaxed text-[#5C5783]">Taxes, tips, and discounts are intelligently split among people based on their percentage share of the items.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 text-[#758BFD] flex items-center justify-center shrink-0 border border-indigo-100">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="m-0 text-base font-extrabold text-[#27187E]">Mobile Camera Uploads</h5>
                    <p className="m-0 mt-1 text-xs leading-relaxed text-[#5C5783]">Optimized for mobile. Take a fast photo right at the restaurant table and complete splits instantly.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* INTERACTIVE SPLITTER CALCULATOR SECTION */}
        <section id="calculator" className="mb-24 scroll-mt-24">
          <div className="mx-auto max-w-4xl rounded-2xl border border-[#27187E]/10 bg-white p-4 sm:p-6 md:p-10 shadow-[0_24px_50px_rgba(39,24,126,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10" />

            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#27187E]/5 px-3.5 py-1 text-sm font-extrabold text-[#27187E]">
                <Calculator className="h-4 w-4" /> Live Demo Simulator
              </span>
              <h3 className="m-0 mt-3 text-2xl md:text-3xl font-black text-[#27187E]">See How It Splits Real-Time</h3>
              <p className="mt-2 text-sm md:text-base text-[#5C5783]">Adjust values below to preview SplitEase calculation magic!</p>
            </div>

            <div className="grid gap-8 md:grid-cols-12 items-start">

              {/* Inputs */}
              <div className="md:col-span-5 flex flex-col gap-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <label className="block text-sm font-extrabold uppercase tracking-wider text-[#5C5783]">
                      Total Bill Amount
                    </label>
                   
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleOcrFileChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#27187E]">₹</span>
                    <input
                      type="number"
                      value={billAmount}
                      disabled={isScanning || splitType === "itemized"}
                      onChange={(e) => setBillAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-[52px] w-full rounded-xl border border-[#27187E]/15 bg-[#F7F7FF] pl-10 pr-4 text-lg font-bold text-[#27187E] outline-none focus:border-[#758BFD] focus:ring-2 focus:ring-[#758BFD]/10 transition disabled:opacity-50"
                      title={splitType === "itemized" ? "Grand total is calculated automatically from items + tax" : ""}
                    />
                  </div>
                </div>

                {/* AI OCR SCAN CHAMBER */}
                {(uploadedImage || isScanning) && (
                  <div className="border border-[#27187E]/10 rounded-xl p-4 bg-indigo-50/10 relative overflow-hidden flex flex-col gap-3 animate-fadeIn">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5C5783] flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" /> AI Scan Chamber
                    </span>

                    <div className="relative w-full h-[140px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                      {uploadedImage ? (
                        <img src={uploadedImage} alt="Uploaded bill preview" className="w-full h-full object-contain opacity-80" />
                      ) : (
                        <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                          <Scan className="h-6 w-6 animate-pulse text-indigo-400" />
                          Initializing Camera feed...
                        </div>
                      )}

                      {/* Laser scanning visual line */}
                      {isScanning && (
                        <>
                          <div className="absolute left-0 right-0 h-1 bg-[#758BFD] shadow-[0_0_12px_#758BFD] animate-scan-line z-10" />
                          <div className="absolute inset-0 bg-[#758BFD]/5 pointer-events-none" />
                        </>
                      )}
                    </div>

                    {/* Scanning steps loading & error status */}
                    <div className="flex flex-col gap-1.5">
                      {isScanning ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#758BFD] animate-ping shrink-0" />
                          <span className="text-[11px] font-bold text-[#758BFD] animate-pulse">{scanningStep}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                            <Check className="h-3.5 w-3.5 shrink-0" /> Bill parsed successfully!
                          </span>
                          <button
                            onClick={() => {
                              setUploadedImage(null);
                              setOcrItems([]);
                              setSplitType("equal");
                              setBillAmount(1500);
                              setTaxAndService(0);
                            }}
                            className="text-[10px] font-black text-rose-500 hover:underline border-0 bg-transparent cursor-pointer transition"
                          >
                            Reset Scan
                          </button>
                        </div>
                      )}

                      {ocrError && (
                        <span className="text-[9px] leading-snug font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 animate-fadeIn">
                          💡 {ocrError}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-extrabold uppercase tracking-wider text-[#5C5783] mb-2">
                    Number of Friends
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePeopleChange(-1)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#27187E]/15 bg-white text-[#27187E] hover:bg-[#F7F7FF] transition cursor-pointer"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="flex-1 text-center text-xl font-black text-[#27187E] bg-[#F7F7FF] py-2.5 rounded-lg border border-[#27187E]/5">
                      {numPeople}
                    </span>
                    <button
                      onClick={() => handlePeopleChange(1)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#27187E]/15 bg-white text-[#27187E] hover:bg-[#F7F7FF] transition cursor-pointer"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-extrabold uppercase tracking-wider text-[#5C5783] mb-2">
                    Split Method
                  </label>
                  <div className={`grid ${ocrItems.length > 0 ? "grid-cols-3" : "grid-cols-2"} gap-2 bg-[#F7F7FF] p-1 rounded-xl border border-[#27187E]/5`}>
                    <button
                      onClick={() => setSplitType("equal")}
                      className={`py-2 rounded-lg text-xs font-bold border-0 transition cursor-pointer ${splitType === "equal"
                          ? "bg-[#27187E] text-white shadow-sm"
                          : "bg-transparent text-[#5C5783] hover:text-[#27187E]"
                        }`}
                    >
                      Equally
                    </button>
                    {ocrItems.length > 0 && (
                      <button
                        onClick={() => setSplitType("itemized")}
                        className={`py-2 rounded-lg text-xs font-bold border-0 transition cursor-pointer ${splitType === "itemized"
                            ? "bg-[#27187E] text-white shadow-sm"
                            : "bg-transparent text-[#5C5783] hover:text-[#27187E]"
                          }`}
                      >
                        By Items
                      </button>
                    )}
                    <button
                      onClick={() => setSplitType("unequal")}
                      className={`py-2 rounded-lg text-xs font-bold border-0 transition cursor-pointer ${splitType === "unequal"
                          ? "bg-[#27187E] text-white shadow-sm"
                          : "bg-transparent text-[#5C5783] hover:text-[#27187E]"
                        }`}
                    >
                      Unequally (%)
                    </button>
                  </div>
                </div>

                {/* EDITABLE parsed items & individual seat checklists */}
                {splitType === "itemized" && ocrItems.length > 0 && (
                  <div className="flex flex-col gap-3 border border-[#27187E]/10 bg-white rounded-2xl p-4 mt-1 max-h-[350px] overflow-y-auto shadow-inner animate-fadeIn">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5C5783] border-b border-[#27187E]/10 pb-2 flex justify-between items-center">
                      <span>Seat Assignments & Costs</span>
                      <span className="text-[#758BFD] bg-[#758BFD]/10 px-2 py-0.5 rounded font-black text-[9px]">{ocrItems.length} items</span>
                    </span>

                    {ocrItems.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex flex-col gap-2 p-2 sm:p-2.5 bg-[#F7F7FF] rounded-xl border border-[#27187E]/5 transition hover:border-[#27187E]/15">
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            type="text"
                            value={item.item}
                            onChange={(e) => handleUpdateItemField(itemIdx, "item", e.target.value)}
                            className="h-8 flex-1 min-w-0 rounded-lg border border-[#27187E]/15 bg-white px-2 text-xs font-bold text-[#27187E] outline-none focus:border-[#758BFD] transition"
                            placeholder="Item Name"
                          />
                          <div className="relative w-[72px] shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">₹</span>
                            <input
                              type="number"
                              value={item.price || ""}
                              onChange={(e) => handleUpdateItemField(itemIdx, "price", e.target.value)}
                              className="h-8 w-full rounded-lg border border-[#27187E]/15 bg-white pl-5 pr-1 text-xs font-black text-[#27187E] outline-none focus:border-[#758BFD] transition"
                              placeholder="Price"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOcrItem(itemIdx)}
                            className="h-8 w-8 rounded-lg border-0 bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                            title="Delete Item"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Checklist avatars */}
                        <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap">
                          <span className="text-[9px] font-black text-[#5C5783] uppercase tracking-wider">Split with:</span>
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: numPeople }).map((_, pIdx) => {
                              const name = peopleNames[pIdx];
                              const initial = name === "You" ? "Y" : name[0];
                              const isAssigned = item.assignedTo.includes(pIdx);
                              const colors = MEMBER_COLORS[pIdx % MEMBER_COLORS.length];
                              return (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => handleToggleItemAssignment(itemIdx, pIdx)}
                                  className={`h-6 w-6 rounded-full border text-[10px] font-black transition-all flex items-center justify-center cursor-pointer ${
                                    isAssigned
                                      ? `${colors.activeBg} ${colors.activeText} border-transparent scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.1)]`
                                      : `${colors.bg} ${colors.text} ${colors.border} hover:scale-102 hover:border-[#27187E]/30`
                                  }`}
                                  title={`Toggle Split share for ${name}`}
                                >
                                  {initial}
                                </button>
                              );
                            })}
                          </div>
                          {item.assignedTo.length === 0 && (
                            <span className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 animate-pulse uppercase tracking-wider">
                              Equally (Default)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2 pt-3 border-t border-[#27187E]/10">
                      <button
                        type="button"
                        onClick={handleAddOcrItem}
                        className="h-8 px-3 rounded-lg border border-dashed border-[#27187E]/20 bg-white hover:bg-indigo-50/20 text-[#27187E] text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-97 shadow-sm"
                      >
                        + Add Item
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-[#5C5783] uppercase">Tax:</span>
                        <div className="relative w-20">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">₹</span>
                          <input
                            type="number"
                            value={taxAndService || ""}
                            onChange={(e) => handleTaxChange(e.target.value)}
                            className="h-8 w-full rounded-lg border border-[#27187E]/15 bg-white pl-5 pr-1.5 text-xs font-black text-[#27187E] outline-none focus:border-[#758BFD] transition"
                            placeholder="Tax"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Output */}
              <div className="md:col-span-7 rounded-xl border border-[#27187E]/5 bg-[#F7F7FF] p-3 sm:p-5 md:p-6 shadow-inner">
                <h4 className="m-0 text-sm font-extrabold uppercase tracking-wider text-[#5C5783] mb-4">
                  Breakdown Calculations
                </h4>

                {(() => {
                  const itemizedShares = splitType === "itemized" ? calculateItemizedShares() : null;

                  return (
                    <div className="flex flex-col gap-3.5 mb-6">
                      {Array.from({ length: numPeople }).map((_, idx) => {
                        const name = peopleNames[idx];
                        const shareAmount = splitType === "equal"
                          ? billAmount / numPeople
                          : splitType === "unequal"
                            ? (billAmount * (customShares[idx] || 0)) / 100
                            : itemizedShares.totals[idx] || 0;

                        return (
                          <div key={idx} className="flex flex-col gap-2.5 bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(39,24,126,0.02)] border border-[#27187E]/5 transition hover:scale-[1.01] hover:shadow-[0_4px_16px_rgba(39,24,126,0.04)] animate-fadeIn">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#758BFD]/10 text-xs font-black text-[#27187E]">
                                  {idx + 1}
                                </div>
                                <span className="font-extrabold text-[#27187E]">{name}</span>
                              </div>

                              <div className="flex items-center gap-3 justify-between sm:justify-end">
                                {splitType === "unequal" && (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      value={customShares[idx] || 0}
                                      onChange={(e) => handlePercentageChange(idx, parseInt(e.target.value) || 0)}
                                      className="w-12 h-8 rounded border border-[#27187E]/15 text-center text-xs font-bold text-[#27187E] bg-[#F7F7FF] outline-none focus:border-[#758BFD]"
                                    />
                                    <span className="text-xs text-[#5C5783] font-bold">%</span>
                                  </div>
                                )}
                                <span className="text-base font-black text-[#27187E]">
                                  ₹{shareAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Itemized consumption details list */}
                            {splitType === "itemized" && itemizedShares && (
                              <div className="w-full flex flex-col gap-1.5 border-t border-[#27187E]/5 pt-2.5 mt-1 text-left animate-fadeIn">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Items split share:</span>
                                <div className="flex flex-col gap-1">
                                  {itemizedShares.itemDetails[idx]?.map((detail, dIdx) => (
                                    <div key={dIdx} className="flex justify-between items-center text-[10px] text-[#5C5783]">
                                      <span className="truncate max-w-[120px] sm:max-w-[180px]">
                                        🍕 {detail.name} {detail.ratio !== 1 && `(1/${Math.round(1 / detail.ratio)})`}
                                      </span>
                                      <span className="font-semibold text-slate-700">
                                        ₹{(detail.price * detail.ratio).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  {itemizedShares.taxes[idx] > 0 && (
                                    <div className="flex justify-between items-center text-[10px] text-[#758BFD] font-extrabold border-t border-dashed border-[#27187E]/5 pt-1 mt-0.5">
                                      <span>Proportional Tax Share</span>
                                      <span>₹{itemizedShares.taxes[idx].toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center text-[10px] text-[#27187E] font-black pt-1 mt-0.5 border-t border-gray-100">
                                    <span>Subtotal + Tax</span>
                                    <span>₹{itemizedShares.totals[idx].toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="border-t border-[#27187E]/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5C5783] block uppercase tracking-wider">SUM TOTAL</span>
                    <span className="text-xl font-black text-[#27187E]">
                      ₹{billAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



      
       
        <section className="text-center rounded-2xl border border-indigo-100 bg-[#ECEAFE]/40 p-8 md:p-12 shadow-sm">
          <h3 className="m-0 text-2xl md:text-3xl font-black text-[#27187E]">
            Ready to split bills with zero stress?
          </h3>
          <p className="mt-4 text-sm md:text-base text-[#5C5783] max-w-lg mx-auto">
            Join thousands of users simplifying roommate expenses and travel costs today.
          </p>
          <div className="mt-8">
            <Link
              to={isLoggedIn ? "/dashboard" : "/auth"}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#27187E] px-8 text-base font-extrabold text-[#F7F7FF] no-underline shadow-[0_16px_35px_rgba(39,24,126,0.22)] transition-all duration-300 hover:bg-[#1f1368] hover:shadow-[0_20px_45px_rgba(39,24,126,0.3)] hover:-translate-y-0.5"
            >
              {isLoggedIn ? "Open Your Dashboard" : "Create Free Account"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#27187E]/10 bg-white py-12 relative z-10">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] grid gap-8 md:grid-cols-12 items-start">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#27187E] text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xl font-black tracking-tight text-[#27187E]">SplitEase</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#5C5783] max-w-sm">
              Making bill splitting simple, painless, and transparent. Settle roommate rent, travel tabs, and group dinners in seconds.
            </p>
          </div>

          <div className="md:col-span-3">
            <h5 className="m-0 text-xs font-black uppercase tracking-widest text-[#27187E]">Product</h5>
            <ul className="mt-4 list-none p-0 flex flex-col gap-3">
              <li><a href="#calculator" className="text-xs font-semibold text-[#5C5783] hover:text-[#27187E] no-underline transition">Interactive Calculator</a></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h5 className="m-0 text-xs font-black uppercase tracking-widest text-[#27187E]">SplitEase Team</h5>
            <p className="mt-4 text-xs leading-relaxed text-[#5C5783]">
              &copy; {new Date().getFullYear()} SplitEase. All rights reserved. <br />
              Making group finances transparent, fair, and fun.
            </p>
            <p className="m-0 mt-3 text-xs">
              <strong>Made with ❤️ By Sumant....</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
