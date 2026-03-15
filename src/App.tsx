import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Zap
} from 'lucide-react';

const Logo = ({ className = "", onClick }: { className?: string, onClick?: () => void }) => (
  <div 
    className={`flex items-center gap-3 cursor-pointer group ${className}`}
    onClick={onClick}
  >
    <div className="relative">
      <div className="w-10 h-10 bg-brand-ink rounded-lg flex items-center justify-center text-white transform transition-all group-hover:scale-105">
        <ShieldCheck size={20} strokeWidth={2} />
      </div>
      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-accent rounded-full border-2 border-brand-cream flex items-center justify-center">
        <Zap size={8} className="text-white fill-current" />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-serif font-bold tracking-tight text-brand-ink leading-none">
        FOODUCATE
      </span>
      <span className="text-[8px] uppercase tracking-[0.25em] font-medium text-brand-ink/40 leading-none mt-1">
        Molecular Awareness Lab
      </span>
    </div>
  </div>
);
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { inlineData: { data: imageData.split(",")[1], mimeType: "image/jpeg" } },
          { text: "Analyze this food item. Provide nutritional info (calories, protein, carbs, fats), a fun fact, a grade from A to D, and specific cardio exercises needed to burn these calories. Also, list potential diseases or health risks associated with overconsumption of this food." }
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
            }
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

  return JSON.parse(response.text || "{}");
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
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { inlineData: { data: imageData.split(",")[1], mimeType: "image/jpeg" } },
          { text: "Identify the product from this barcode or packaging image. Provide nutritional info (calories, protein, carbs, fats), list all ingredients, identify harmful ones, give a grade from A to D, and specific cardio exercises needed to burn these calories. Also, list potential diseases or health risks associated with overconsumption of this product." }
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
            }
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

  return JSON.parse(response.text || "{}");
}

