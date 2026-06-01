import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import {
  TrendingUp, TrendingDown, Plus, LogOut, BarChart2, BookOpen,
  Home, Eye, EyeOff, ArrowUpRight, ArrowDownRight, Target,
  Check, Trash2, Search, ChevronRight, Users, Shield, Zap, Menu, X, Settings, FlaskConical, PanelLeft
} from "lucide-react";

/* ─── THEME ─── */
const C = {
  bg:"#07090c", surface:"#0c1018", card:"#111820", cardHover:"#161f2a",
  border:"#1a2535", borderHover:"#243040",
  red:"#e63946", redSoft:"rgba(230,57,70,0.12)", redBorder:"rgba(230,57,70,0.3)",
  green:"#1fd07a", greenSoft:"rgba(31,208,122,0.1)",
  amber:"#f5a623", blue:"#4a9eff",
  text:"#dde4ee", textSec:"#556070", textMuted:"#1e2a35", white:"#ffffff",
};

/* ─── UTILS ─── */
const fmt = (n) => (n >= 0 ? "+" : "") + n.toLocaleString("en-IN");

/* ─── EXCHANGE RATE API ─── */
const EXCHANGE_API_KEY = "5b4fd9f23287a50f71f2f27d";
const CURRENCIES_LIST = [
  { code:"USD", symbol:"$",  name:"US Dollar"  },
  { code:"INR", symbol:"₹",  name:"Indian Rupee"},
  { code:"EUR", symbol:"€",  name:"Euro"        },
];

async function fetchRates(base) {
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/${base}`);
    const data = await res.json();
    return data.conversion_rates || {};
  } catch { return {}; }
}

/* ─── LOGO ─── */
function Logo({ size = "md" }) {
  const sz = size === "lg" ? 26 : size === "sm" ? 14 : 18;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
      <div style={{
        width:sz*1.9, height:sz*1.9,
        background:`linear-gradient(135deg,${C.red},#8b0010)`,
        borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center"
      }}>
        <span style={{ color:"#fff", fontSize:sz*0.78, fontWeight:800, fontFamily:"monospace" }}>RR</span>
      </div>
      <span style={{ fontSize:sz, fontWeight:700, color:C.text, letterSpacing:"-0.03em" }}>
        RedRain<span style={{ color:C.red }}>Traders</span>
      </span>
    </div>
  );
}

/* ─── STAT CARD ─── */
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"1.1rem 1.3rem", display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, color:C.textSec, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
        {Icon && <Icon size={15} color={color||C.textSec} />}
      </div>
      <div style={{ fontSize:24, fontWeight:700, color:color||C.text, fontFamily:"monospace", letterSpacing:"-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:C.textSec }}>{sub}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════
   AUTH PAGE — REAL SUPABASE LOGIN
═══════════════════════════════════════ */
function AuthPage({ onLogin, onBack }) {
  const [isLogin, setIsLogin]       = useState(true);
  const [step, setStep]             = useState("form"); // "form" | "otp"
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [pass, setPass]             = useState("");
  const [otp, setOtp]               = useState(["","","","","",""]);
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [message, setMessage]       = useState("");
  const otpRefs                     = Array.from({length:6}, () => React.createRef());

  const inp = {
    background:C.surface, border:`1px solid ${C.border}`, borderRadius:9,
    padding:"0.7rem 1rem", color:C.text, fontSize:14, outline:"none",
    width:"100%", boxSizing:"border-box", fontFamily:"inherit"
  };
  const lbl = { fontSize:13, color:C.textSec, marginBottom:6, display:"block" };

  const handleOtpChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) otpRefs[idx+1].current?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs[idx-1].current?.focus();
    if (e.key === "Enter") handleVerifyOtp();
  };

  const handleSubmit = async () => {
    setError(""); setMessage(""); setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        const displayName = data.user.user_metadata?.full_name || email.split("@")[0];
        onLogin(displayName, data.user.id);
      } else {
        // SIGN UP → send OTP
        const { data, error } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        // Move to OTP step
        setStep("otp");
        setMessage("");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const token = otp.join("");
    if (token.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email, token, type:"signup"
      });
      if (error) throw error;
      const displayName = name || email.split("@")[0];
      onLogin(displayName, data.user.id);
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(""); setLoading(true);
    try {
      await supabase.auth.resend({ type:"signup", email });
      setMessage("✅ New code sent! Check your email.");
    } catch (err) {
      setError("Could not resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", padding:"2rem" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.5rem" }}><Logo size="lg" /></div>
          <h2 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.4rem" }}>
            {step==="otp" ? "Check your email" : isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ color:C.textSec, fontSize:14 }}>
            {step==="otp" ? `We sent a 6-digit code to ${email}` : isLogin ? "Log in to your trade journal" : "Start journaling your trades today"}
          </p>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"2rem" }}>
          {error && <div style={{ background:"rgba(230,57,70,0.1)", border:`1px solid ${C.redBorder}`, borderRadius:8, padding:"0.7rem 1rem", marginBottom:16, fontSize:13, color:C.red }}>{error}</div>}
          {message && <div style={{ background:C.greenSoft, border:"1px solid rgba(31,208,122,0.3)", borderRadius:8, padding:"0.7rem 1rem", marginBottom:16, fontSize:13, color:C.green }}>{message}</div>}

          {/* ── OTP STEP ── */}
          {step==="otp" ? (
            <>
              <div style={{ marginBottom:24 }}>
                <label style={lbl}>Enter 6-digit verification code</label>
                <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, idx)}
                      onKeyDown={e => handleOtpKeyDown(e, idx)}
                      style={{
                        width:48, height:56, textAlign:"center", fontSize:22, fontWeight:700,
                        background:C.surface, border:`2px solid ${digit ? C.red : C.border}`,
                        borderRadius:10, color:C.text, outline:"none", fontFamily:"monospace",
                        transition:"border-color 0.2s"
                      }}
                    />
                  ))}
                </div>
                <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:C.textSec }}>
                  Didn't receive it?{" "}
                  <span onClick={handleResendOtp} style={{ color:C.red, cursor:"pointer", fontWeight:600 }}>
                    Resend code
                  </span>
                </div>
              </div>

              <button onClick={handleVerifyOtp} disabled={loading} style={{
                width:"100%", background:loading?"#333":C.red, color:"#fff", border:"none",
                borderRadius:9, padding:"0.8rem", fontWeight:700, cursor:loading?"not-allowed":"pointer",
                fontSize:15, fontFamily:"inherit"
              }}>
                {loading ? "Verifying..." : "Verify & Enter Dashboard →"}
              </button>

              <div style={{ textAlign:"center", marginTop:"1.25rem" }}>
                <span onClick={()=>{ setStep("form"); setOtp(["","","","","",""]); setError(""); }}
                  style={{ fontSize:13, color:C.textSec, cursor:"pointer" }}>
                  ← Back to signup
                </span>
              </div>
            </>
          ) : (
            <>
              {/* ── SIGNUP/LOGIN FORM ── */}
              {!isLogin && (
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Full Name</label>
                  <input style={inp} placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/>
                </div>
              )}
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={lbl}>Password</label>
                <div style={{ position:"relative" }}>
                  <input style={{ ...inp, paddingRight:44 }} type={showPass?"text":"password"} placeholder="min. 6 characters"
                    value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
                  <button onClick={()=>setShowPass(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.textSec }}>
                    {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading} style={{
                width:"100%", background:loading?"#333":C.red, color:"#fff", border:"none",
                borderRadius:9, padding:"0.8rem", fontWeight:700, cursor:loading?"not-allowed":"pointer",
                fontSize:15, fontFamily:"inherit"
              }}>
                {loading ? "Please wait..." : isLogin ? "Login to Dashboard →" : "Create Account →"}
              </button>

              <div style={{ textAlign:"center", marginTop:"1.25rem" }}>
                <span style={{ fontSize:13, color:C.textSec }}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <span onClick={()=>{ setIsLogin(v=>!v); setError(""); setMessage(""); }}
                  style={{ fontSize:13, color:C.red, cursor:"pointer", fontWeight:600 }}>
                  {isLogin ? "Sign up free" : "Log in"}
                </span>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign:"center", marginTop:"1rem" }}>
          <span onClick={onBack} style={{ fontSize:13, color:C.textSec, cursor:"pointer" }}>← Back to homepage</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
