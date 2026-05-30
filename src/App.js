import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import {
  TrendingUp, TrendingDown, Plus, LogOut, BarChart2, BookOpen,
  Home, Eye, EyeOff, ArrowUpRight, ArrowDownRight, Target,
  Check, Trash2, Search, ChevronRight, Users, Shield, Zap
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
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");

  const inp = {
    background:C.surface, border:`1px solid ${C.border}`, borderRadius:9,
    padding:"0.7rem 1rem", color:C.text, fontSize:14, outline:"none",
    width:"100%", boxSizing:"border-box", fontFamily:"inherit"
  };
  const lbl = { fontSize:13, color:C.textSec, marginBottom:6, display:"block" };

  const handleSubmit = async () => {
    setError(""); setMessage(""); setLoading(true);
    try {
      if (isLogin) {
        // ── SIGN IN ──
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        const displayName = data.user.user_metadata?.full_name || email.split("@")[0];
        onLogin(displayName, data.user.id);
      } else {
        // ── SIGN UP ──
        const { data, error } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setMessage("✅ Check your email to confirm your account, then log in!");
          setIsLogin(true);
        } else if (data.session) {
          onLogin(name || email.split("@")[0], data.user.id);
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: window.location.origin } });
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", padding:"2rem" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.5rem" }}><Logo size="lg" /></div>
          <h2 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.4rem" }}>
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ color:C.textSec, fontSize:14 }}>
            {isLogin ? "Log in to your trade journal" : "Start journaling your trades today"}
          </p>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"2rem" }}>

          {/* GOOGLE LOGIN */}
          <button onClick={handleGoogle} style={{
            width:"100%", padding:"0.75rem", background:C.surface,
            border:`1px solid ${C.border}`, borderRadius:9, color:C.text,
            fontWeight:600, cursor:"pointer", fontSize:14, fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:16
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ fontSize:12, color:C.textSec }}>or with email</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          {/* ERRORS & MESSAGES */}
          {error && (
            <div style={{ background:"rgba(230,57,70,0.1)", border:`1px solid ${C.redBorder}`, borderRadius:8, padding:"0.7rem 1rem", marginBottom:16, fontSize:13, color:C.red }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background:C.greenSoft, border:"1px solid rgba(31,208,122,0.3)", borderRadius:8, padding:"0.7rem 1rem", marginBottom:16, fontSize:13, color:C.green }}>
              {message}
            </div>
          )}

          {!isLogin && (
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Full Name</label>
              <input style={inp} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={lbl}>Password</label>
            <div style={{ position:"relative" }}>
              <input style={{ ...inp, paddingRight:44 }} type={showPass?"text":"password"} placeholder="min. 6 characters"
                value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              <button onClick={() => setShowPass(v => !v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.textSec }}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            width:"100%", background: loading ? "#333" : C.red, color:"#fff", border:"none",
            borderRadius:9, padding:"0.8rem", fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
            fontSize:15, fontFamily:"inherit"
          }}>
            {loading ? "Please wait..." : isLogin ? "Login to Dashboard →" : "Create Account →"}
          </button>

          <div style={{ textAlign:"center", marginTop:"1.25rem" }}>
            <span style={{ fontSize:13, color:C.textSec }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <span onClick={() => { setIsLogin(v=>!v); setError(""); setMessage(""); }}
              style={{ fontSize:13, color:C.red, cursor:"pointer", fontWeight:600 }}>
              {isLogin ? "Sign up free" : "Log in"}
            </span>
          </div>
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
function Sidebar({ active, setActive, onLogout, userName }) {
  const NAV = [
    { id:"dashboard", icon:Home,      label:"Dashboard"     },
    { id:"add",       icon:Plus,      label:"Log Trade"     },
    { id:"history",   icon:BookOpen,  label:"Trade History" },
    { id:"analytics", icon:BarChart2, label:"Analytics"     },
  ];
  return (
    <div style={{ width:220, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"1.25rem 0.75rem", fontFamily:"sans-serif" }}>
      <div style={{ padding:"0 0.5rem 1.5rem", borderBottom:`1px solid ${C.border}`, marginBottom:"1rem" }}><Logo size="sm"/></div>
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
  );
}

const STRATEGIES = ["Trend Follow","Reversal","Breakout","Scalp","Earnings Play","Swing","Other"];
const ASSETS = ["NIFTY","BANKNIFTY","RELIANCE","INFY","TCS","HDFC","WIPRO","ONGC","SBIN","ICICIBANK","Other"];

/* ═══════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════ */
function DashboardView({ trades, setActive, userName }) {
  const stats = useMemo(() => {
    const wins = trades.filter(t=>t.pnl>0), losses = trades.filter(t=>t.pnl<0);
    const totalPnl = trades.reduce((a,t)=>a+t.pnl,0);
    const winRate = trades.length ? Math.round((wins.length/trades.length)*100) : 0;
    const avgWin = wins.length ? Math.round(wins.reduce((a,t)=>a+t.pnl,0)/wins.length) : 0;
    const avgLoss = losses.length ? Math.round(losses.reduce((a,t)=>a+t.pnl,0)/losses.length) : 0;
    let running = 0;
    const equity = trades.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(t=>{ running+=t.pnl; return { date:t.date.slice(5), value:running }; });
    return { totalPnl, winRate, avgWin, avgLoss, wins:wins.length, losses:losses.length, equity };
  }, [trades]);

  const recent = trades.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.6rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Good day, {userName} 👋</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>Here's your trading performance overview.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
        <StatCard label="Total P&L" value={`${stats.totalPnl>=0?"+":""}₹${Math.abs(stats.totalPnl).toLocaleString("en-IN")}`} sub={`${trades.length} trades logged`} color={stats.totalPnl>=0?C.green:C.red} icon={stats.totalPnl>=0?TrendingUp:TrendingDown}/>
        <StatCard label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.wins}W / ${stats.losses}L`} color={stats.winRate>=50?C.green:C.red} icon={Target}/>
        <StatCard label="Avg Win" value={`+₹${stats.avgWin.toLocaleString("en-IN")}`} sub="per winning trade" color={C.green} icon={ArrowUpRight}/>
        <StatCard label="Avg Loss" value={`₹${Math.abs(stats.avgLoss).toLocaleString("en-IN")}`} sub="per losing trade" color={C.red} icon={ArrowDownRight}/>
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
              <Tooltip formatter={v=>[`₹${v.toLocaleString("en-IN")}`,"P&L"]}/>
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
            <div style={{ fontSize:15, fontWeight:700, fontFamily:"monospace", color:t.pnl>=0?C.green:C.red }}>{fmt(t.pnl)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ADD TRADE
═══════════════════════════════════════ */
function AddTradeView({ onAdd, userId }) {
  const blank = { date:"", asset:"NIFTY", type:"Long", entry:"", exit:"", qty:"", strategy:"Trend Follow", notes:"" };
  const [form, setForm] = useState(blank);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const calcPnl = () => {
    const e=parseFloat(form.entry),x=parseFloat(form.exit),q=parseFloat(form.qty);
    if(!e||!x||!q) return null;
    return Math.round(form.type==="Long"?(x-e)*q:(e-x)*q);
  };
  const pnl = calcPnl();

  const handleSubmit = async () => {
    if(!form.date||!form.entry||!form.exit||!form.qty) return;
    setSaving(true);
    const trade = { ...form, user_id:userId, entry:parseFloat(form.entry), exit:parseFloat(form.exit), qty:parseFloat(form.qty), pnl:pnl||0 };
    // Save to Supabase
    const { data, error } = await supabase.from("trades").insert([trade]).select().single();
    setSaving(false);
    if(!error && data) {
      onAdd(data);
      setSuccess(true);
      setForm(blank);
      setTimeout(()=>setSuccess(false), 3000);
    }
  };

  const inp = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:"0.7rem 1rem", color:C.text, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
  const lbl = { fontSize:13, color:C.textSec, marginBottom:6, display:"block", fontWeight:500 };
  const row = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 };

  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Log a New Trade</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>Record every detail of your trade for better analysis.</p>
      </div>
      {success && <div style={{ background:C.greenSoft, border:"1px solid rgba(31,208,122,0.3)", borderRadius:10, padding:"0.85rem 1rem", marginBottom:20, color:C.green, fontSize:14, display:"flex", alignItems:"center", gap:8 }}><Check size={16}/> Trade saved to your account! Dashboard updated.</div>}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.75rem", maxWidth:680 }}>
        <div style={row}>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={form.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><label style={lbl}>Asset</label><select style={{ ...inp, cursor:"pointer" }} value={form.asset} onChange={e=>set("asset",e.target.value)}>{ASSETS.map(a=><option key={a}>{a}</option>)}</select></div>
        </div>
        <div style={row}>
          <div>
            <label style={lbl}>Direction</label>
            <div style={{ display:"flex", gap:10 }}>
              {["Long","Short"].map(t=>(
                <button key={t} onClick={()=>set("type",t)} style={{ flex:1, padding:"0.7rem", border:`1px solid ${form.type===t?(t==="Long"?C.green:C.red):C.border}`, borderRadius:9, background:form.type===t?(t==="Long"?C.greenSoft:C.redSoft):"transparent", color:form.type===t?(t==="Long"?C.green:C.red):C.textSec, fontWeight:600, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>
                  {t==="Long"?"📈 Long":"📉 Short"}
                </button>
              ))}
            </div>
          </div>
          <div><label style={lbl}>Strategy</label><select style={{ ...inp, cursor:"pointer" }} value={form.strategy} onChange={e=>set("strategy",e.target.value)}>{STRATEGIES.map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <div style={row}>
          <div><label style={lbl}>Entry Price (₹)</label><input type="number" style={inp} placeholder="22100" value={form.entry} onChange={e=>set("entry",e.target.value)}/></div>
          <div><label style={lbl}>Exit Price (₹)</label><input type="number" style={inp} placeholder="22340" value={form.exit} onChange={e=>set("exit",e.target.value)}/></div>
        </div>
        <div style={{ marginBottom:16 }}><label style={lbl}>Quantity / Lots</label><input type="number" style={{ ...inp, maxWidth:200 }} placeholder="1" value={form.qty} onChange={e=>set("qty",e.target.value)}/></div>
        {pnl!==null && (
          <div style={{ background:pnl>=0?C.greenSoft:C.redSoft, border:`1px solid ${pnl>=0?"rgba(31,208,122,0.25)":C.redBorder}`, borderRadius:10, padding:"0.85rem 1rem", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:14, color:C.textSec }}>Estimated P&L</span>
            <span style={{ fontSize:20, fontWeight:800, fontFamily:"monospace", color:pnl>=0?C.green:C.red }}>{pnl>=0?"+":""}₹{Math.abs(pnl).toLocaleString("en-IN")}</span>
          </div>
        )}
        <div style={{ marginBottom:20 }}><label style={lbl}>Trade Notes</label><textarea style={{ ...inp, resize:"vertical", minHeight:90, lineHeight:1.6 }} placeholder="What was your reasoning? What did you learn?" value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>
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
function HistoryView({ trades, onDelete }) {
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
            <span style={{ fontSize:14, fontWeight:700, fontFamily:"monospace", color:t.pnl>=0?C.green:C.red, textAlign:"right" }}>{fmt(t.pnl)}</span>
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
function AnalyticsView({ trades }) {
  const stats = useMemo(()=>{
    if(!trades.length) return null;
    const wins=trades.filter(t=>t.pnl>0), losses=trades.filter(t=>t.pnl<0);
    const totalPnl=trades.reduce((a,t)=>a+t.pnl,0);
    const winRate=Math.round((wins.length/trades.length)*100);
    const avgWin=wins.length?Math.round(wins.reduce((a,t)=>a+t.pnl,0)/wins.length):0;
    const avgLoss=losses.length?Math.round(losses.reduce((a,t)=>a+t.pnl,0)/losses.length):0;
    const profitFactor=avgLoss!==0?Math.abs(+(avgWin/avgLoss).toFixed(2)):"∞";
    const best=trades.reduce((b,t)=>t.pnl>b.pnl?t:b,trades[0]);
    const worst=trades.reduce((w,t)=>t.pnl<w.pnl?t:w,trades[0]);
    const byStrategy={};
    trades.forEach(t=>{ if(!byStrategy[t.strategy])byStrategy[t.strategy]={pnl:0,count:0}; byStrategy[t.strategy].pnl+=t.pnl; byStrategy[t.strategy].count+=1; });
    const stratData=Object.entries(byStrategy).map(([name,v])=>({name,pnl:v.pnl,count:v.count})).sort((a,b)=>b.pnl-a.pnl);
    const byMonth={};
    trades.forEach(t=>{ const m=t.date.slice(0,7); if(!byMonth[m])byMonth[m]=0; byMonth[m]+=t.pnl; });
    const monthData=Object.entries(byMonth).map(([month,pnl])=>({month:month.slice(5),pnl:Math.round(pnl)}));
    const wlPie=[{name:"Wins",value:wins.length},{name:"Losses",value:losses.length}];
    return { winRate,avgWin,avgLoss,totalPnl,profitFactor,best,worst,stratData,monthData,wlPie };
  },[trades]);

  if(!stats) return <div style={{ padding:"2rem", color:C.textSec, fontFamily:"sans-serif" }}>Log some trades to see analytics.</div>;

  return (
    <div style={{ padding:"2rem", fontFamily:"sans-serif", overflowY:"auto", flex:1 }}>
      <div style={{ marginBottom:"1.75rem" }}>
        <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, margin:"0 0 0.25rem" }}>Analytics</h1>
        <p style={{ color:C.textSec, fontSize:14, margin:0 }}>Deep insights into your trading performance.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
        {[{ label:"Win Rate",value:`${stats.winRate}%`,color:stats.winRate>=50?C.green:C.red },{ label:"Avg Win",value:`+₹${stats.avgWin.toLocaleString("en-IN")}`,color:C.green },{ label:"Avg Loss",value:`-₹${Math.abs(stats.avgLoss).toLocaleString("en-IN")}`,color:C.red },{ label:"Profit Factor",value:stats.profitFactor,color:C.amber }].map(m=>(
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
              <Tooltip formatter={v=>[`${v>=0?"+":""}₹${Math.abs(v).toLocaleString("en-IN")}`,"P&L"]}/>
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
                <span style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:s.pnl>=0?C.green:C.red }}>{s.pnl>=0?"+":""}₹{Math.abs(s.pnl).toLocaleString("en-IN")}</span>
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
            <div style={{ fontSize:22, fontWeight:800, fontFamily:"monospace", color, marginBottom:8 }}>{trade.pnl>=0?"+":""}₹{Math.abs(trade.pnl).toLocaleString("en-IN")}</div>
            <div style={{ fontSize:13, color:C.textSec }}>{trade.asset} · {trade.date}</div>
            <div style={{ fontSize:12, color:C.textSec, marginTop:4, fontStyle:"italic" }}>{trade.notes}</div>
          </div>
        ))}
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
      <Sidebar active={tab} setActive={setTab} userName={user.name} onLogout={handleLogout}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"0.85rem 2rem", borderBottom:`1px solid ${C.border}`, background:C.surface, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, color:C.textSec }}>
            {{dashboard:"Overview",add:"New Trade",history:"All Trades",analytics:"Performance"}[tab]}
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
              {tab==="dashboard"  && <DashboardView trades={trades} setActive={setTab} userName={user.name||"Trader"}/>}
              {tab==="add"        && <AddTradeView onAdd={addTrade} userId={user.id}/>}
              {tab==="history"    && <HistoryView trades={trades} onDelete={deleteTrade}/>}
              {tab==="analytics"  && <AnalyticsView trades={trades}/>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