export default function App() {
  const [view, setView] = useState<'home' | 'analyze' | 'barcode'>('home');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<BarcodeAnalysis | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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
        setAnalysis(result);
        setView('analyze');
      } catch (error) {
        console.error("Analysis failed:", error);
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
        setBarcodeResult(result);
        setView('barcode');
      } catch (error) {
        console.error("Barcode analysis failed:", error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col lab-grid">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-brand-cream/80 backdrop-blur-md border-b border-brand-border">
        <div className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
          <Logo onClick={() => { setView('home'); setShowHelp(false); }} />
          <div className="hidden md:flex gap-8 items-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/60">
            <button onClick={() => { setView('home'); setShowHelp(false); }} className="hover:text-brand-ink transition-colors">Overview</button>
            <div className="w-px h-4 bg-brand-border" />
            <button 
              onClick={() => barcodeInputRef.current?.click()}
              className="flex items-center gap-2 hover:text-brand-ink transition-all"
            >
              <Barcode size={14} />
              <span>Barcode Scan</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-brand-ink text-white px-5 py-2.5 rounded-md hover:bg-brand-ink/90 transition-all"
            >
              Analyze Specimen
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-2 gap-20 items-center pt-8"
            >
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                    <Activity size={12} />
                    AI-Powered Nutritional Intelligence
                  </div>
                  <h1 className="text-7xl lg:text-8xl font-serif leading-[0.85] tracking-tighter text-brand-ink">
                    Decode <br />
                    <span className="italic text-brand-accent">Nutrition.</span>
                  </h1>
                </div>
                <p className="text-lg text-brand-ink/60 max-w-md leading-relaxed font-light">
                  FOODUCATE leverages molecular-level AI analysis to deconstruct your meals, exposing hidden additives and providing clinical-grade nutritional insights.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 bg-brand-ink text-white px-10 py-5 rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <Camera size={18} />
                    <span className="text-sm font-bold uppercase tracking-widest">Analyze Specimen</span>
                  </button>
                  <button 
                    onClick={() => barcodeInputRef.current?.click()}
                    className="flex items-center gap-3 border border-brand-ink/10 bg-white px-10 py-5 rounded-lg hover:bg-brand-ink hover:text-white transition-all duration-300"
                  >
                    <Barcode size={18} />
                    <span className="text-sm font-bold uppercase tracking-widest">Scan Barcode</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-8 pt-8 border-t border-brand-border">
                  <div>
                    <div className="text-2xl font-serif">99.4%</div>
                    <div className="data-label">AI Accuracy</div>
                  </div>
                  <div className="w-px h-8 bg-brand-border" />
                  <div>
                    <div className="text-2xl font-serif">2.4M+</div>
                    <div className="data-label">Items Indexed</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-[4/5] relative overflow-hidden rounded-2xl shadow-2xl">
                  <motion.img 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2 }}
                    src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1200" 
                    className="w-full h-full object-cover"
                    alt="Healthy Nutrition"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/40 to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10">
                    <div className="glass-card p-6 rounded-xl border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-white">
                          <ShieldCheck size={16} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-ink">Lab Verified</span>
                      </div>
                      <p className="text-sm font-serif italic text-brand-ink/80 leading-relaxed">
                        "Our mission is to bridge the gap between complex nutritional science and daily dietary choices."
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 border border-brand-border rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-16 h-16 border border-brand-accent/20 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}

          {view === 'home' && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-40 py-24 border-t border-brand-border"
            >
              <div className="grid md:grid-cols-3 gap-16">
                <div className="space-y-6">
                  <div className="data-label">01 / Analysis</div>
                  <h3 className="text-3xl font-serif leading-tight">Molecular <br />Deconstruction</h3>
                  <p className="text-brand-ink/50 text-sm leading-relaxed font-light">
                    Our AI models analyze visual and textual data to identify over 2,000 distinct chemical additives and nutritional markers.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="data-label">02 / Insights</div>
                  <h3 className="text-3xl font-serif leading-tight">Clinical <br />Grade Data</h3>
                  <p className="text-brand-ink/50 text-sm leading-relaxed font-light">
                    Receive detailed reports on macronutrients, potential health risks, and metabolic burn rates based on your unique profile.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="data-label">03 / Impact</div>
                  <h3 className="text-3xl font-serif leading-tight">Dietary <br />Sovereignty</h3>
                  <p className="text-brand-ink/50 text-sm leading-relaxed font-light">
                    Reclaim control over your biology by making informed decisions backed by data, not marketing.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'analyze' && analysis && (
            <motion.div 
              key="analyze"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid lg:grid-cols-[1fr_400px] gap-12 items-start"
            >
              <div className="glass-card rounded-2xl overflow-hidden border-brand-border">
                <div className="p-8 border-b border-brand-border flex justify-between items-center bg-white/40">
                  <div>
                    <div className="data-label mb-1">Specimen Analysis Report</div>
                    <h2 className="text-4xl font-serif">{analysis.name}</h2>
                  </div>
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-serif font-bold ${
                    analysis.grade === 'A' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    analysis.grade === 'B' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    analysis.grade === 'C' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {analysis.grade}
                  </div>
                </div>
                
                <div className="p-8 space-y-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                      <div className="data-label mb-2">Energy</div>
                      <div className="text-3xl font-serif">{analysis.calories}</div>
                      <div className="text-[10px] text-brand-ink/30 uppercase tracking-widest mt-1">Kilocalories</div>
                    </div>
                    <div>
                      <div className="data-label mb-2">Protein</div>
                      <div className="text-3xl font-serif">{analysis.macros.protein}</div>
                      <div className="text-[10px] text-brand-ink/30 uppercase tracking-widest mt-1">Grams</div>
                    </div>
                    <div>
                      <div className="data-label mb-2">Carbs</div>
                      <div className="text-3xl font-serif">{analysis.macros.carbs}</div>
                      <div className="text-[10px] text-brand-ink/30 uppercase tracking-widest mt-1">Grams</div>
                    </div>
                    <div>
                      <div className="data-label mb-2">Health Index</div>
                      <div className="text-3xl font-serif">{analysis.healthScore}/10</div>
                      <div className="text-[10px] text-brand-ink/30 uppercase tracking-widest mt-1">Composite Score</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="data-label">Description & Observations</div>
                    <p className="text-brand-ink/70 leading-relaxed font-light italic">
                      "{analysis.description}"
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-brand-ink text-white rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-brand-accent">
                        <Activity size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Metabolic Burn</span>
                      </div>
                      <p className="text-sm font-light leading-relaxed opacity-80">{analysis.burnInfo}</p>
                    </div>
                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-600">
                        <ShieldAlert size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Health Risks</span>
                      </div>
                      <p className="text-sm font-light leading-relaxed text-rose-900/70">{analysis.healthRisks}</p>
                    </div>
                  </div>

                  <div className="p-6 border border-brand-border rounded-xl bg-brand-cream/50">
                    <div className="flex items-center gap-2 mb-3 text-brand-ink/40">
                      <Info size={14} />
                      <span className="data-label">Laboratory Note</span>
                    </div>
                    <p className="text-sm text-brand-ink/60 leading-relaxed">
                      {analysis.funFact}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-brand-ink/5 border-t border-brand-border flex justify-center">
                   <button 
                    onClick={() => { setView('home'); setAnalysis(null); }}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40 hover:text-brand-ink transition-colors"
                  >
                    Discard Analysis
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-brand-border">
                  {image && (
                    <img 
                      src={image} 
                      className="w-full h-full object-cover" 
                      alt="Analyzed Food" 
                    />
                  )}
                </div>
                <div className="p-6 glass-card rounded-xl space-y-4">
                  <div className="data-label">Analysis Metadata</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-brand-ink/40">Timestamp</span>
                      <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-brand-ink/40">Method</span>
                      <span className="font-mono">Visual Recognition</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-brand-ink/40">Confidence</span>
                      <span className="font-mono text-emerald-600">98.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'barcode' && barcodeResult && (
            <motion.div 
              key="barcode"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid lg:grid-cols-[1fr_400px] gap-12 items-start"
            >
              <div className="glass-card rounded-2xl overflow-hidden border-brand-border">
                <div className="p-8 border-b border-brand-border flex justify-between items-center bg-white/40">
                  <div>
                    <div className="data-label mb-1">Barcode Decryption Report</div>
                    <h2 className="text-4xl font-serif">{barcodeResult.productName}</h2>
                  </div>
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-serif font-bold ${
                    barcodeResult.grade === 'A' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    barcodeResult.grade === 'B' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    barcodeResult.grade === 'C' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {barcodeResult.grade}
                  </div>
                </div>
                
                <div className="p-8 space-y-10">
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <div className="data-label mb-2">Energy</div>
                      <div className="text-3xl font-serif">{barcodeResult.calories}</div>
                    </div>
                    <div>
                      <div className="data-label mb-2">Protein</div>
                      <div className="text-3xl font-serif">{barcodeResult.macros.protein}</div>
                    </div>
                    <div>
                      <div className="data-label mb-2">Fats</div>
                      <div className="text-3xl font-serif">{barcodeResult.macros.fats}</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="data-label">Molecular Composition (Ingredients)</div>
                    <div className="grid gap-3">
                      {barcodeResult.ingredients.map((ing, i) => (
                        <div 
                          key={i} 
                          className={`p-4 rounded-lg border flex items-center justify-between transition-all ${
                            ing.isHarmful 
                              ? 'bg-rose-50/50 border-rose-100' 
                              : 'bg-emerald-50/50 border-emerald-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {ing.isHarmful ? (
                              <ShieldAlert className="text-rose-500" size={16} />
                            ) : (
                              <CheckCircle2 className="text-emerald-500" size={16} />
                            )}
                            <span className={`text-sm font-medium ${ing.isHarmful ? 'text-rose-900' : 'text-emerald-900'}`}>
                              {ing.name}
                            </span>
                          </div>
                          {ing.isHarmful && (
                            <span className="text-[8px] font-bold uppercase tracking-widest bg-rose-100 text-rose-600 px-2 py-1 rounded">
                              Harmful
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-brand-ink text-white rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-brand-accent">
                        <Activity size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Metabolic Burn</span>
                      </div>
                      <p className="text-sm font-light leading-relaxed opacity-80">{barcodeResult.burnInfo}</p>
                    </div>
                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-600">
                        <ShieldAlert size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Health Risks</span>
                      </div>
                      <p className="text-sm font-light leading-relaxed text-rose-900/70">{barcodeResult.healthRisks}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-brand-ink/5 border-t border-brand-border flex justify-center">
                   <button 
                    onClick={() => { setView('home'); setBarcodeResult(null); }}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40 hover:text-brand-ink transition-colors"
                  >
                    Discard Analysis
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-brand-border">
                  {image && (
                    <img 
                      src={image} 
                      className="w-full h-full object-cover" 
                      alt="Analyzed Barcode" 
                    />
                  )}
                </div>
                <div className="p-6 glass-card rounded-xl space-y-4">
                  <div className="data-label">Scan Metadata</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-brand-ink/40">Timestamp</span>
                      <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-brand-ink/40">Method</span>
                      <span className="font-mono">Barcode Decryption</span>
                    </div>
                  </div>
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
            className="fixed inset-0 bg-brand-cream/95 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-10"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-brand-border rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-24 h-24 border-4 border-brand-accent border-t-transparent rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck size={32} className="text-brand-accent animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-serif">Initiating Molecular Scan</h3>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-brand-ink/40">Deconstructing specimen data</p>
                <div className="w-40 h-0.5 bg-brand-border overflow-hidden rounded-full mt-2">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full h-full bg-brand-accent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-brand-border py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-6">
            <Logo />
            <p className="text-brand-ink/40 max-w-xs text-xs leading-relaxed font-light">
              A clinical-grade awareness initiative dedicated to exposing the molecular reality of modern food production.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-10">
            <div className="flex gap-10 text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">
              <a href="#" className="hover:text-brand-ink transition-colors">Privacy Protocol</a>
              <a href="#" className="hover:text-brand-ink transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-brand-ink transition-colors">Lab Access</a>
            </div>
            <div className="text-[9px] text-brand-ink/20 uppercase tracking-[0.4em]">
              © 2024 FOODUCATE MOLECULAR AWARENESS LAB
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