function LandingPage({ onGetStarted }) {
  const FEATURES = [
    { icon:BookOpen, title:"Smart Trade Journal", desc:"Log every trade with entry, exit, strategy, and notes. See your complete trading history in one beautiful interface.", color:C.red },
    { icon:BarChart2, title:"Deep Analytics", desc:"Understand your win rate, best strategies, biggest drawdowns, and equity curve — all automatically calculated.", color:C.blue },
    { icon:Users, title:"Public Profiles", desc:"Share your verified trading journal with the world. Build credibility and grow your audience.", color:C.green },
    { icon:Zap, title:"Real-time Stats", desc:"Your dashboard updates the moment you log a trade. Instant P&L, streaks, and performance metrics.", color:C.amber },
    { icon:Shield, title:"Trusted & Secure", desc:"Your data is encrypted and safe. Full privacy controls in your settings.", color:"#a78bfa" },
    { icon:Target, title:"Goal Tracking", desc:"Set monthly profit targets and track your progress. Stay consistent with your trading plan.", color:"#f472b6" },
  ];
  const PRICING = [
    { name:"Starter", price:"Free", period:"forever", features:["Up to 50 trades/month","Basic stats dashboard","Public journal page","Mobile friendly"], cta:"Get Started Free", highlight:false },
    { name:"Pro", price:"₹499", period:"/month", features:["Unlimited trades","Advanced analytics","AI trade feedback","Export PDF & Excel","Priority support"], cta:"Start Pro Trial", highlight:true },
    { name:"Elite", price:"₹999", period:"/month", features:["Everything in Pro","Custom journal domain","Verified badge","Leaderboard ranking","1-on-1 onboarding"], cta:"Go Elite", highlight:false },
  ];

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"sans-serif" }}>
      {/* NAV */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.1rem 3rem", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:"rgba(7,9,12,0.92)", backdropFilter:"blur(12px)", zIndex:100 }}>
        <Logo />
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={onGetStarted} style={{ background:"transparent", color:C.textSec, border:"none", padding:"0.5rem 1rem", cursor:"pointer", fontSize:14 }}>Login</button>
          <button onClick={onGetStarted} style={{ background:C.red, color:"#fff", border:"none", borderRadius:8, padding:"0.55rem 1.3rem", fontWeight:600, cursor:"pointer", fontSize:14 }}>Start Free →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign:"center", padding:"6rem 2rem 5rem", background:`radial-gradient(ellipse 80% 50% at 50% -10%, rgba(230,57,70,0.15), transparent)` }}>
        <div style={{ display:"inline-block", background:C.redSoft, border:`1px solid ${C.redBorder}`, borderRadius:20, padding:"0.3rem 0.9rem", fontSize:12, color:C.red, marginBottom:"1.5rem", fontWeight:600, letterSpacing:"0.05em" }}>
          🚀 THE TRADER'S EDGE STARTS HERE
        </div>
        <h1 style={{ fontSize:"clamp(2.5rem,6vw,4.5rem)", fontWeight:800, lineHeight:1.1, letterSpacing:"-0.03em", margin:"0 0 1.5rem", maxWidth:800, marginLeft:"auto", marginRight:"auto" }}>
          Track Every Trade.<br/><span style={{ color:C.red }}>Master Every Market.</span>
        </h1>
        <p style={{ fontSize:"1.15rem", color:C.textSec, maxWidth:520, margin:"0 auto 2.5rem", lineHeight:1.7 }}>
          RedRain Traders is the professional trade journal built for serious Indian traders. Log trades, analyse performance, and share your journey publicly.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={onGetStarted} style={{ background:C.red, color:"#fff", border:"none", borderRadius:10, padding:"0.85rem 2rem", fontWeight:700, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", gap:8 }}>
            Start Journaling Free <ChevronRight size={18}/>
          </button>
          <button onClick={onGetStarted} style={{ background:"transparent", color:C.text, border:`1px solid ${C.border}`, borderRadius:10, padding:"0.85rem 2rem", fontWeight:600, cursor:"pointer", fontSize:16 }}>
            View Demo Dashboard
          </button>
        </div>
        <div style={{ marginTop:"2.5rem", display:"flex", gap:"2.5rem", justifyContent:"center", flexWrap:"wrap" }}>
          {[["10,000+","Traders"],["₹2Cr+","P&L Tracked"],["98%","Uptime"]].map(([v,l]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"1.6rem", fontWeight:800, color:C.text, fontFamily:"monospace" }}>{v}</div>
              <div style={{ fontSize:13, color:C.textSec }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding:"5rem 3rem", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"3rem" }}>
          <h2 style={{ fontSize:"2rem", fontWeight:700, letterSpacing:"-0.02em", margin:"0 0 0.75rem" }}>Everything a serious trader needs</h2>
          <p style={{ color:C.textSec }}>Powerful tools. Simple interface. Built for Indian markets.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem" }}>
              <div style={{ width:42, height:42, borderRadius:10, background:`rgba(${f.color===C.red?"230,57,70":f.color===C.blue?"74,158,255":f.color===C.green?"31,208,122":"245,166,35"},0.12)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <f.icon size={20} color={f.color}/>
              </div>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>{f.title}</div>
              <div style={{ color:C.textSec, fontSize:14, lineHeight:1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div style={{ padding:"5rem 3rem", background:C.surface }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"3rem" }}>
            <h2 style={{ fontSize:"2rem", fontWeight:700, margin:"0 0 0.75rem" }}>Simple, honest pricing</h2>
            <p style={{ color:C.textSec }}>Start free. Upgrade when you're ready.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 }}>
            {PRICING.map(p => (
              <div key={p.name} style={{ background:p.highlight?C.card:"transparent", border:p.highlight?`2px solid ${C.red}`:`1px solid ${C.border}`, borderRadius:16, padding:"1.75rem", position:"relative" }}>
                {p.highlight && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:C.red, color:"#fff", fontSize:11, fontWeight:700, padding:"0.2rem 0.8rem", borderRadius:20 }}>MOST POPULAR</div>}
                <div style={{ fontSize:14, color:C.textSec, fontWeight:600, marginBottom:8 }}>{p.name}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
                  <span style={{ fontSize:32, fontWeight:800, fontFamily:"monospace" }}>{p.price}</span>
                  <span style={{ color:C.textSec, fontSize:13 }}>{p.period}</span>
                </div>
                <div style={{ borderTop:`1px solid ${C.border}`, margin:"1.25rem 0", paddingTop:"1.25rem" }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <Check size={14} color={C.green}/><span style={{ fontSize:14, color:C.textSec }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onGetStarted} style={{ width:"100%", padding:"0.75rem", background:p.highlight?C.red:"transparent", color:p.highlight?"#fff":C.text, border:p.highlight?"none":`1px solid ${C.border}`, borderRadius:9, fontWeight:700, cursor:"pointer", fontSize:14 }}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"2rem 3rem", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <Logo size="sm"/>
        <div style={{ fontSize:13, color:C.textSec }}>© 2024 RedRain Traders · Built for Indian Markets 🇮🇳</div>
        {["Privacy","Terms","Contact"].map(l => <span key={l} style={{ fontSize:13, color:C.textSec, cursor:"pointer" }}>{l}</span>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════ */
function Sidebar({ active, setActive, onLogout, userName, isOpen, onToggle }) {
  const NAV = [
    { id:"dashboard",   icon:Home,          label:"Dashboard"     },
    { id:"add",         icon:Plus,          label:"Log Trade"     },
    { id:"history",     icon:BookOpen,      label:"Trade History" },
    { id:"analytics",   icon:BarChart2,     label:"Analytics"     },
    { id:"backtesting", icon:FlaskConical,  label:"Backtesting"   },
    { id:"settings",    icon:Settings,      label:"Settings"      },
  ];
  return (
    <>
      {/* COLLAPSED — just hamburger button */}
      {!isOpen && (
        <div style={{ width:52, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", padding:"1rem 0", gap:4, fontFamily:"sans-serif" }}>
          <button onClick={onToggle} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.textSec, padding:"0.5rem", borderRadius:8, marginBottom:8 }}>
            <PanelLeft size={20}/>
          </button>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>{ setActive(n.id); }} title={n.label} style={{ background:active===n.id?C.redSoft:"transparent", border:"none", cursor:"pointer", color:active===n.id?C.red:C.textSec, padding:"0.65rem", borderRadius:9, width:40, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <n.icon size={18}/>
            </button>
          ))}
        </div>
      )}

      {/* OPEN SIDEBAR */}
      {isOpen && (
        <div style={{ width:220, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"1.25rem 0.75rem", fontFamily:"sans-serif", transition:"all 0.2s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:"1.25rem", borderBottom:`1px solid ${C.border}`, marginBottom:"1rem" }}>
            <Logo size="sm"/>
            <button onClick={onToggle} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.textSec, padding:"0.3rem", borderRadius:6 }}>
              <PanelLeft size={16}/>
            </button>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setActive(n.id)} style={{
                display:"flex", alignItems:"center", gap:10, padding:"0.65rem 0.85rem", borderRadius:9, border:"none",
                background:active===n.id?C.redSoft:"transparent", color:active===n.id?C.red:C.textSec,
                cursor:"pointer", fontWeight:active===n.id?600:400, fontSize:14, fontFamily:"inherit",
                borderLeft:active===n.id?`2px solid ${C.red}`:"2px solid transparent"
              }}>
                <n.icon size={16}/>{n.label}
              </button>
            ))}
          </div>
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"1rem" }}>
            <div style={{ padding:"0.5rem 0.85rem", marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{userName}</div>
              <div style={{ fontSize:11, color:C.textSec }}>Pro Trader</div>
            </div>
            <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:10, padding:"0.65rem 0.85rem", borderRadius:9, border:"none", background:"transparent", color:C.textSec, cursor:"pointer", fontSize:14, fontFamily:"inherit", width:"100%" }}>
              <LogOut size={16}/> Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const STRATEGIES = ["Trend Follow","Reversal","Breakout","Scalp","Earnings Play","Swing","Other"];
const ASSETS = ["NIFTY","BANKNIFTY","RELIANCE","INFY","TCS","HDFC","WIPRO","ONGC","SBIN","ICICIBANK","Other"];

/* ═══════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════ */
function DashboardView({ trades, setActive, userName, convertPnl, currSym }) {
  const cp = (pnl, t) => convertPnl ? convertPnl(pnl, t?.currency || "USD") : pnl;
  const stats = useMemo(() => {
    const converted = trades.map(t=>({...t, cpnl: cp(t.pnl, t)}));
    const wins = converted.filter(t=>t.cpnl>0), losses = converted.filter(t=>t.cpnl<0);
    const totalPnl = converted.reduce((a,t)=>a+t.cpnl,0);
    const winRate = trades.length ? Math.round((wins.length/trades.length)*100) : 0;
    const avgWin = wins.length ? Math.round(wins.reduce((a,t)=>a+t.cpnl,0)/wins.length) : 0;
    const avgLoss = losses.length ? Math.round(losses.reduce((a,t)=>a+t.cpnl,0)/losses.length) : 0;
    let running = 0;
    const equity = converted.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(t=>{ running+=t.cpnl; return { date:t.date.slice(5), value:+running.toFixed(2) }; });
    return { totalPnl, winRate, avgWin, avgLoss, wins:wins.length, losses:losses.length, equity };
  }, [trades, convertPnl]);

  const recent = trades.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.6rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Good day, {userName} 👋</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>Here's your trading performance overview.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
        <StatCard label="Total P&L" value={`${stats.totalPnl>=0?"+":""}${currSym||"$"}${Math.abs(stats.totalPnl).toLocaleString()}`} sub={`${trades.length} trades logged`} color={stats.totalPnl>=0?C.green:C.red} icon={stats.totalPnl>=0?TrendingUp:TrendingDown}/>
        <StatCard label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.wins}W / ${stats.losses}L`} color={stats.winRate>=50?C.green:C.red} icon={Target}/>
        <StatCard label="Avg Win" value={`+${currSym||"$"}${stats.avgWin.toLocaleString()}`} sub="per winning trade" color={C.green} icon={ArrowUpRight}/>
        <StatCard label="Avg Loss" value={`${currSym||"$"}${Math.abs(stats.avgLoss).toLocaleString()}`} sub="per losing trade" color={C.red} icon={ArrowDownRight}/>
      </div>

      {stats.equity.length > 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem", marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:16 }}>Equity Curve</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.equity}>
              <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity={0.25}/><stop offset="100%" stopColor={C.red} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.textMuted} strokeOpacity={0.3}/>
              <XAxis dataKey="date" tick={{ fontSize:11, fill:C.textSec }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:C.textSec }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`}/>
              <Tooltip formatter={v=>[`${currSym||"$"}${v.toLocaleString()}`,"P&L"]}/>
              <Area type="monotone" dataKey="value" stroke={C.red} strokeWidth={2} fill="url(#eg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Recent Trades</div>
          <span onClick={()=>setActive("history")} style={{ fontSize:12, color:C.red, cursor:"pointer" }}>View all →</span>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign:"center", color:C.textSec, fontSize:14, padding:"2rem" }}>
            No trades yet. <span onClick={()=>setActive("add")} style={{ color:C.red, cursor:"pointer" }}>Log your first trade →</span>
          </div>
        ) : recent.map(t => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.75rem 0.9rem", background:C.cardHover, borderRadius:10, border:`1px solid ${C.border}`, marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ padding:"0.2rem 0.6rem", borderRadius:6, fontSize:11, fontWeight:700, background:t.type==="Long"?C.greenSoft:C.redSoft, color:t.type==="Long"?C.green:C.red }}>{t.type}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{t.asset}</div>
                <div style={{ fontSize:11, color:C.textSec }}>{t.date} · {t.strategy}</div>
              </div>
            </div>
            <div style={{ fontSize:15, fontWeight:700, fontFamily:"monospace", color:t.pnl>=0?C.green:C.red }}>{t.pnl>=0?"+":""}{currSym||"$"}{Math.abs(convertPnl?convertPnl(t.pnl,t.currency||"USD"):t.pnl).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ADD TRADE
═══════════════════════════════════════ */
const CURRENCIES = [
  { code:"USD", symbol:"$" },
  { code:"INR", symbol:"₹" },
  { code:"EUR", symbol:"€" },
];

function AssetInput({ value, onChange, favourites, onToggleFav }) {
  const isFav = favourites.includes(value.trim().toUpperCase());
  const inp = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:"0.7rem 1rem", color:C.text, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
  return (
    <div>
      <div style={{ display:"flex", gap:8 }}>
        <input style={{ ...inp, textTransform:"uppercase" }} placeholder="e.g. EURUSD, GOLD, BTC, NIFTY..."
          value={value} onChange={e => onChange(e.target.value.toUpperCase())} />
        <button onClick={onToggleFav} title={isFav ? "Remove from favourites" : "Save to favourites"}
          style={{ background: isFav ? "rgba(245,166,35,0.15)" : C.surface, border:`1px solid ${isFav ? "#f5a623" : C.border}`, borderRadius:9, padding:"0 0.85rem", cursor:"pointer", fontSize:20, flexShrink:0 }}>
          {isFav ? "⭐" : "☆"}
        </button>
      </div>
      {favourites.length > 0 && (
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:11, color:C.textSec, marginBottom:5 }}>⭐ Favourites:</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {favourites.map(f => (
              <button key={f} onClick={() => onChange(f)}
                style={{ background: value===f ? C.redSoft : C.surface, border:`1px solid ${value===f ? C.red : C.border}`, borderRadius:6, padding:"0.2rem 0.7rem", fontSize:12, color: value===f ? C.red : C.textSec, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddTradeView({ onAdd, userId }) {
  const [tradeMode, setTradeMode] = useState("cfd");
  const blankCfd = { date:"", asset:"", type:"Long", entry:"", exit:"", lotSize:"", sl:"", tp:"", pnl:"", currency:"USD", strategy:"Trend Follow", notes:"" };
  const blankFo  = { date:"", asset:"", instrument:"Futures", type:"Long", entry:"", exit:"", qty:"", sl:"", tp:"", pnl:"", currency:"USD", strategy:"Trend Follow", notes:"" };
  const [cfdForm,  setCfdForm]  = useState(blankCfd);
  const [foForm,   setFoForm]   = useState(blankFo);
  const [success, setSuccess]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rr_fav_assets") || "[]"); } catch { return []; }
  });

  const setCfd = (k,v) => setCfdForm(f=>({...f,[k]:v}));
  const setFo  = (k,v) => setFoForm(f=>({...f,[k]:v}));

  const toggleFav = (asset) => {
    const a = asset.trim().toUpperCase();
    if (!a) return;
    const updated = favourites.includes(a) ? favourites.filter(x=>x!==a) : [...favourites, a];
    setFavourites(updated);
    localStorage.setItem("rr_fav_assets", JSON.stringify(updated));
  };

  const currSymbol = (code) => CURRENCIES.find(c=>c.code===code)?.symbol || "$";

  const handleSubmit = async () => {
    const f = tradeMode==="cfd" ? cfdForm : foForm;
    const qty = tradeMode==="cfd" ? f.lotSize : f.qty;
    if(!f.date||!f.asset||!f.entry||!f.exit||!qty||f.pnl==="") {
      alert("Please fill in all required fields including Actual P&L!");
      return;
    }
    setSaving(true);
    const manualPnl = parseFloat(f.pnl);
    const trade = {
      date: f.date,
      asset: f.asset.trim().toUpperCase(),
      type: f.type,
      entry: parseFloat(f.entry),
      exit: parseFloat(f.exit),
      qty: Math.abs(parseFloat(qty)),
      strategy: f.strategy,
      notes: f.notes || "",
      currency: f.currency,
      trade_mode: tradeMode,
      instrument: f.instrument || null,
      sl: f.sl ? parseFloat(f.sl) : null,
      tp: f.tp ? parseFloat(f.tp) : null,
      pnl: isNaN(manualPnl) ? 0 : manualPnl,
      user_id: userId,
    };
    const { data, error } = await supabase.from("trades").insert([trade]).select().single();
    setSaving(false);
    if(error) {
      alert("Error saving trade: " + error.message);
      return;
    }
    if(data) {
      onAdd(data);
      setSuccess(true);
      tradeMode==="cfd" ? setCfdForm(blankCfd) : setFoForm(blankFo);
      setTimeout(()=>setSuccess(false), 3000);
    }
  };

  const inp = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:"0.7rem 1rem", color:C.text, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
  const lbl = { fontSize:13, color:C.textSec, marginBottom:6, display:"block", fontWeight:500 };
  const row = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 };
  const sym = currSymbol(tradeMode==="cfd" ? cfdForm.currency : foForm.currency);
  const activePnl = tradeMode==="cfd" ? cfdForm.pnl : foForm.pnl;
  const pnlNum = parseFloat(activePnl);

  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Log a New Trade</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>Record every detail of your trade for better analysis.</p>
      </div>

      {/* TOGGLE */}
      <div style={{ display:"flex", gap:0, marginBottom:24, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:4, maxWidth:320, width:"100%" }}>
        {[["cfd","CFD"],["fo","Futures & Options"]].map(([mode, label])=>(
          <button key={mode} onClick={()=>setTradeMode(mode)} style={{
            flex:1, padding:"0.6rem 1rem", borderRadius:8, border:"none",
            background: tradeMode===mode ? C.red : "transparent",
            color: tradeMode===mode ? "#fff" : C.textSec,
            fontWeight:600, cursor:"pointer", fontSize:13, fontFamily:"inherit",
            transition:"all 0.2s"
          }}>{label}</button>
        ))}
      </div>

      {success && <div style={{ background:C.greenSoft, border:"1px solid rgba(31,208,122,0.3)", borderRadius:10, padding:"0.85rem 1rem", marginBottom:20, color:C.green, fontSize:14, display:"flex", alignItems:"center", gap:8 }}><Check size={16}/> Trade saved! Dashboard updated.</div>}

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.75rem", maxWidth:680 }}>

        {/* ── CFD FORM ── */}
        {tradeMode==="cfd" && (
          <>
            <div style={row}>
              <div><label style={lbl}>Date</label><input type="date" style={inp} value={cfdForm.date} onChange={e=>setCfd("date",e.target.value)}/></div>
              <div>
                <label style={lbl}>Asset / Symbol</label>
                <AssetInput value={cfdForm.asset} onChange={v=>setCfd("asset",v)} favourites={favourites} onToggleFav={()=>toggleFav(cfdForm.asset)}/>
              </div>
            </div>
            <div style={row}>
              <div>
                <label style={lbl}>Direction</label>
                <div style={{ display:"flex", gap:10 }}>
                  {["Long","Short"].map(t=>(
                    <button key={t} onClick={()=>setCfd("type",t)} style={{ flex:1, padding:"0.7rem", border:`1px solid ${cfdForm.type===t?(t==="Long"?C.green:C.red):C.border}`, borderRadius:9, background:cfdForm.type===t?(t==="Long"?C.greenSoft:C.redSoft):"transparent", color:cfdForm.type===t?(t==="Long"?C.green:C.red):C.textSec, fontWeight:600, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>
                      {t==="Long"?"📈 Long":"📉 Short"}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            <div style={row}>
              <div><label style={lbl}>Entry Price ({sym})</label><input type="number" style={inp} placeholder="1.2050" value={cfdForm.entry} onChange={e=>setCfd("entry",e.target.value)}/></div>
              <div><label style={lbl}>Exit Price ({sym})</label><input type="number" style={inp} placeholder="1.2150" value={cfdForm.exit} onChange={e=>setCfd("exit",e.target.value)}/></div>
            </div>
            <div style={row}>
              <div><label style={lbl}>Lot Size</label><input type="number" min="0" step="0.01" style={inp} placeholder="e.g. 0.1" value={cfdForm.lotSize} onChange={e=>setCfd("lotSize", Math.abs(e.target.value).toString())}/></div>
              <div><label style={lbl}>Strategy</label><select style={{ ...inp, cursor:"pointer" }} value={cfdForm.strategy} onChange={e=>setCfd("strategy",e.target.value)}>{STRATEGIES.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={row}>
              <div><label style={lbl}>Stop Loss — SL ({sym}) <span style={{color:C.textSec,fontWeight:400}}>(optional)</span></label><input type="number" min="0" style={inp} placeholder="e.g. 1.1950" value={cfdForm.sl} onChange={e=>setCfd("sl",e.target.value)}/></div>
              <div><label style={lbl}>Take Profit — TP ({sym}) <span style={{color:C.textSec,fontWeight:400}}>(optional)</span></label><input type="number" min="0" style={inp} placeholder="e.g. 1.2300" value={cfdForm.tp} onChange={e=>setCfd("tp",e.target.value)}/></div>
            </div>
          </>
        )}

        {/* ── FUTURES & OPTIONS FORM ── */}
        {tradeMode==="fo" && (
          <>
            <div style={row}>
              <div><label style={lbl}>Date</label><input type="date" style={inp} value={foForm.date} onChange={e=>setFo("date",e.target.value)}/></div>
              <div>
                <label style={lbl}>Asset / Symbol</label>
                <AssetInput value={foForm.asset} onChange={v=>setFo("asset",v)} favourites={favourites} onToggleFav={()=>toggleFav(foForm.asset)}/>
              </div>
            </div>
            <div style={row}>
              <div>
                <label style={lbl}>Instrument</label>
                <div style={{ display:"flex", gap:10 }}>
                  {["Futures","Options"].map(inst=>(
                    <button key={inst} onClick={()=>setFo("instrument",inst)} style={{ flex:1, padding:"0.7rem", border:`1px solid ${foForm.instrument===inst?C.blue:C.border}`, borderRadius:9, background:foForm.instrument===inst?"rgba(74,158,255,0.1)":"transparent", color:foForm.instrument===inst?C.blue:C.textSec, fontWeight:600, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>
                      {inst==="Futures"?"📊 Futures":"🎯 Options"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Direction</label>
                <div style={{ display:"flex", gap:10 }}>
                  {["Long","Short"].map(t=>(
                    <button key={t} onClick={()=>setFo("type",t)} style={{ flex:1, padding:"0.7rem", border:`1px solid ${foForm.type===t?(t==="Long"?C.green:C.red):C.border}`, borderRadius:9, background:foForm.type===t?(t==="Long"?C.greenSoft:C.redSoft):"transparent", color:foForm.type===t?(t==="Long"?C.green:C.red):C.textSec, fontWeight:600, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>
                      {t==="Long"?"📈 Long":"📉 Short"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={row}>
              <div><label style={lbl}>Entry Price ({sym})</label><input type="number" style={inp} placeholder="22100" value={foForm.entry} onChange={e=>setFo("entry",e.target.value)}/></div>
              <div><label style={lbl}>Exit Price ({sym})</label><input type="number" style={inp} placeholder="22340" value={foForm.exit} onChange={e=>setFo("exit",e.target.value)}/></div>
            </div>
            <div style={row}>
              <div><label style={lbl}>Quantity / Lots</label><input type="number" min="0" step="1" style={inp} placeholder="1" value={foForm.qty} onChange={e=>setFo("qty", Math.abs(e.target.value).toString())}/></div>
              <div><label style={lbl}>Strategy</label><select style={{ ...inp, cursor:"pointer" }} value={foForm.strategy} onChange={e=>setFo("strategy",e.target.value)}>{STRATEGIES.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={row}>
              <div><label style={lbl}>Stop Loss — SL ({sym}) <span style={{color:C.textSec,fontWeight:400}}>(optional)</span></label><input type="number" min="0" style={inp} placeholder="e.g. 21800" value={foForm.sl} onChange={e=>setFo("sl",e.target.value)}/></div>
              <div><label style={lbl}>Take Profit — TP ({sym}) <span style={{color:C.textSec,fontWeight:400}}>(optional)</span></label><input type="number" min="0" style={inp} placeholder="e.g. 22500" value={foForm.tp} onChange={e=>setFo("tp",e.target.value)}/></div>
            </div>
          </>
        )}

        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Actual P&L ({sym}) <span style={{color:C.red,fontWeight:600}}>*</span></label>
          <div style={{ position:"relative" }}>
            <input
              type="number"
              style={{ ...inp, border:`1px solid ${activePnl!==""?(pnlNum>=0?"rgba(31,208,122,0.5)":"rgba(230,57,70,0.5)"):C.border}`, paddingRight:80 }}
              placeholder="Enter profit (+) or loss (-) e.g. 250 or -150"
              value={tradeMode==="cfd"?cfdForm.pnl:foForm.pnl}
              onChange={e=>tradeMode==="cfd"?setCfd("pnl",e.target.value):setFo("pnl",e.target.value)}
            />
            {activePnl!=="" && !isNaN(pnlNum) && (
              <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:13, fontWeight:700, fontFamily:"monospace", color:pnlNum>=0?C.green:C.red }}>
                {pnlNum>=0?"+":""}{sym}{Math.abs(pnlNum).toLocaleString()}
              </span>
            )}
          </div>
          <div style={{ fontSize:11, color:C.textSec, marginTop:5 }}>
            💡 Profit → positive number (e.g. 250) &nbsp;|&nbsp; Loss → negative number (e.g. -150)
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={lbl}>Trade Notes</label>
          <textarea style={{ ...inp, resize:"vertical", minHeight:90, lineHeight:1.6 }}
            placeholder="What was your reasoning? What did you learn?"
            value={tradeMode==="cfd"?cfdForm.notes:foForm.notes}
            onChange={e=>tradeMode==="cfd"?setCfd("notes",e.target.value):setFo("notes",e.target.value)}/>
        </div>

        <button onClick={handleSubmit} disabled={saving} style={{ background:saving?"#333":C.red, color:"#fff", border:"none", borderRadius:10, padding:"0.85rem 2rem", fontWeight:700, cursor:saving?"not-allowed":"pointer", fontSize:15, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}>
          <Plus size={16}/>{saving?"Saving...":"Log This Trade"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TRADE HISTORY
═══════════════════════════════════════ */
function HistoryView({ trades, onDelete, convertPnl, currSym }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const filtered = useMemo(()=>trades.slice().sort((a,b)=>b.date.localeCompare(a.date)).filter(t=>{
    const s=t.asset.toLowerCase().includes(search.toLowerCase())||t.strategy.toLowerCase().includes(search.toLowerCase())||t.notes.toLowerCase().includes(search.toLowerCase());
    const f=filter==="All"||(filter==="Wins"&&t.pnl>0)||(filter==="Losses"&&t.pnl<0);
    return s&&f;
  }),[trades,search,filter]);
  const inp = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:"0.6rem 1rem 0.6rem 2.5rem", color:C.text, fontSize:14, outline:"none", fontFamily:"inherit", width:240 };
  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Trade History</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>All your logged trades.</p>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ position:"relative" }}>
          <Search size={14} color={C.textSec} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}/>
          <input style={inp} placeholder="Search trades..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {["All","Wins","Losses"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"0.6rem 1rem", borderRadius:9, border:`1px solid ${filter===f?C.red:C.border}`, background:filter===f?C.redSoft:"transparent", color:filter===f?C.red:C.textSec, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>{f}</button>
        ))}
        <div style={{ marginLeft:"auto", fontSize:13, color:C.textSec, alignSelf:"center" }}>{filtered.length} trade{filtered.length!==1?"s":""}</div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"90px 100px 60px 100px 100px 90px 1fr 80px 50px", padding:"0.75rem 1rem", borderBottom:`1px solid ${C.border}`, fontSize:11, color:C.textSec, fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase" }}>
          <span>Date</span><span>Asset</span><span>Dir</span><span>Entry</span><span>Exit</span><span>Qty</span><span>Strategy</span><span style={{ textAlign:"right" }}>P&L</span><span></span>
        </div>
        {filtered.length===0 ? <div style={{ padding:"3rem", textAlign:"center", color:C.textSec, fontSize:14 }}>No trades found.</div>
        : filtered.map((t,i)=>(
          <div key={t.id} style={{ display:"grid", gridTemplateColumns:"90px 100px 60px 100px 100px 90px 1fr 80px 50px", padding:"0.85rem 1rem", borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none", alignItems:"center", background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
            <span style={{ fontSize:12, color:C.textSec }}>{t.date}</span>
            <span style={{ fontSize:14, fontWeight:600, color:C.text }}>{t.asset}</span>
            <span style={{ fontSize:11, fontWeight:700, padding:"0.15rem 0.5rem", borderRadius:5, background:t.type==="Long"?C.greenSoft:C.redSoft, color:t.type==="Long"?C.green:C.red, display:"inline-block" }}>{t.type}</span>
            <span style={{ fontSize:13, fontFamily:"monospace", color:C.textSec }}>₹{t.entry?.toLocaleString("en-IN")}</span>
            <span style={{ fontSize:13, fontFamily:"monospace", color:C.textSec }}>₹{t.exit?.toLocaleString("en-IN")}</span>
            <span style={{ fontSize:13, color:C.textSec }}>{t.qty}</span>
            <span style={{ fontSize:12, color:C.textSec }}>{t.strategy}</span>
            <span style={{ fontSize:14, fontWeight:700, fontFamily:"monospace", color:t.pnl>=0?C.green:C.red, textAlign:"right" }}>{t.pnl>=0?"+":""}{currSym||"$"}{Math.abs(convertPnl?convertPnl(t.pnl,t.currency||"USD"):t.pnl).toLocaleString()}</span>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <button onClick={()=>onDelete(t.id)} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.textSec, padding:4, borderRadius:6 }}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ANALYTICS
═══════════════════════════════════════ */
function AnalyticsView({ trades, convertPnl, currSym }) {
  const stats = useMemo(()=>{
    if(!trades.length) return null;
    const cp = (t) => convertPnl ? convertPnl(t.pnl, t.currency||"USD") : t.pnl;
    const converted = trades.map(t=>({...t, cpnl: cp(t)}));
    const wins=converted.filter(t=>t.cpnl>0), losses=converted.filter(t=>t.cpnl<0);
    const totalPnl=converted.reduce((a,t)=>a+t.cpnl,0);
    const winRate=Math.round((wins.length/trades.length)*100);
    const avgWin=wins.length?Math.round(wins.reduce((a,t)=>a+t.cpnl,0)/wins.length):0;
    const avgLoss=losses.length?Math.round(losses.reduce((a,t)=>a+t.cpnl,0)/losses.length):0;
    const profitFactor=avgLoss!==0?Math.abs(+(avgWin/avgLoss).toFixed(2)):"∞";
    const best=converted.reduce((b,t)=>t.cpnl>b.cpnl?t:b,converted[0]);
    const worst=converted.reduce((w,t)=>t.cpnl<w.cpnl?t:w,converted[0]);
    const byStrategy={};
    converted.forEach(t=>{ if(!byStrategy[t.strategy])byStrategy[t.strategy]={pnl:0,count:0}; byStrategy[t.strategy].pnl+=t.cpnl; byStrategy[t.strategy].count+=1; });
    const stratData=Object.entries(byStrategy).map(([name,v])=>({name,pnl:+v.pnl.toFixed(2),count:v.count})).sort((a,b)=>b.pnl-a.pnl);
    const byMonth={};
    converted.forEach(t=>{ const m=t.date.slice(0,7); if(!byMonth[m])byMonth[m]=0; byMonth[m]+=t.cpnl; });
    const monthData=Object.entries(byMonth).map(([month,pnl])=>({month:month.slice(5),pnl:Math.round(pnl)}));
    const wlPie=[{name:"Wins",value:wins.length},{name:"Losses",value:losses.length}];
    return { winRate,avgWin,avgLoss,totalPnl,profitFactor,best,worst,stratData,monthData,wlPie };
  },[trades, convertPnl]);

  if(!stats) return <div style={{ padding:"2rem", color:C.textSec, fontFamily:"sans-serif" }}>Log some trades to see analytics.</div>;

  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Analytics</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>Deep insights into your trading performance.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
        {[{ label:"Win Rate",value:`${stats.winRate}%`,color:stats.winRate>=50?C.green:C.red },{ label:"Avg Win",value:`+${currSym||"$"}${stats.avgWin.toLocaleString()}`,color:C.green },{ label:"Avg Loss",value:`-${currSym||"$"}${Math.abs(stats.avgLoss).toLocaleString()}`,color:C.red },{ label:"Profit Factor",value:stats.profitFactor,color:C.amber }].map(m=>(
          <div key={m.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"1rem 1.2rem" }}>
            <div style={{ fontSize:11, color:C.textSec, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{m.label}</div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:"monospace", color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem" }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:16 }}>Monthly P&L</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.monthData}>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:C.textSec }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:C.textSec }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`}/>
              <Tooltip formatter={v=>[`${v>=0?"+":""}${currSym||"$"}${Math.abs(v).toLocaleString()}`,"P&L"]}/>
              <Bar dataKey="pnl" radius={[4,4,0,0]}>
                {stats.monthData.map((m,i)=><Cell key={i} fill={m.pnl>=0?C.green:C.red} opacity={0.85}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem" }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:8 }}>Win / Loss Ratio</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={stats.wlPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                <Cell fill={C.green} opacity={0.85}/><Cell fill={C.red} opacity={0.85}/>
              </Pie>
              <Tooltip formatter={(v,n)=>[v+" trades",n]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:4 }}>
            {stats.wlPie.map((d,i)=>(
              <div key={d.name} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:i===0?C.green:C.red }}/>
                <span style={{ fontSize:12, color:C.textSec }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem", marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:16 }}>P&L by Strategy</div>
        {stats.stratData.map(s=>{
          const max=Math.max(...stats.stratData.map(x=>Math.abs(x.pnl)));
          const pct=Math.round((Math.abs(s.pnl)/max)*100);
          return (
            <div key={s.name} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:13, color:C.text }}>{s.name} <span style={{ color:C.textSec }}>({s.count})</span></span>
                <span style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:s.pnl>=0?C.green:C.red }}>{s.pnl>=0?"+":""}{currSym||"$"}{Math.abs(s.pnl).toLocaleString()}</span>
              </div>
              <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:s.pnl>=0?C.green:C.red, borderRadius:3, opacity:0.8 }}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {[{ label:"🏆 Best Trade",trade:stats.best,color:C.green },{ label:"📉 Worst Trade",trade:stats.worst,color:C.red }].map(({label,trade,color})=>(
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.25rem" }}>
            <div style={{ fontSize:13, color:C.textSec, marginBottom:10 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:"monospace", color, marginBottom:8 }}>{trade.cpnl>=0?"+":""}{currSym||"$"}{Math.abs(trade.cpnl||trade.pnl).toLocaleString()}</div>
            <div style={{ fontSize:13, color:C.textSec }}>{trade.asset} · {trade.date}</div>
            <div style={{ fontSize:12, color:C.textSec, marginTop:4, fontStyle:"italic" }}>{trade.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   BACKTESTING VIEW
═══════════════════════════════════════ */
function BacktestingView({ trades, convertPnl, currSym }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });

  const cp = (t) => convertPnl ? convertPnl(t.pnl, t.currency||"USD") : t.pnl;

  // ── CALENDAR DATA ──
  const calendarData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${selectedMonth}-${String(d).padStart(2,"0")}`;
      days[key] = { pnl:0, count:0 };
    }
    trades.forEach(t => {
      if (t.date && t.date.startsWith(selectedMonth)) {
        if (days[t.date]) {
          days[t.date].pnl += cp(t);
          days[t.date].count += 1;
        }
      }
    });
    return days;
  }, [trades, selectedMonth, convertPnl]);

  // ── STRATEGY REPORT CARD ──
  const strategyStats = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.strategy) return;
      if (!map[t.strategy]) map[t.strategy] = { wins:0, losses:0, pnl:0, count:0 };
      const cpnl = cp(t);
      map[t.strategy].pnl += cpnl;
      map[t.strategy].count += 1;
      if (cpnl > 0) map[t.strategy].wins += 1;
      else map[t.strategy].losses += 1;
    });
    return Object.entries(map).map(([name, s]) => {
      const winRate = s.count ? Math.round((s.wins/s.count)*100) : 0;
      const grade = winRate >= 70 ? "A+" : winRate >= 60 ? "A" : winRate >= 50 ? "B" : winRate >= 40 ? "C" : "D";
      const gradeColor = winRate >= 70 ? C.green : winRate >= 60 ? "#4a9eff" : winRate >= 50 ? C.amber : winRate >= 40 ? "#f97316" : C.red;
      return { name, ...s, winRate, grade, gradeColor, pnl: +s.pnl.toFixed(2) };
    }).sort((a,b) => b.winRate - a.winRate);
  }, [trades, convertPnl]);

  // ── AUTO INSIGHTS ──
  const insights = useMemo(() => {
    if (!trades.length) return [];
    const list = [];
    const converted = trades.map(t=>({...t, cpnl: cp(t)}));

    // Best direction
    const longs = converted.filter(t=>t.type==="Long");
    const shorts = converted.filter(t=>t.type==="Short");
    const longWR = longs.length ? Math.round((longs.filter(t=>t.cpnl>0).length/longs.length)*100) : 0;
    const shortWR = shorts.length ? Math.round((shorts.filter(t=>t.cpnl>0).length/shorts.length)*100) : 0;
    if (longs.length && shorts.length) {
      if (longWR > shortWR) list.push({ icon:"📈", text:`You win ${longWR}% on Long trades vs ${shortWR}% on Short trades`, color: C.green });
      else list.push({ icon:"📉", text:`You win ${shortWR}% on Short trades vs ${longWR}% on Long trades`, color: C.green });
    }

    // Best strategy
    if (strategyStats.length) {
      const best = strategyStats[0];
      list.push({ icon:"🏆", text:`Your best strategy is ${best.name} with ${best.winRate}% win rate`, color: C.amber });
      if (strategyStats.length > 1) {
        const worst = strategyStats[strategyStats.length-1];
        list.push({ icon:"⚠️", text:`Your weakest strategy is ${worst.name} with only ${worst.winRate}% win rate`, color: C.red });
      }
    }

    // Best day of week
    const byDay = {0:{n:"Sunday",w:0,t:0},1:{n:"Monday",w:0,t:0},2:{n:"Tuesday",w:0,t:0},3:{n:"Wednesday",w:0,t:0},4:{n:"Thursday",w:0,t:0},5:{n:"Friday",w:0,t:0},6:{n:"Saturday",w:0,t:0}};
    converted.forEach(t => {
      if (!t.date) return;
      const day = new Date(t.date).getDay();
      byDay[day].t += 1;
      if (t.cpnl > 0) byDay[day].w += 1;
    });
    const activeDays = Object.values(byDay).filter(d=>d.t>=2);
    if (activeDays.length) {
      const bestDay = activeDays.reduce((a,b)=>(b.w/b.t)>(a.w/a.t)?b:a);
      const worstDay = activeDays.reduce((a,b)=>(b.w/b.t)<(a.w/a.t)?b:a);
      list.push({ icon:"📅", text:`${bestDay.n} is your most profitable day (${Math.round(bestDay.w/bestDay.t*100)}% win rate)`, color: C.green });
      if (bestDay.n !== worstDay.n) list.push({ icon:"😬", text:`${worstDay.n} is your worst day (${Math.round(worstDay.w/worstDay.t*100)}% win rate)`, color: C.red });
    }

    // Risk reward
    const wins = converted.filter(t=>t.cpnl>0);
    const losses = converted.filter(t=>t.cpnl<0);
    if (wins.length && losses.length) {
      const avgWin = wins.reduce((a,t)=>a+t.cpnl,0)/wins.length;
      const avgLoss = Math.abs(losses.reduce((a,t)=>a+t.cpnl,0)/losses.length);
      const rr = +(avgWin/avgLoss).toFixed(2);
      const rrColor = rr >= 2 ? C.green : rr >= 1 ? C.amber : C.red;
      list.push({ icon:"⚖️", text:`Your average winner is ${rr}x your average loser`, color: rrColor });
    }

    // Total trades insight
    const totalPnl = converted.reduce((a,t)=>a+t.cpnl,0);
    list.push({ icon:"💰", text:`Total P&L across ${trades.length} trades: ${totalPnl>=0?"+":""}${currSym||"$"}${Math.abs(totalPnl).toLocaleString()}`, color: totalPnl>=0?C.green:C.red });

    return list;
  }, [trades, strategyStats, convertPnl, currSym]);

  // ── GET MONTHS FOR SELECTOR ──
  const months = useMemo(() => {
    const set = new Set(trades.map(t=>t.date?.slice(0,7)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [trades]);

  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month-1, 1).getDay();

  const monthNames = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Backtesting</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>Analyse your trade history. Find your patterns. Improve your edge.</p>
      </div>

      {trades.length === 0 ? (
        <div style={{ textAlign:"center", color:C.textSec, fontSize:14, padding:"4rem" }}>
          No trades logged yet. Start logging trades to see your backtesting insights!
        </div>
      ) : (
        <>
          {/* ── CALENDAR HEATMAP ── */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
              <div style={{ fontSize:14, fontWeight:600, color:C.text }}>📅 Calendar Heatmap</div>
              <select style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"0.4rem 0.75rem", color:C.text, fontSize:13, outline:"none", fontFamily:"inherit", cursor:"pointer" }}
                value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}>
                {months.map(m=>(
                  <option key={m} value={m}>{monthNames[parseInt(m.split("-")[1])]} {m.split("-")[0]}</option>
                ))}
              </select>
            </div>

            {/* Day labels */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
                <div key={d} style={{ textAlign:"center", fontSize:11, color:C.textSec, fontWeight:600 }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {Array.from({length: firstDayOfWeek}).map((_,i)=>(
                <div key={`empty-${i}`} />
              ))}
              {Array.from({length: daysInMonth}).map((_,i)=>{
                const day = i+1;
                const key = `${selectedMonth}-${String(day).padStart(2,"0")}`;
                const data = calendarData[key];
                const hasTrades = data && data.count > 0;
                const isProfit = hasTrades && data.pnl >= 0;
                return (
                  <div key={day} title={hasTrades ? `${data.count} trade(s) | P&L: ${isProfit?"+":""}${currSym||"$"}${Math.abs(data.pnl).toLocaleString()}` : "No trades"} style={{
                    aspectRatio:"1", borderRadius:6, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                    background: !hasTrades ? C.surface : isProfit ? "rgba(31,208,122,0.2)" : "rgba(230,57,70,0.2)",
                    border: `1px solid ${!hasTrades ? C.border : isProfit ? "rgba(31,208,122,0.4)" : "rgba(230,57,70,0.4)"}`,
                    cursor: hasTrades ? "pointer" : "default"
                  }}>
                    <span style={{ fontSize:11, color: !hasTrades ? C.textSec : isProfit ? C.green : C.red, fontWeight:600 }}>{day}</span>
                    {hasTrades && <span style={{ fontSize:9, color: isProfit ? C.green : C.red }}>
                      {isProfit?"+":"-"}{currSym||"$"}{Math.abs(Math.round(data.pnl))}
                    </span>}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:16, marginTop:12, justifyContent:"flex-end" }}>
              {[["🟢","Profitable day"],["🔴","Loss day"],["⬜","No trades"]].map(([icon,label])=>(
                <div key={label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.textSec }}>
                  <span>{icon}</span>{label}
                </div>
              ))}
            </div>
          </div>

          {/* ── STRATEGY REPORT CARD ── */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem", marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:16 }}>📊 Strategy Report Card</div>
            {strategyStats.length === 0 ? (
              <div style={{ color:C.textSec, fontSize:13 }}>No strategy data yet.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {strategyStats.map(s => {
                  const maxPnl = Math.max(...strategyStats.map(x=>Math.abs(x.pnl)));
                  const barPct = maxPnl > 0 ? Math.round((Math.abs(s.pnl)/maxPnl)*100) : 0;
                  return (
                    <div key={s.name} style={{ background:C.cardHover, borderRadius:10, padding:"1rem 1.2rem", border:`1px solid ${C.border}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:36, height:36, borderRadius:8, background:`${s.gradeColor}20`, border:`1px solid ${s.gradeColor}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontSize:14, fontWeight:800, color:s.gradeColor }}>{s.grade}</span>
                          </div>
                          <div>
                            <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{s.name}</div>
                            <div style={{ fontSize:11, color:C.textSec }}>{s.count} trades · {s.wins}W / {s.losses}L</div>
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:15, fontWeight:700, fontFamily:"monospace", color:s.pnl>=0?C.green:C.red }}>
                            {s.pnl>=0?"+":""}{currSym||"$"}{Math.abs(s.pnl).toLocaleString()}
                          </div>
                          <div style={{ fontSize:12, color:C.textSec }}>{s.winRate}% win rate</div>
                        </div>
                      </div>
                      <div style={{ height:5, background:C.border, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${barPct}%`, background:s.pnl>=0?C.green:C.red, borderRadius:3, opacity:0.8 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── AUTO INSIGHTS ── */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem" }}>
            <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:16 }}>🔍 Auto Insights</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"0.85rem 1rem", background:C.cardHover, borderRadius:10, border:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:20 }}>{ins.icon}</span>
                  <span style={{ fontSize:14, color:ins.color, fontWeight:500 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   SETTINGS VIEW
═══════════════════════════════════════ */
function SettingsView({ displayCurrency, onCurrencyChange, rates, loadingRates }) {
  const inp = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:"0.7rem 1rem", color:C.text, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Settings</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>Customize your trading journal experience.</p>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.75rem", maxWidth:500 }}>
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>Display Currency</div>
          <div style={{ fontSize:13, color:C.textSec, marginBottom:16 }}>
            All P&L, dashboard stats and analytics will be shown in this currency using live exchange rates.
          </div>
          <div style={{ display:"flex", gap:12 }}>
            {CURRENCIES_LIST.map(c => (
              <button key={c.code} onClick={()=>onCurrencyChange(c.code)} style={{
                flex:1, padding:"1rem", borderRadius:12,
                border:`2px solid ${displayCurrency===c.code ? C.red : C.border}`,
                background: displayCurrency===c.code ? C.redSoft : "transparent",
                color: displayCurrency===c.code ? C.red : C.textSec,
                cursor:"pointer", fontFamily:"inherit", textAlign:"center",
                transition:"all 0.2s"
              }}>
                <div style={{ fontSize:24, marginBottom:4 }}>{c.symbol}</div>
                <div style={{ fontSize:13, fontWeight:700 }}>{c.code}</div>
                <div style={{ fontSize:11 }}>{c.name}</div>
              </button>
            ))}
          </div>
          {loadingRates && <div style={{ fontSize:12, color:C.amber, marginTop:10 }}>⏳ Fetching live exchange rates...</div>}
          {!loadingRates && Object.keys(rates).length > 0 && (
            <div style={{ marginTop:12, padding:"0.75rem 1rem", background:C.surface, borderRadius:9, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, color:C.textSec, marginBottom:6 }}>Live rates (base: {displayCurrency})</div>
              <div style={{ display:"flex", gap:16 }}>
                {CURRENCIES_LIST.filter(c=>c.code!==displayCurrency).map(c=>(
                  <div key={c.code} style={{ fontSize:13, color:C.text }}>
                    <span style={{ color:C.textSec }}>1 {displayCurrency} = </span>
                    <span style={{ fontWeight:700, fontFamily:"monospace" }}>{rates[c.code]?.toFixed(2)} {c.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"1.5rem" }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>About</div>
          <div style={{ fontSize:13, color:C.textSec, lineHeight:1.7 }}>
            RedRain Traders v1.0 · Built for serious traders worldwide 🌍<br/>
            Exchange rates updated daily via ExchangeRate-API.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN APP
═══════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [tab, setTab]       = useState("dashboard");
  const [user, setUser]     = useState({ name:"", id:"" });
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState(() => localStorage.getItem("rr_currency") || "USD");
  const [rates, setRates] = useState({});
  const [loadingRates, setLoadingRates] = useState(false);

  // Check if user is already logged in (session persists across page refresh)
  useEffect(()=>{
    supabase.auth.getSession().then(({ data:{ session } })=>{
      if(session){
        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Trader";
        setUser({ name, id:session.user.id });
        setScreen("app");
        loadTrades(session.user.id);
      }
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_event, session)=>{
      if(!session) { setScreen("landing"); setUser({ name:"", id:"" }); setTrades([]); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    const loadRates = async () => {
      setLoadingRates(true);
      const r = await fetchRates(displayCurrency);
      setRates(r);
      setLoadingRates(false);
    };
    loadRates();
  },[displayCurrency]);

  const handleCurrencyChange = (code) => {
    setDisplayCurrency(code);
    localStorage.setItem("rr_currency", code);
  };

  const convertPnl = (pnl, tradeCurrency) => {
    if (!tradeCurrency || tradeCurrency === displayCurrency) return pnl;
    if (!rates[tradeCurrency] || !rates[displayCurrency]) return pnl;
    const inUSD = pnl / (rates[tradeCurrency] || 1);
    return +(inUSD * (rates[displayCurrency] || 1)).toFixed(2);
  };

  const currSym = CURRENCIES_LIST.find(c=>c.code===displayCurrency)?.symbol || "$";

  const loadTrades = async (userId) => {
    setLoading(true);
    const { data } = await supabase.from("trades").select("*").eq("user_id",userId).order("date",{ ascending:false });
    if(data) setTrades(data);
    setLoading(false);
  };

  const handleLogin = (name, id) => {
    setUser({ name, id });
    setScreen("app");
    loadTrades(id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setScreen("landing");
    setUser({ name:"", id:"" });
    setTrades([]);
  };

  const addTrade = (t) => setTrades(prev=>[t,...prev]);

  const deleteTrade = async (id) => {
    await supabase.from("trades").delete().eq("id",id);
    setTrades(prev=>prev.filter(t=>t.id!==id));
  };

  if(screen==="landing") return <LandingPage onGetStarted={()=>setScreen("auth")}/>;
  if(screen==="auth") return <AuthPage onLogin={handleLogin} onBack={()=>setScreen("landing")}/>;

  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:"sans-serif", overflow:"hidden" }}>
      <Sidebar active={tab} setActive={setTab} userName={user.name} onLogout={handleLogout} isOpen={sidebarOpen} onToggle={()=>setSidebarOpen(v=>!v)}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"0.85rem 2rem", borderBottom:`1px solid ${C.border}`, background:C.surface, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, color:C.textSec }}>
            {{dashboard:"Overview",add:"New Trade",history:"All Trades",analytics:"Performance",backtesting:"Backtesting",settings:"Settings"}[tab]}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:C.redSoft, border:`1px solid ${C.redBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.red }}>
              {(user.name||"T")[0].toUpperCase()}
            </div>
            <span style={{ fontSize:13, color:C.text }}>{user.name||"Trader"}</span>
          </div>
        </div>
        <div style={{ flex:1, overflow:"hidden", display:"flex" }}>
          {loading ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:C.textSec, fontSize:14 }}>Loading your trades...</div>
          ) : (
            <>
              {tab==="dashboard"    && <DashboardView trades={trades} setActive={setTab} userName={user.name||"Trader"} convertPnl={convertPnl} currSym={currSym}/>}
              {tab==="add"          && <AddTradeView onAdd={addTrade} userId={user.id}/>}
              {tab==="history"      && <HistoryView trades={trades} onDelete={deleteTrade} convertPnl={convertPnl} currSym={currSym}/>}
              {tab==="analytics"    && <AnalyticsView trades={trades} convertPnl={convertPnl} currSym={currSym}/>}
              {tab==="backtesting"  && <BacktestingView trades={trades} convertPnl={convertPnl} currSym={currSym}/>}
              {tab==="settings"     && <SettingsView displayCurrency={displayCurrency} onCurrencyChange={handleCurrencyChange} rates={rates} loadingRates={loadingRates}/>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
