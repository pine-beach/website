"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Menu,
  X,
  Layers,
  CodeXml,
  Activity,
  Cpu,
  Compass,
  GitBranch,
  Check,
} from "lucide-react";

type SectionName = "work" | "studio" | "capabilities" | "contact";

interface Cell {
  rx: number;
  ry: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const EMAIL = "jake@pinebeach.com.au";

export default function PineBeachSite() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hudRef = useRef<HTMLSpanElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  // Liquid Lens environment exposed to React handlers (impulse + live dimensions).
  const lens = useRef<{
    impulse: (x: number, y: number, strength: number) => void;
    W: number;
    H: number;
  }>({ impulse: () => {}, W: 0, H: 0 });

  const [activeSection, setActiveSection] = useState<SectionName | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [staggerIn, setStaggerIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutTab, setAboutTab] = useState(0); // 0 Studio · 1 Principles · 2 Founder

  const [form, setForm] = useState({ name: "", email: "", company: "", brief: "" });
  const [errors, setErrors] = useState({ name: false, email: false, brief: false });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  /* ---------------- Liquid Lens (persistent) ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // ?still — paint a single deterministic initial frame and don't animate.
    // Useful for capturing exact hero stills (load-video end frame, OG images).
    const still = new URLSearchParams(window.location.search).has("still");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0,
      H = 0,
      cols = 0,
      rows = 0;
    const GS = 26;
    let cells: Cell[] = [];
    let t = 0;
    const mouse = { x: -9999, y: -9999 };
    const blob = { x: -9999, y: -9999 };
    let orbit = 0;
    let raf = 0;
    let lastMoveAt = 0;
    const IDLE_RESUME_MS = 1500; // hand control back to auto-orbit after this much pointer stillness
    // On release we ease from the stopped position into the orbit path: the
    // target = orbit point + a decaying offset that starts at (blob − orbit
    // point), so the field never snaps to a far-away phase.
    let wasControlled = false;
    let resumeOffX = 0,
      resumeOffY = 0;
    const RESUME_DECAY = 0.965; // per-frame easing of the offset toward 0 (~1.3s)
    // Lens influence — smaller + gentler on mobile so the orbit is subtler.
    let LENS_R = 150;
    let LENS_PULL = 7;

    // ---- first-load Bloom intro: dot-field blooms, then morphs into the orbit ----
    const playIntro =
      document.documentElement.classList.contains("pb-intro") && !reduce && !still;
    let bloom = playIntro; // intro choreography running
    let introT = 0;
    const introStart = performance.now();
    let fade = bloom ? 0 : 1; // global dot opacity (fades in from black)
    let orbitActive = !bloom; // orbit suppressed during the bloom
    let orbitReleased = !bloom; // lens still pinned to centre until released
    let blobMix = bloom ? 0 : 1; // strength of the orbit lens
    let bloomRip = 0; // current ripple amplitude
    let handover = false,
      released = false,
      revealed = false;
    const introTimers: number[] = [];
    const sm = (x: number) => {
      x = x < 0 ? 0 : x > 1 ? 1 : x;
      return x * x * (3 - 2 * x);
    };
    const rampUp = (tt: number, a: number, b: number) => sm((tt - a) / (b - a));
    const bandE = (tt: number, a: number, b: number, c: number, d: number) =>
      sm((tt - a) / (b - a)) * (1 - sm((tt - c) / (d - c)));
    function revealHero() {
      const add = (sel: string, ms: number) => {
        const el = document.querySelector(sel);
        if (el) introTimers.push(window.setTimeout(() => el.classList.add("pb-in"), ms));
      };
      add(".bar", 0);
      add(".rail", 0);
      add(".hero .eyebrow", 250);
      document.querySelectorAll<HTMLElement>(".hero h1 .ln").forEach((l, i) => {
        introTimers.push(window.setTimeout(() => l.classList.add("pb-in"), 480 + i * 200));
      });
      add(".hero .lead", 1250);
      add(".hero .cta", 1500);
    }
    function driveIntro(tt: number) {
      fade = rampUp(tt, 0, 1.0);
      bloomRip = 24 * bandE(tt, 0.7, 1.9, 2.6, 3.2);
      // the lens is born at the exact centre, holds, then eases onto its orbit
      if (!handover && tt >= 3.2) {
        handover = true;
        orbitActive = true;
        orbitReleased = false;
        blob.x = W / 2;
        blob.y = H / 2;
      }
      blobMix = rampUp(tt, 3.2, 3.7);
      if (!released && tt >= 3.9) {
        released = true;
        orbitReleased = true;
        orbit = 0;
        resumeOffX = blob.x - (W / 2 + W * 0.26);
        resumeOffY = blob.y - H / 2;
        wasControlled = false;
      }
      if (!revealed && tt >= 3.9) {
        revealed = true;
        revealHero();
      }
      if (tt > 5.2) bloom = false;
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      const mobile = W <= 560;
      LENS_R = mobile ? 95 : 150; // tighter lens on mobile
      LENS_PULL = mobile ? 4.5 : 7; // gentler push on mobile
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(W / GS);
      rows = Math.floor(H / GS);
      const ox = (W - (cols - 1) * GS) / 2,
        oy = (H - (rows - 1) * GS) / 2;
      cells = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const rx = ox + c * GS,
            ry = oy + r * GS;
          cells.push({ rx, ry, x: rx, y: ry, vx: 0, vy: 0 });
        }
      lens.current.W = W;
      lens.current.H = H;
    }

    /* radial liquid burst from a point — used on section open/close */
    function impulse(px: number, py: number, strength: number) {
      for (let i = 0; i < cells.length; i++) {
        const p = cells[i],
          dx = p.x - px,
          dy = p.y - py,
          d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / (Math.max(W, H) * 0.6));
        const k = (strength * f * f) / d;
        p.vx += dx * k;
        p.vy += dy * k;
      }
    }
    lens.current.impulse = impulse;

    function frame(now: number) {
      if (W === 0 || canvas!.width === 0) resize();
      t += 0.016;
      if (bloom) {
        introT = (now - introStart) / 1000;
        driveIntro(introT);
      }
      // ---- orbit lens (only once active) ----
      if (orbitActive) {
        if (orbitReleased) {
          orbit += 0.01;
          const controlled =
            mouse.x > -999 && performance.now() - lastMoveAt <= IDLE_RESUME_MS;
          const orbitX = W / 2 + Math.cos(orbit) * W * 0.26;
          const orbitY = H / 2 + Math.sin(orbit * 1.3) * H * 0.32;
          let tx: number, ty: number;
          if (controlled) {
            tx = mouse.x;
            ty = mouse.y;
            wasControlled = true;
          } else {
            if (wasControlled) {
              resumeOffX = blob.x - orbitX;
              resumeOffY = blob.y - orbitY;
              wasControlled = false;
            }
            resumeOffX *= RESUME_DECAY;
            resumeOffY *= RESUME_DECAY;
            tx = orbitX + resumeOffX;
            ty = orbitY + resumeOffY;
          }
          if (blob.x < -999) {
            blob.x = tx;
            blob.y = ty;
          }
          blob.x += (tx - blob.x) * 0.11;
          blob.y += (ty - blob.y) * 0.11;
        } else {
          // hold the lens at the exact centre while it fades in
          blob.x += (W / 2 - blob.x) * 0.12;
          blob.y += (H / 2 - blob.y) * 0.12;
        }
      }
      ctx!.clearRect(0, 0, W, H);
      for (let i = 0; i < cells.length; i++) {
        const p = cells[i];
        // bloom ripple offset (radial concentric waves from centre)
        let offx = 0,
          offy = 0;
        if (bloom && bloomRip > 0.001) {
          const dx0 = p.rx - W / 2,
            dy0 = p.ry - H / 2,
            dd = Math.hypot(dx0, dy0) || 1;
          const rad = Math.sin(dd * 0.028 - introT * 2.1) * bloomRip;
          offx = (dx0 / dd) * rad;
          offy = (dy0 / dd) * rad;
        }
        const tx2 = p.rx + offx,
          ty2 = p.ry + offy;
        let fx = 0,
          fy = 0;
        if (blobMix > 0) {
          const dx = p.rx - blob.x,
            dy = p.ry - blob.y,
            d = Math.hypot(dx, dy) || 1;
          if (d < LENS_R) {
            const f = 1 - d / LENS_R;
            fx = (dx / d) * f * f * LENS_PULL * blobMix;
            fy = (dy / d) * f * f * LENS_PULL * blobMix;
          }
        }
        const ox = p.x - tx2,
          oy = p.y - ty2;
        p.vx += fx - ox * 0.06 - p.vx * 0.16;
        p.vy += fy - oy * 0.06 - p.vy * 0.16;
        p.x += p.vx;
        p.y += p.vy;
        const hx = p.x - p.rx,
          hy = p.y - p.ry,
          off = Math.hypot(hx, hy);
        const idle = 0.5 + 0.5 * Math.sin((p.rx + p.ry) * 0.012 + t * 1.2);
        const a = (0.05 + 0.07 * idle + Math.min(0.9, off * 0.07)) * fade;
        const sz = 1 + Math.min(3, off * 0.11);
        if (a > 0.001) {
          ctx!.fillStyle = "rgba(250,250,250," + Math.min(1, a) + ")";
          ctx!.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
        }
      }
      if (!reduce && !still) raf = requestAnimationFrame(frame);
    }

    function onMove(e: PointerEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      lastMoveAt = performance.now();
      if (hudRef.current) {
        hudRef.current.textContent =
          "x:" +
          String(Math.max(0, e.clientX | 0)).padStart(4, "0") +
          " y:" +
          String(Math.max(0, e.clientY | 0)).padStart(4, "0");
      }
    }
    // Resume auto-orbit when the pointer leaves the window, the touch is
    // lifted, or the touch is cancelled (e.g. interrupted by a system gesture).
    function onRelease() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onRelease);
    window.addEventListener("pointerup", onRelease);
    window.addEventListener("pointercancel", onRelease);
    window.addEventListener("resize", resize);
    resize();
    frame(performance.now()); // paint one frame immediately, then it self-schedules via rAF

    return () => {
      cancelAnimationFrame(raf);
      introTimers.forEach(clearTimeout);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onRelease);
      window.removeEventListener("pointerup", onRelease);
      window.removeEventListener("pointercancel", onRelease);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* replay the stagger-in whenever the active section changes */
  useEffect(() => {
    if (!activeSection) return;
    setStaggerIn(false);
    const id = requestAnimationFrame(() => setStaggerIn(true));
    return () => cancelAnimationFrame(id);
  }, [activeSection]);

  /* ---------------- Section / overlay controller ---------------- */
  function openSection(name: SectionName, x: number, y: number) {
    if (scrimRef.current) {
      scrimRef.current.style.setProperty("--ox", x + "px");
      scrimRef.current.style.setProperty("--oy", y + "px");
    }
    lens.current.impulse(x, y, 26); // liquid burst from the click
    if (name === "studio") setAboutTab(0); // always open About on the first tab
    setActiveSection(name);
    setIsOpen(true);
  }

  function closeSection() {
    setIsOpen((open) => {
      if (!open) return open;
      lens.current.impulse(lens.current.W / 2, lens.current.H / 2, 18);
      window.setTimeout(() => {
        setActiveSection(null);
        setStaggerIn(false);
      }, 700);
      return false;
    });
  }

  function openMenu() {
    if (menuOpen) return;
    lens.current.impulse(lens.current.W - 48, 46, 22);
    setMenuOpen(true);
  }
  function closeMenu() {
    setMenuOpen(false);
  }

  // Mirrors the original [data-sec] click wiring: open from the element's
  // centre, override from the menu, toggle-close only on the active nav item.
  function handleSec(
    name: SectionName,
    e: React.MouseEvent<HTMLElement>,
    canToggle = false
  ) {
    const r = e.currentTarget.getBoundingClientRect();
    let cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    if (menuOpen) {
      closeMenu();
      cx = lens.current.W / 2;
      cy = lens.current.H * 0.4;
      openSection(name, cx, cy);
      return;
    }
    if (canToggle && isOpen && activeSection === name) {
      closeSection();
      return;
    }
    openSection(name, cx, cy);
  }

  function goHome() {
    closeMenu();
    closeSection();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        closeSection();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- lead capture → mailto ---------------- */
  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const name = form.name.trim(),
      email = form.email.trim(),
      brief = form.brief.trim(),
      company = form.company.trim();
    const next = { name: !name, email: !email, brief: !brief };
    if (next.name || next.email || next.brief) {
      setErrors(next);
      return;
    }
    setErrors({ name: false, email: false, brief: false });
    setSubmitError("");
    setSubmitting(true);

    // on-brand signature ripple from the submit button outward
    try {
      const r = e.currentTarget.getBoundingClientRect();
      lens.current.impulse(r.left + r.width / 2, r.top + r.height / 2, 24);
    } catch {}

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, brief }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setSubmittedName(name.split(" ")[0]);
      setSubmittedEmail(email);
      setSubmitted(true);
      // a second, softer ripple as the success state blooms in
      lens.current.impulse(lens.current.W / 2, lens.current.H / 2, 20);
    } catch {
      setSubmitError(
        "Couldn't send just now — please email jake@pinebeach.com.au directly."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const secClass = (sec: SectionName) =>
    "ov-sec" +
    (activeSection === sec ? " show" : "") +
    (activeSection === sec && staggerIn ? " in" : "");

  const navActive = (sec: SectionName) =>
    "nav-link" + (isOpen && activeSection === sec ? " active" : "");

  return (
    <>
      <canvas id="fx" ref={canvasRef} />
      <div className="vignette" />

      {/* ===== SHELL ===== */}
      <div className="shell">
        <div className="bar pb-reveal pb-fade">
          <a className="brand" onClick={goHome}>
            <span className="mark">
              <span className="sprig" />
            </span>
            <b>Pine Beach</b>
          </a>
          <div className="nav" id="nav">
            <a className={navActive("work")} onClick={(e) => handleSec("work", e, true)}>
              <span className="n">01</span>Work
            </a>
            <a
              className={navActive("studio")}
              onClick={(e) => handleSec("studio", e, true)}
            >
              <span className="n">02</span>About
            </a>
            <a
              className={navActive("capabilities")}
              onClick={(e) => handleSec("capabilities", e, true)}
            >
              <span className="n">03</span>Capabilities
            </a>
          </div>
          <div className="bar-right">
            <button className="start" onClick={(e) => handleSec("contact", e)}>
              Start a project{" "}
              <span className="ico">
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </span>
            </button>
            <button className="menu-btn" onClick={openMenu}>
              <span className="ico">
                <Menu strokeWidth={1.5} />
              </span>
              Menu
            </button>
          </div>
        </div>

        <div className={"hero" + (isOpen ? " recede" : "")}>
          <div className="eyebrow pb-reveal">Design &amp; engineering studio</div>
          <h1>
            <span className="ln pb-reveal">Complex by nature.</span>
            <span className="ln pb-reveal">
              Elegant by design.<span className="caret" />
            </span>
          </h1>
          <p className="lead pb-reveal">
            A senior design and engineering studio for transformative products
            that don&apos;t have a blueprint.
          </p>
          <div className="cta pb-reveal">
            <button className="btn" onClick={(e) => handleSec("contact", e)}>
              Start a project{" "}
              <span className="ico">
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </span>
            </button>
            <button className="btn ghost" onClick={(e) => handleSec("work", e)}>
              See the work
            </button>
          </div>
        </div>

        <div className="rail pb-reveal pb-fade">
          <span>Sydney · est. 2019</span>
          <span className="hud" ref={hudRef}>
            x:0000 y:0000
          </span>
        </div>
      </div>

      {/* ===== MOBILE / TABLET MENU ===== */}
      <div className={"mmenu" + (menuOpen ? " open" : "")}>
        <div className="mscrim" />
        <button className="mclose" onClick={closeMenu}>
          <span className="ico">
            <X strokeWidth={1.5} />
          </span>
        </button>
        <div className="mm-inner">
          <div className="mm-eyebrow">Pine Beach · Menu</div>
          <nav className="mm-list">
            <a onClick={(e) => handleSec("work", e)}>
              <span className="n">01</span> Work
            </a>
            <a onClick={(e) => handleSec("studio", e)}>
              <span className="n">02</span> About
            </a>
            <a onClick={(e) => handleSec("capabilities", e)}>
              <span className="n">03</span> Capabilities
            </a>
          </nav>
          <div className="mm-foot">
            <button className="btn" onClick={(e) => handleSec("contact", e)}>
              Start a project{" "}
              <span className="ico">
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </span>
            </button>
            <a className="mm-mail" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <span className="mm-loc">Sydney · est. 2019</span>
          </div>
        </div>
      </div>

      {/* ===== OVERLAY ===== */}
      <div className={"overlay" + (isOpen ? " open" : "")}>
        <div className="scrim" ref={scrimRef} />
        <button className="ov-close" onClick={closeSection}>
          <span className="ico">
            <X size={18} strokeWidth={1.5} />
          </span>
        </button>
        <div className="ov-stage">
          {/* WORK */}
          <section className={secClass("work")}>
            <div className="ov-head">
              <div>
                <div className="idx">01 — Work</div>
                <h2>Selected work.</h2>
              </div>
              <div className="tag">
                Platforms, brands and products — built end-to-end.
              </div>
            </div>
            <div className="work-grid stag">
              <div className="wcard">
                <div className="wlogo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/work/collabcart.png" alt="CollabCart" />
                </div>
                <div className="wname">CollabCart</div>
                <div className="wrole">Branding · Website · Platform</div>
                <div className="wcopy">
                  Creator commerce that turns trust into revenue — personalised
                  storefronts for creators and small businesses, with no
                  inventory or setup.
                </div>
              </div>
              <div className="wcard">
                <div className="wlogo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/work/gro.svg" alt="Gro Clinics" />
                </div>
                <div className="wname">Gro Clinics</div>
                <div className="wrole">System architecture · Telehealth</div>
                <div className="wcopy">
                  Doctor-led hair restoration across Australia and New Zealand.
                  Full system architecture and a telehealth platform spanning
                  consults to scripts.
                </div>
              </div>
              <div className="wcard">
                <div className="wlogo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/work/mpd.svg" alt="My Performance Doctor" />
                </div>
                <div className="wname">My Performance Doctor</div>
                <div className="wrole">Platform</div>
                <div className="wcopy">
                  Concierge longevity and performance medicine. A platform that
                  makes advanced biomarkers legible and care genuinely
                  proactive.
                </div>
              </div>
              <div className="wcard">
                <div className="wlogo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/work/kurk.png" alt="Kurk" />
                </div>
                <div className="wname">Kurk</div>
                <div className="wrole">Website · Platform</div>
                <div className="wcopy">
                  A natural anti-inflammatory wellness brand built on
                  next-generation liquid curcumin. Storefront and commerce
                  platform.
                </div>
              </div>
              <div className="wcard">
                <div className="wlogo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/work/eyetelligence.png" alt="Eyetelligence" />
                </div>
                <div className="wname">Eyetelligence</div>
                <div className="wrole">Website</div>
                <div className="wcopy">
                  AI retinal imaging that screens for disease from a single
                  photo — since scaled internationally as Optain.
                </div>
              </div>
              <button
                className="wcard wcard-cta"
                onClick={(e) => handleSec("contact", e)}
              >
                <div className="wcta-l">Your project, next.</div>
                <div className="wcta-r">
                  Start a project{" "}
                  <span className="ico">
                    <ArrowUpRight size={15} strokeWidth={1.5} />
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* STUDIO */}
          <section className={secClass("studio")}>
            <div className="ov-head">
              <div>
                <div className="idx">02 — About</div>
                <h2>Where vision meets reality</h2>
              </div>
              <div className="tag">
                A senior studio — and the person behind it.
              </div>
            </div>

            <div className="about-tabs stag">
              <button
                className={"about-tab" + (aboutTab === 0 ? " active" : "")}
                onClick={() => setAboutTab(0)}
              >
                <span className="tn">01</span> Studio
              </button>
              <button
                className={"about-tab" + (aboutTab === 1 ? " active" : "")}
                onClick={() => setAboutTab(1)}
              >
                <span className="tn">02</span> Principles
              </button>
              <button
                className={"about-tab" + (aboutTab === 2 ? " active" : "")}
                onClick={() => setAboutTab(2)}
              >
                <span className="tn">03</span> Founder
              </button>
            </div>

            {aboutTab === 0 && (
              <div className="tab-panel panel-studio" key="studio">
                <div className="studio-lead">
                  Ideas are easy. <em>Execution is everything.</em>
                </div>
                <div className="studio-body-col">
                  <p className="studio-body">
                    Pine Beach partners with founders, startups, and
                    organisations to transform ambitious ideas into products
                    that create real-world impact.
                  </p>
                  <p className="studio-body">
                    We combine strategy, design, and engineering into a single
                    integrated practice — bringing clarity to uncertainty and
                    momentum to complex challenges.
                  </p>
                </div>
              </div>
            )}

            {aboutTab === 1 && (
              <div className="tab-panel panel-principles" key="principles">
                <div className="p">
                  <div className="pn">P/01</div>
                  <h4>Craft without compromise</h4>
                  <p className="p-lead">Every decision matters.</p>
                  <p>
                    From system architecture to typography, we pursue clarity,
                    quality, and attention to detail in everything we build.
                  </p>
                </div>
                <div className="p">
                  <div className="pn">P/02</div>
                  <h4>Embrace complexity</h4>
                  <p className="p-lead">
                    The hardest problems are often the most valuable.
                  </p>
                  <p>
                    We lean into ambiguity, navigate constraints, and create
                    elegant solutions where others see obstacles.
                  </p>
                </div>
                <div className="p">
                  <div className="pn">P/03</div>
                  <h4>First, understand</h4>
                  <p className="p-lead">Solve the problem, not the symptom.</p>
                  <p>
                    We begin with fundamentals — the people, the constraints,
                    and the underlying need. By understanding what truly
                    matters, we avoid unnecessary complexity and build only what
                    creates value.
                  </p>
                </div>
              </div>
            )}

            {aboutTab === 2 && (
              <div className="tab-panel panel-founder" key="founder">
                <div className="founder-photo-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/about/jake.jpg"
                    alt="Jake Sobel"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="founder-col">
                  <div className="jake-id">
                    <div className="nm">Jake Sobel</div>
                    <div className="role">CEO &amp; Founder</div>
                  </div>
                  <p className="founder-bio">
                    Jake Sobel builds technology that makes complex systems
                    simple and personal. Across his career he has designed
                    telehealth prescribing platforms, launched AI-powered
                    diagnostics, and scaled consumer wellness brands — work
                    spanning regulated healthcare, frontier AI and high-growth
                    commerce.
                  </p>
                  <p className="founder-bio">
                    The throughline is personalisation: platforms that connect
                    people with exactly what they need, proven at scale. That
                    conviction led him to found CollabCart, turning trusted
                    recommendations into seamless commerce.
                  </p>
                  <p className="founder-bio">
                    Pine Beach is the studio expression of the same belief —
                    that the hardest, least-defined problems deserve design and
                    engineering of the highest craft.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* CAPABILITIES */}
          <section className={secClass("capabilities")}>
            <div className="ov-head">
              <div>
                <div className="idx">03 — Capabilities</div>
                <h2>Built end-to-end.</h2>
              </div>
              <div className="tag">
                Strategy, design and engineering under one roof.
              </div>
            </div>
            <div className="cap-grid stag">
              <div className="cap">
                <span className="ci">
                  <Layers size={22} strokeWidth={1.5} />
                </span>
                <div className="cn">Product design</div>
                <div className="cd">
                  From first principles to polished experiences. We design
                  products people understand instantly and remember long after.
                </div>
              </div>
              <div className="cap">
                <span className="ci">
                  <CodeXml size={22} strokeWidth={1.5} />
                </span>
                <div className="cn">Engineering</div>
                <div className="cd">
                  Robust systems, elegant architecture, and production-grade
                  delivery. Built to scale from day one.
                </div>
              </div>
              <div className="cap">
                <span className="ci">
                  <Activity size={22} strokeWidth={1.5} />
                </span>
                <div className="cn">Motion &amp; interaction</div>
                <div className="cd">
                  Movement with purpose. The details that make products feel
                  intuitive, responsive, and alive.
                </div>
              </div>
              <div className="cap">
                <span className="ci">
                  <Cpu size={22} strokeWidth={1.5} />
                </span>
                <div className="cn">AI &amp; research</div>
                <div className="cd">
                  Emerging technologies, novel approaches, and difficult
                  problems. Exploration grounded in real-world outcomes.
                </div>
              </div>
              <div className="cap">
                <span className="ci">
                  <Compass size={22} strokeWidth={1.5} />
                </span>
                <div className="cn">Brand &amp; identity</div>
                <div className="cd">
                  Brands are systems, not logos. We create coherent identities
                  that scale across every customer touchpoint.
                </div>
              </div>
              <div className="cap">
                <span className="ci">
                  <GitBranch size={22} strokeWidth={1.5} />
                </span>
                <div className="cn">Platform &amp; infrastructure</div>
                <div className="cd">
                  The foundations behind ambitious products. Reliable,
                  observable, and engineered for long-term growth.
                </div>
              </div>
            </div>
          </section>

          {/* CONTACT / LEAD CAPTURE */}
          <section className={secClass("contact")}>
            <div className="ov-head">
              <div>
                <div className="idx">04 — Start a project</div>
                <h2>
                  Tell us it&apos;s impossible<span className="caret" />
                </h2>
              </div>
              <div className="tag">If you can describe it, we can ship it.</div>
            </div>
            <div className="contact-grid">
              <div className="contact-left stag">
                <div className="contact-pitch">
                  Send a few lines about what you&apos;re building. Jake reads
                  every enquiry and you&apos;ll hear back within two business
                  days.
                </div>
                <a className="contact-mail" href={`mailto:${EMAIL}`}>
                  {EMAIL}{" "}
                  <span className="ico">
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                  </span>
                </a>
              </div>
              {submitted ? (
                <div className="form-success" style={{ gridColumn: "span 2" }}>
                  <div className="ok">
                    <span className="ico">
                      <Check size={24} strokeWidth={1.5} />
                    </span>
                  </div>
                  <h3>Thanks, {submittedName}.</h3>
                  <p>
                    Your brief is in. Jake will be in touch at
                    <br />
                    {submittedEmail} within two business days.
                  </p>
                </div>
              ) : (
                <form className="form stag" onSubmit={submitLead} noValidate>
                  <div className="field">
                    <label>Name</label>
                    <input
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      style={
                        errors.name ? { borderColor: "rgba(220,38,38,0.6)" } : undefined
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      style={
                        errors.email ? { borderColor: "rgba(220,38,38,0.6)" } : undefined
                      }
                      required
                    />
                  </div>
                  <div className="field full">
                    <label>
                      Company <span style={{ color: "#3f3f46" }}>· optional</span>
                    </label>
                    <input
                      name="company"
                      placeholder="Company or project"
                      value={form.company}
                      onChange={(e) =>
                        setForm({ ...form, company: e.target.value })
                      }
                    />
                  </div>
                  <div className="field full">
                    <label>What are you building?</label>
                    <textarea
                      name="brief"
                      placeholder="A few lines on the project, timeline and ambition…"
                      value={form.brief}
                      onChange={(e) =>
                        setForm({ ...form, brief: e.target.value })
                      }
                      style={
                        errors.brief ? { borderColor: "rgba(220,38,38,0.6)" } : undefined
                      }
                      required
                    />
                  </div>
                  <div className="submit">
                    <span className={"note" + (submitError ? " note-error" : "")}>
                      {submitError || "We reply within 2 business days."}
                    </span>
                    <button
                      className="btn"
                      type="submit"
                      disabled={submitting}
                      aria-busy={submitting}
                    >
                      {submitting ? "Sending…" : "Start a project"}
                      {!submitting && (
                        <span className="ico">
                          <ArrowUpRight size={15} strokeWidth={1.5} />
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
