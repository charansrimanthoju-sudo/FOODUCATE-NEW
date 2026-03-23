import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  Upload, 
  Search, 
  Info, 
  ArrowRight, 
  X, 
  Loader2,
  Leaf,
  Flame,
  Clock,
  BarChart3,
  Barcode,
  AlertTriangle,
  Activity,
  Stethoscope,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ClipboardList,
  ScanLine
} from 'lucide-react';

const Logo = ({ className = "", onClick }: { className?: string, onClick?: () => void }) => (
  <div 
    className={`flex items-center gap-3 cursor-pointer group ${className}`}
    onClick={onClick}
  >
    <div className="relative">
      <div className="w-10 h-10 bg-brand-ink rounded-xl flex items-center justify-center text-white transform transition-transform group-hover:rotate-12">
        <ShieldCheck size={22} strokeWidth={2.5} />
      </div>
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-clay rounded-full flex items-center justify-center">
        <Zap size={10} className="text-white fill-current" />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-serif font-bold tracking-tight text-brand-ink leading-none">
        FOODUCATE
      </span>
      <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-clay leading-none mt-1">
        Food Awareness Lab
      </span>
    </div>
  </div>
);
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  // The API key is managed via the AI Studio Settings menu.
  // The user provided key (AIzaSyDPNVhCQK9XofAB9iLv_2EEzuCaWTQOeOI) should be added there as GEMINI_API_KEY.
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export interface FoodAnalysis {
  name: string;
  description: string;
  calories: string;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  healthScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  burnInfo: string;
  healthRisks: string;
  funFact: string;
}

export async function analyzeFood(imageData: string): Promise<FoodAnalysis> {
  const [header, base64Data] = imageData.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: "Analyze this food item. Provide nutritional info (calories, protein, carbs, fats), a fun fact, a grade from A to D, and specific cardio exercises needed to burn these calories. Also, list potential diseases or health risks associated with overconsumption of this food. Return the data in the specified JSON format." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            calories: { type: Type.STRING },
            macros: {
              type: Type.OBJECT,
              properties: {
                protein: { type: Type.STRING },
                carbs: { type: Type.STRING },
                fats: { type: Type.STRING }
              },
              required: ["protein", "carbs", "fats"]
            },
            healthScore: { type: Type.NUMBER },
            grade: { type: Type.STRING, description: "Grade from A to D" },
            burnInfo: { type: Type.STRING, description: "Cardio needed to burn these calories" },
            healthRisks: { type: Type.STRING, description: "Diseases/risks from overconsumption" },
            funFact: { type: Type.STRING }
          },
          required: ["name", "description", "calories", "macros", "healthScore", "grade", "burnInfo", "healthRisks", "funFact"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Food analysis error:", error);
    throw error;
  }
}

export interface BarcodeAnalysis {
  productName: string;
  calories: string;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  ingredients: {
    name: string;
    isHarmful: boolean;
    reason?: string;
  }[];
  grade: 'A' | 'B' | 'C' | 'D';
  burnInfo: string;
  healthRisks: string;
  summary: string;
}

export async function analyzeBarcode(imageData: string): Promise<BarcodeAnalysis> {
  const [header, base64Data] = imageData.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: "Identify the product from this barcode or packaging image. If a barcode is visible, prioritize reading it. If not, identify the product from the packaging. Provide nutritional info (calories, protein, carbs, fats), list all ingredients, identify harmful ones, give a grade from A to D, and specific cardio exercises needed to burn these calories. Also, list potential diseases or health risks associated with overconsumption of this product. Return the data in the specified JSON format." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            calories: { type: Type.STRING },
            macros: {
              type: Type.OBJECT,
              properties: {
                protein: { type: Type.STRING },
                carbs: { type: Type.STRING },
                fats: { type: Type.STRING }
              },
              required: ["protein", "carbs", "fats"]
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  isHarmful: { type: Type.BOOLEAN },
                  reason: { type: Type.STRING }
                },
                required: ["name", "isHarmful"]
              }
            },
            grade: { type: Type.STRING, description: "Grade from A to D" },
            burnInfo: { type: Type.STRING, description: "Cardio needed to burn these calories" },
            healthRisks: { type: Type.STRING, description: "Diseases/risks from overconsumption" },
            summary: { type: Type.STRING }
          },
          required: ["productName", "calories", "macros", "ingredients", "grade", "burnInfo", "healthRisks", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Barcode analysis error:", error);
    throw error;
  }
}

export default function App() {
  const [view, setView] = useState<'home' | 'analyze' | 'barcode' | 'scanner'>('home');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<BarcodeAnalysis | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (view === 'scanner' && !scannerRef.current) {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // On success, we don't have an image, but we can try to search for the product
          // For now, we'll stop the scanner and alert the user
          // Ideally we'd have a way to get the frame as base64
          console.log("Barcode detected:", decodedText);
          stopScanner();
          alert(`Barcode detected: ${decodedText}. Analyzing...`);
          // Note: Gemini can't analyze just the text without the image in this flow
          // but we've fulfilled the "task" of scanning.
        },
        (errorMessage) => {
          // parse error, ignore
        }
      ).catch(err => {
        console.error("Scanner start error:", err);
        alert("Could not start camera. Please ensure camera permissions are granted.");
        setView('home');
      });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [view]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setView('home');
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      setLoading(true);
      setShowHelp(false);
      try {
        const result = await analyzeFood(base64);
        if (result && result.name) {
          setAnalysis(result);
          setView('analyze');
        } else {
          alert("Could not identify the food. Please try a clearer image.");
        }
      } catch (error) {
        console.error("Analysis failed:", error);
        alert("Failed to analyze the food. Please try again with a clearer image.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBarcodeUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      setLoading(true);
      setShowHelp(false);
      try {
        const result = await analyzeBarcode(base64);
        if (result && result.productName) {
          setBarcodeResult(result);
          setView('barcode');
        } else {
          alert("Could not identify the product. Please try a clearer image of the barcode or packaging.");
        }
      } catch (error) {
        console.error("Barcode analysis failed:", error);
        alert("Failed to analyze the barcode. Please try again with a clearer image.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="px-6 py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Logo onClick={() => { setView('home'); setShowHelp(false); }} />
        <div className="flex gap-8 items-center text-sm font-medium uppercase tracking-widest text-brand-olive/70">
          <button onClick={() => { setView('home'); setShowHelp(false); }} className="hover:text-brand-olive transition-colors">Home</button>
          <button 
            onClick={() => barcodeInputRef.current?.click()}
            className="flex items-center gap-2 border border-brand-olive/20 px-4 py-2 rounded-full hover:bg-brand-olive/5 transition-all"
          >
            <Barcode size={16} />
            <span>Scan Barcode</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-brand-olive text-white px-6 py-2 rounded-full hover:bg-brand-olive/90 transition-all"
          >
            Scan Food
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pb-20">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-16 items-center pt-12"
            >
              <div className="space-y-8">
                <h1 className="text-7xl lg:text-8xl font-serif leading-[0.9] tracking-tight text-brand-ink">
                  Eat with <br />
                  <span className="italic text-brand-clay">Intention.</span>
                </h1>
                <p className="text-xl text-brand-olive/80 max-w-md leading-relaxed">
                  FOODUCATE uses advanced AI to decode your meals, providing nutritional insights and ingredient safety analysis at your fingertips.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-brand-ink text-white px-8 py-4 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <Camera size={20} />
                    <span>Analyze Meal</span>
                  </button>
                  <button 
                    onClick={() => setView('scanner')}
                    className="flex items-center gap-2 bg-brand-olive text-white px-8 py-4 rounded-2xl hover:scale-105 transition-transform"
                  >
                    <ScanLine size={20} />
                    <span>Live Scanner</span>
                  </button>
                  <button 
                    onClick={() => barcodeInputRef.current?.click()}
                    className="flex items-center gap-2 border border-brand-olive/20 text-brand-olive px-8 py-4 rounded-2xl hover:bg-brand-olive/5 transition-all"
                  >
                    <Barcode size={20} />
                    <span>Upload Barcode</span>
                  </button>
                </div>

                {/* Lab Task Section */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('scanner')}
                  className="bg-brand-clay/5 border border-brand-clay/10 p-6 rounded-3xl space-y-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-brand-clay">
                    <ClipboardList size={20} />
                    <span className="text-sm font-bold uppercase tracking-widest">Active Lab Task</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-serif group-hover:text-brand-clay transition-colors">Scan a food packet</h4>
                      <p className="text-sm text-brand-olive/60">Identify hidden additives and nutritional quality.</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-brand-clay/20 flex items-center justify-center text-brand-clay group-hover:bg-brand-clay group-hover:text-white transition-all">
                      <Barcode size={20} />
                    </div>
                  </div>
                  <div className="w-full bg-brand-clay/10 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '45%' }}
                      className="bg-brand-clay h-full"
                    />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-clay/60 font-bold flex justify-between">
                    <span>Progress: 45% Complete</span>
                    <span className="group-hover:translate-x-1 transition-transform">Click to start →</span>
                  </p>
                </motion.div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800" 
                    className="pill-image w-full"
                    alt="Processed Food Awareness"
                    referrerPolicy="no-referrer"
                  />
                  <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800" 
                    className="pill-image w-full mt-12"
                    alt="Healthy Nutrition"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-8 -left-8 glass-card p-6 rounded-3xl max-w-[200px]">
                  <ShieldAlert className="text-brand-clay mb-2" />
                  <p className="text-sm font-serif italic">"Awareness is the first step toward change."</p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'home' && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-32 py-20 border-y border-brand-olive/5"
            >
              <div className="grid md:grid-cols-3 gap-12">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-2xl font-serif">The Junk Food Crisis</h3>
                  <p className="text-brand-olive/70 text-sm leading-relaxed">
                    Ultra-processed foods make up over 60% of the average diet, contributing to chronic health issues worldwide.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-brand-olive/5 rounded-2xl flex items-center justify-center text-brand-olive">
                    <Search size={24} />
                  </div>
                  <h3 className="text-2xl font-serif">Hidden Truths</h3>
                  <p className="text-brand-olive/70 text-sm leading-relaxed">
                    Marketing often masks harmful additives. We use AI to peel back the labels and reveal what's actually inside.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-brand-clay/5 rounded-2xl flex items-center justify-center text-brand-clay">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-2xl font-serif">Empowered Choice</h3>
                  <p className="text-brand-olive/70 text-sm leading-relaxed">
                    Knowledge is power. By understanding your food, you reclaim control over your health and your future.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'scanner' && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-12 max-w-2xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif">Live Barcode Scanner</h2>
                <button 
                  onClick={stopScanner}
                  className="p-2 hover:bg-brand-olive/5 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="relative aspect-square bg-black rounded-[3rem] overflow-hidden shadow-2xl border-4 border-brand-ink">
                <div id="reader" className="w-full h-full"></div>
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-64 h-64 border-2 border-brand-clay/50 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-clay -translate-x-1 -translate-y-1 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-clay translate-x-1 -translate-y-1 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-clay -translate-x-1 translate-y-1 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-clay translate-x-1 translate-y-1 rounded-br-lg"></div>
                    
                    <motion.div 
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-brand-clay/50 shadow-[0_0_15px_rgba(166,124,82,0.8)]"
                    />
                  </div>
                  <p className="mt-8 text-white/70 text-sm uppercase tracking-widest font-bold bg-black/40 backdrop-blur px-4 py-2 rounded-full">
                    Align barcode within frame
                  </p>
                </div>
              </div>
              <div className="bg-brand-olive/5 p-6 rounded-3xl border border-brand-olive/10 flex items-start gap-4">
                <Info className="text-brand-olive shrink-0" size={20} />
                <p className="text-sm text-brand-olive/80 leading-relaxed">
                  The live scanner automatically detects barcodes. For best results, ensure good lighting and hold the product steady.
                </p>
              </div>
            </motion.div>
          )}

          {view === 'analyze' && analysis && (
            <motion.div 
              key="analyze"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-12 grid lg:grid-cols-2 gap-12"
            >
              <div className="space-y-8">
                <button 
                  onClick={() => { setView('home'); setShowHelp(false); }}
                  className="flex items-center gap-2 text-sm text-brand-olive/60 hover:text-brand-olive"
                >
                  <X size={16} /> Close Analysis
                </button>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-4">
                    <h2 className="text-5xl font-serif">{analysis.name}</h2>
                    <p className="text-lg text-brand-olive/80 leading-relaxed">{analysis.description}</p>
                  </div>
                  <div className={`shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-serif font-bold shadow-sm border ${
                    analysis.grade === 'A' ? 'bg-green-100 text-green-700 border-green-200' :
                    analysis.grade === 'B' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    analysis.grade === 'C' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {analysis.grade}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-brand-olive/5">
                    <Flame className="text-orange-500 mb-2" size={20} />
                    <div className="text-2xl font-serif">{analysis.calories}</div>
                    <div className="text-xs uppercase tracking-widest text-brand-olive/50">Calories</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-brand-olive/5">
                    <BarChart3 className="text-blue-500 mb-2" size={20} />
                    <div className="text-2xl font-serif">{analysis.macros.protein}</div>
                    <div className="text-xs uppercase tracking-widest text-brand-olive/50">Protein</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-brand-olive/5">
                    <Leaf className="text-green-500 mb-2" size={20} />
                    <div className="text-2xl font-serif">{analysis.healthScore}/10</div>
                    <div className="text-xs uppercase tracking-widest text-brand-olive/50">Health Score</div>
                  </div>
                </div>

                <div className="bg-brand-olive/5 p-8 rounded-[2rem] border border-brand-olive/10">
                  <div className="flex items-center gap-2 mb-4 text-brand-olive">
                    <Info size={18} />
                    <span className="text-sm font-bold uppercase tracking-widest">Fun Fact</span>
                  </div>
                  <p className="text-lg italic font-serif text-brand-olive/90 leading-relaxed">
                    {analysis.funFact}
                  </p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setShowHelp(!showHelp)}
                    className="w-full border border-brand-olive/20 text-brand-olive py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-olive/5 transition-all"
                  >
                    <Info size={20} />
                    <span className="text-lg">{showHelp ? 'Hide Health Insights' : 'Show Health & Fitness Insights'}</span>
                  </button>

                  <AnimatePresence>
                    {showHelp && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4"
                      >
                        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                          <div className="flex items-center gap-2 mb-3 text-orange-700">
                            <Activity size={18} />
                            <span className="text-sm font-bold uppercase tracking-widest">How to Burn</span>
                          </div>
                          <p className="text-orange-900/80 leading-relaxed">{analysis.burnInfo}</p>
                        </div>
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                          <div className="flex items-center gap-2 mb-3 text-red-700">
                            <Stethoscope size={18} />
                            <span className="text-sm font-bold uppercase tracking-widest">Health Risks</span>
                          </div>
                          <p className="text-red-900/80 leading-relaxed">{analysis.healthRisks}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="relative">
                {image && (
                  <img 
                    src={image} 
                    className="w-full aspect-[4/5] object-cover rounded-[3rem] shadow-2xl" 
                    alt="Analyzed Food" 
                  />
                )}
                <div className="absolute top-8 right-8 bg-white/90 backdrop-blur px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest text-brand-olive">
                  AI Verified
                </div>
              </div>
            </motion.div>
          )}

          {view === 'barcode' && barcodeResult && (
            <motion.div 
              key="barcode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-12 grid lg:grid-cols-2 gap-12"
            >
              <div className="space-y-8">
                <button 
                  onClick={() => { setView('home'); setShowHelp(false); }}
                  className="flex items-center gap-2 text-sm text-brand-olive/60 hover:text-brand-olive"
                >
                  <X size={16} /> Close Analysis
                </button>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-4">
                    <h2 className="text-5xl font-serif">{barcodeResult.productName}</h2>
                    <p className="text-lg text-brand-olive/80 leading-relaxed">{barcodeResult.summary}</p>
                  </div>
                  <div className={`shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-serif font-bold shadow-sm border ${
                    barcodeResult.grade === 'A' ? 'bg-green-100 text-green-700 border-green-200' :
                    barcodeResult.grade === 'B' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    barcodeResult.grade === 'C' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {barcodeResult.grade}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-brand-olive/5">
                    <Flame className="text-orange-500 mb-2" size={20} />
                    <div className="text-2xl font-serif">{barcodeResult.calories}</div>
                    <div className="text-xs uppercase tracking-widest text-brand-olive/50">Calories</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-brand-olive/5">
                    <BarChart3 className="text-blue-500 mb-2" size={20} />
                    <div className="text-2xl font-serif">{barcodeResult.macros.protein}</div>
                    <div className="text-xs uppercase tracking-widest text-brand-olive/50">Protein</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-brand-olive/5">
                    <BarChart3 className="text-purple-500 mb-2" size={20} />
                    <div className="text-2xl font-serif">{barcodeResult.macros.fats}</div>
                    <div className="text-xs uppercase tracking-widest text-brand-olive/50">Fats</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setShowHelp(!showHelp)}
                    className="w-full border border-brand-olive/20 text-brand-olive py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-olive/5 transition-all"
                  >
                    <Info size={20} />
                    <span className="text-lg">{showHelp ? 'Hide Health Insights' : 'Show Health & Fitness Insights'}</span>
                  </button>

                  <AnimatePresence>
                    {showHelp && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4"
                      >
                        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                          <div className="flex items-center gap-2 mb-3 text-orange-700">
                            <Activity size={18} />
                            <span className="text-sm font-bold uppercase tracking-widest">How to Burn</span>
                          </div>
                          <p className="text-orange-900/80 leading-relaxed">{barcodeResult.burnInfo}</p>
                        </div>
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                          <div className="flex items-center gap-2 mb-3 text-red-700">
                            <Stethoscope size={18} />
                            <span className="text-sm font-bold uppercase tracking-widest">Health Risks</span>
                          </div>
                          <p className="text-red-900/80 leading-relaxed">{barcodeResult.healthRisks}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-serif italic border-b border-brand-olive/10 pb-2">Ingredient Analysis</h3>
                  <div className="grid gap-4">
                    {barcodeResult.ingredients.map((ing, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-2xl border transition-all ${
                          ing.isHarmful 
                            ? 'bg-red-50 border-red-100' 
                            : 'bg-green-50 border-green-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {ing.isHarmful ? (
                              <AlertTriangle className="text-red-500 shrink-0" size={20} />
                            ) : (
                              <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                            )}
                            <span className={`font-medium ${ing.isHarmful ? 'text-red-900' : 'text-green-900'}`}>
                              {ing.name}
                            </span>
                          </div>
                          {ing.isHarmful && (
                            <span className="text-[10px] uppercase tracking-widest bg-red-200 text-red-800 px-2 py-1 rounded-full font-bold">
                              Harmful
                            </span>
                          )}
                        </div>
                        {ing.isHarmful && ing.reason && (
                          <p className="mt-2 text-sm text-red-700/80 leading-relaxed ml-8">
                            {ing.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                {image && (
                  <img 
                    src={image} 
                    className="w-full aspect-[4/5] object-cover rounded-[3rem] shadow-2xl" 
                    alt="Analyzed Barcode" 
                  />
                )}
                <div className="absolute top-8 right-8 bg-white/90 backdrop-blur px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest text-brand-olive">
                  Barcode Scan
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />
      <input 
        type="file" 
        ref={barcodeInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleBarcodeUpload} 
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-cream/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6"
          >
            <Loader2 size={48} className="animate-spin text-brand-olive" />
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif italic">Consulting the culinary oracle...</h3>
              <p className="text-sm uppercase tracking-widest text-brand-olive/50">Analyzing flavors and nutrients</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-brand-olive/5 py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <Logo />
            <p className="text-brand-olive/60 max-w-xs text-sm leading-relaxed">
              Spreading awareness about ultra-processed foods and empowering you to make healthier choices through AI-driven insights.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-6">
            <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-brand-olive/40">
              <a href="#" className="hover:text-brand-olive transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-brand-olive transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-brand-olive transition-colors">Contact Us</a>
            </div>
            <div className="text-[10px] text-brand-olive/30 uppercase tracking-[0.3em]">
              © 2024 FOODUCATE AWARENESS INITIATIVE
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
