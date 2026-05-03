import { useState, useEffect, useRef } from "react";

const style = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Cantora+One&family=Albert+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --pink: #C9567A;
  --pink-light: #E8A0B8;
  --pink-pale: #F5D0DF;
  --pink-bg: #FBF0F4;
  --purple-light: #C9C3F0;
  --purple-pale: #EEEDFE;
  --bg-gradient: linear-gradient(135deg, #FDE8EF 0%, #F0EDFB 50%, #FBF0F4 100%);
  --text-dark: #1a1a1a;
  --text-mid: #555;
  --text-muted: #888;
  --border: #E8D5DC;
  --white: #fff;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-xl: 32px;
  --shadow-sm: 0 2px 8px rgba(180,80,120,0.08);
  --shadow-md: 0 4px 20px rgba(180,80,120,0.12);
  --shadow-lg: 0 8px 40px rgba(180,80,120,0.16);
}

body { font-family: 'Albert Sans', sans-serif; background: var(--bg-gradient); min-height: 100vh; color: var(--text-dark); }

/* NAV */
.nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.88); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2.5rem; height: 60px;
}
.nav-logo { font-family: 'Cantora One', cursive; font-size: 1.35rem; color: var(--pink); cursor: pointer; display: flex; align-items: center; gap: 8px; text-decoration: none; }
.nav-logo svg { width: 28px; height: 28px; }
.nav-links { display: flex; gap: 2rem; }
.nav-links a { font-size: 0.9rem; color: var(--text-mid); text-decoration: none; font-weight: 500; transition: color 0.2s; cursor: pointer; }
.nav-links a:hover { color: var(--pink); }
.nav-actions { display: flex; gap: 0.75rem; align-items: center; }
.btn-ghost { background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 7px 18px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; font-weight: 500; color: var(--text-dark); cursor: pointer; transition: all 0.2s; }
.btn-ghost:hover { border-color: var(--pink); color: var(--pink); }
.btn-primary { background: var(--pink); color: white; border: none; border-radius: 100px; padding: 8px 20px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-primary:hover { background: #b04068; transform: translateY(-1px); box-shadow: var(--shadow-sm); }

/* LANDING */
.landing { min-height: 100vh; display: flex; flex-direction: column; }
.hero { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 5rem 4rem 3rem; position: relative; overflow: hidden; }
.sparkle { position: absolute; color: var(--pink-light); font-size: 1.8rem; animation: float 4s ease-in-out infinite; pointer-events: none; }
.sparkle:nth-child(1) { top: 8%; left: 8%; animation-delay: 0s; }
.sparkle:nth-child(2) { top: 15%; right: 12%; font-size: 2.4rem; animation-delay: 1.2s; }
.sparkle:nth-child(3) { bottom: 20%; right: 8%; animation-delay: 0.6s; }
.sparkle:nth-child(4) { bottom: 30%; left: 5%; font-size: 1.2rem; animation-delay: 1.8s; }
@keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(10deg)} }
.hero-title { font-family: 'Anton', sans-serif; font-size: clamp(3rem, 7vw, 5.5rem); line-height: 1.05; letter-spacing: -0.01em; max-width: 700px; margin-bottom: 1.5rem; }
.hero-title span { color: var(--pink); }
.hero-sub { font-size: 1.1rem; color: var(--text-mid); max-width: 440px; line-height: 1.7; margin-bottom: 0.5rem; }
.hero-sub strong { color: var(--text-dark); font-weight: 600; }
.hero-sub em { font-style: italic; }
.btn-hero { display: inline-block; margin-top: 2rem; background: var(--text-dark); color: white; font-family: 'Albert Sans', sans-serif; font-weight: 600; font-size: 1rem; padding: 16px 36px; border-radius: 14px; border: none; cursor: pointer; transition: all 0.22s; box-shadow: 4px 4px 0 var(--pink); }
.btn-hero:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 var(--pink); }

/* AUTH PAGES */
.auth-page { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg-gradient); }
.auth-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 3rem 1rem; }
.auth-card { background: white; border-radius: var(--radius-xl); border: 1px solid var(--border); padding: 3rem 2.5rem; width: 100%; max-width: 480px; box-shadow: var(--shadow-md); }
.auth-title { font-family: 'Cantora One', cursive; font-size: 1.9rem; text-align: center; margin-bottom: 2rem; color: var(--text-dark); }
.btn-google { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: white; border: 1.5px solid var(--border); border-radius: 100px; padding: 12px; font-family: 'Albert Sans', sans-serif; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-google:hover { border-color: #aaa; box-shadow: var(--shadow-sm); }
.google-icon { width: 20px; height: 20px; }
.auth-or { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; color: var(--text-muted); font-size: 0.85rem; }
.auth-or::before, .auth-or::after { content:''; flex:1; height:1px; background: var(--border); }
.auth-label { font-size: 0.88rem; color: var(--text-mid); margin-bottom: 6px; display: flex; justify-content: space-between; }
.auth-input { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 11px 14px; font-family: 'Albert Sans', sans-serif; font-size: 0.95rem; outline: none; transition: border-color 0.2s; margin-bottom: 1rem; }
.auth-input:focus { border-color: var(--pink); }
.btn-submit { width: 100%; background: var(--pink); color: white; border: none; border-radius: 100px; padding: 14px; font-family: 'Albert Sans', sans-serif; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-submit:hover { background: #b04068; }
.auth-switch { text-align: center; margin-top: 2rem; }
.auth-switch-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; color: var(--text-muted); font-size: 0.85rem; }
.auth-switch-bar::before, .auth-switch-bar::after { content:''; flex:1; height:1px; background: var(--border); }
.btn-switch { width: 100%; background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 12px; font-family: 'Albert Sans', sans-serif; font-size: 0.95rem; font-weight: 600; color: var(--pink); cursor: pointer; transition: all 0.2s; }
.btn-switch:hover { border-color: var(--pink); background: var(--pink-bg); }
.forgot-link { font-size: 0.82rem; color: var(--text-muted); text-decoration: underline; cursor: pointer; }

/* EVENTS LIST */
.page { padding: 2.5rem 3rem; min-height: 100vh; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2.5rem; }
.page-title { font-family: 'Anton', sans-serif; font-size: 2.8rem; line-height: 1.1; color: var(--text-dark); }
.page-sub { font-size: 0.95rem; color: var(--text-muted); margin-top: 4px; }
.btn-create { display: flex; align-items: center; gap: 8px; background: var(--pink); color: white; border: none; border-radius: 100px; padding: 12px 24px; font-family: 'Albert Sans', sans-serif; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-create:hover { background: #b04068; transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
.event-card { background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; cursor: pointer; transition: all 0.22s; box-shadow: var(--shadow-sm); }
.event-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--pink-light); }
.event-card-img { width: 100%; height: 160px; object-fit: cover; background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale)); display: flex; align-items: center; justify-content: center; position: relative; }
.event-card-badge { position: absolute; top: 12px; left: 12px; background: var(--pink); color: white; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 100px; letter-spacing: 0.05em; text-transform: uppercase; }
.event-card-badge.attending { background: #7F77DD; }
.event-card-badge.draft { background: #888; }
.event-card-body { padding: 1.25rem; }
.event-card-date { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 5px; }
.event-card-name { font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; color: var(--text-dark); }
.event-card-host { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
.event-card-footer { display: flex; align-items: center; justify-content: space-between; }
.avatar-row { display: flex; }
.avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--purple-pale); border: 2px solid white; margin-left: -6px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: #7F77DD; }
.avatar:first-child { margin-left: 0; }
.avatar-count { width: 26px; height: 26px; border-radius: 50%; background: var(--pink-pale); border: 2px solid white; margin-left: -6px; display: flex; align-items: center; justify-content: center; font-size: 0.62rem; font-weight: 700; color: var(--pink); }
.event-card-action { font-size: 0.82rem; font-weight: 600; color: var(--pink); text-decoration: underline; cursor: pointer; }
.potluck-banner { display: flex; align-items: center; gap: 8px; background: var(--pink-bg); border: 1px solid var(--pink-pale); border-radius: var(--radius-sm); padding: 8px 12px; margin-top: 0.75rem; font-size: 0.8rem; color: var(--pink); cursor: pointer; }
.potluck-banner svg { flex-shrink: 0; }
.potluck-arrow { margin-left: auto; }
.inspiration-card { background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale)); border-radius: var(--radius-lg); padding: 2rem 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; }
.inspiration-title { font-family: 'Anton', sans-serif; font-size: 1.8rem; color: var(--text-dark); }
.inspiration-sub { font-size: 0.9rem; color: var(--text-mid); }
.btn-templates { display: flex; align-items: center; gap: 8px; background: white; border: 1.5px solid var(--border); border-radius: 100px; padding: 10px 20px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; font-weight: 600; color: var(--text-dark); cursor: pointer; transition: all 0.2s; }
.btn-templates:hover { border-color: var(--pink); color: var(--pink); }
.draft-card { border: 1.5px dashed var(--border); background: #fafafa; border-radius: var(--radius-lg); padding: 2rem 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; }
.draft-card:hover { border-color: var(--pink-light); }
.draft-icon { width: 48px; height: 48px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; }
.draft-title { font-weight: 700; font-size: 1rem; }
.draft-meta { font-size: 0.82rem; color: var(--text-muted); }
.draft-link { font-size: 0.85rem; color: var(--pink); font-weight: 600; text-decoration: underline; }

/* CREATE EVENT */
.create-page { padding: 3rem 2rem; max-width: 900px; margin: 0 auto; }
.create-title { font-family: 'Cantora One', cursive; font-size: 2.5rem; text-align: center; color: var(--text-dark); margin-bottom: 0.75rem; }
.create-sub { text-align: center; color: var(--text-muted); font-size: 0.95rem; margin-bottom: 2.5rem; }
.create-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
.create-section { background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 1.75rem; }
.section-num { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: var(--pink); color: white; border-radius: 50%; font-size: 0.8rem; font-weight: 700; margin-right: 10px; }
.section-title { font-family: 'Cantora One', cursive; font-size: 1.25rem; color: var(--text-dark); display: flex; align-items: center; margin-bottom: 1.25rem; }
.field-label { font-size: 0.85rem; font-weight: 600; color: var(--text-mid); margin-bottom: 6px; display: block; }
.field-input { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; font-family: 'Albert Sans', sans-serif; font-size: 0.92rem; outline: none; transition: border-color 0.2s; margin-bottom: 1rem; background: white; }
.field-input:focus { border-color: var(--pink); }
textarea.field-input { resize: vertical; min-height: 100px; }
.date-time-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.vibe-images { display: flex; flex-direction: column; gap: 0.75rem; }
.vibe-img { border-radius: var(--radius-sm); overflow: hidden; position: relative; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
.vibe-img.selected { border-color: var(--pink); }
.vibe-img-inner { height: 80px; background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale)); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--text-muted); }
.vibe-check { position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; background: var(--pink); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
.vibe-img.selected .vibe-check { opacity: 1; }
.supercharge-section { grid-column: 1/-1; }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 0; }
.feature-toggle { border: 1.5px solid var(--border); border-radius: var(--radius-md); padding: 1rem; cursor: pointer; transition: all 0.2s; position: relative; }
.feature-toggle:hover { border-color: var(--pink-light); }
.feature-toggle.active { border-color: var(--pink); background: var(--pink-bg); }
.feature-check { position: absolute; top: 12px; right: 12px; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--border); transition: all 0.2s; }
.feature-toggle.active .feature-check { background: var(--pink); border-color: var(--pink); }
.feature-icon { font-size: 1.2rem; margin-bottom: 8px; }
.feature-name { font-size: 0.88rem; font-weight: 700; margin-bottom: 4px; }
.feature-desc { font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; }
.create-actions { display: flex; justify-content: center; gap: 1rem; margin-top: 2rem; }
.btn-cancel { background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 12px 32px; font-family: 'Albert Sans', sans-serif; font-size: 0.92rem; font-weight: 500; color: var(--text-mid); cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { border-color: #aaa; }
.btn-create-event { background: var(--text-dark); color: white; border: none; border-radius: 100px; padding: 12px 36px; font-family: 'Albert Sans', sans-serif; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 3px 3px 0 var(--pink); }
.btn-create-event:hover { transform: translate(-1px,-1px); box-shadow: 5px 5px 0 var(--pink); }

/* EVENT PAGE */
.event-page { display: flex; min-height: calc(100vh - 60px); }
.event-main { flex: 1; padding: 0; overflow-y: auto; }
.event-hero { width: 100%; height: 280px; background: linear-gradient(135deg, var(--purple-pale) 0%, var(--pink-pale) 100%); display: flex; align-items: center; justify-content: center; position: relative; }
.event-hero-badge { position: absolute; top: 20px; left: 24px; background: white; border-radius: 100px; padding: 5px 14px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; box-shadow: var(--shadow-sm); font-weight: 500; }
.event-hero-hero-text { font-family: 'Anton', sans-serif; font-size: 2rem; text-align: center; color: var(--text-dark); max-width: 60%; line-height: 1.2; }
.event-hero-hero-text span { color: var(--pink); }
.event-content { padding: 2rem 2.5rem; }
.event-cat-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--pink-bg); border: 1px solid var(--pink-pale); border-radius: 100px; padding: 5px 14px; font-size: 0.82rem; color: var(--pink); font-weight: 600; margin-bottom: 0.75rem; }
.event-title { font-family: 'Anton', sans-serif; font-size: 2.2rem; margin-bottom: 4px; }
.event-location { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
.event-rsvp-row { display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
.btn-going { display: flex; align-items: center; gap: 8px; background: var(--pink); color: white; border: none; border-radius: 100px; padding: 12px 28px; font-family: 'Albert Sans', sans-serif; font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-going:hover { background: #b04068; }
.btn-cantmake { background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 11px 24px; font-family: 'Albert Sans', sans-serif; font-size: 0.92rem; font-weight: 500; color: var(--text-mid); cursor: pointer; transition: all 0.2s; }
.btn-cantmake:hover { border-color: #aaa; }
.event-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
.info-card { background: white; border-radius: var(--radius-md); border: 1px solid var(--border); padding: 1.25rem; }
.info-card-title { font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.75rem; }
.info-card-content { font-size: 0.95rem; line-height: 1.7; color: var(--text-mid); }
.info-card-host { display: flex; align-items: center; gap: 12px; }
.host-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; color: var(--pink); }
.host-name { font-size: 1.1rem; font-weight: 700; }
.host-contact { font-size: 0.82rem; color: var(--pink); text-decoration: underline; cursor: pointer; margin-top: 2px; }
.detail-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 0.75rem; }
.detail-icon { font-size: 1.1rem; margin-top: 1px; flex-shrink: 0; }
.detail-label { font-size: 0.82rem; font-weight: 700; color: var(--text-muted); }
.detail-val { font-size: 0.88rem; color: var(--text-mid); }

/* SIDEBAR */
.event-sidebar { width: 260px; background: white; border-left: 1px solid var(--border); display: flex; flex-direction: column; height: calc(100vh - 60px); position: sticky; top: 60px; }
.sidebar-top { padding: 1.25rem; border-bottom: 1px solid var(--border); }
.sidebar-lounge { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer; background: var(--pink-bg); margin-bottom: 0.25rem; }
.lounge-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale)); display: flex; align-items: center; justify-content: center; }
.lounge-name { font-weight: 700; font-size: 0.9rem; color: var(--pink); }
.lounge-sub { font-size: 0.75rem; color: var(--text-muted); }
.sidebar-nav { display: flex; flex-direction: column; padding: 0.75rem; gap: 2px; }
.sidebar-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.88rem; font-weight: 500; color: var(--text-mid); transition: all 0.15s; }
.sidebar-item:hover, .sidebar-item.active { background: var(--pink-bg); color: var(--pink); }
.sidebar-item svg { width: 18px; height: 18px; flex-shrink: 0; }
.sidebar-bottom { padding: 1rem; margin-top: auto; border-top: 1px solid var(--border); }
.btn-cohost { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--pink-bg); border: 1.5px solid var(--pink-pale); border-radius: var(--radius-sm); padding: 11px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; font-weight: 600; color: var(--pink); cursor: pointer; transition: all 0.2s; }
.btn-cohost:hover { background: var(--pink-pale); }

/* CHAT */
.chat-panel { flex: 1; display: flex; flex-direction: column; padding: 1rem; overflow: hidden; }
.chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
.chat-msg { display: flex; gap: 8px; align-items: flex-start; }
.chat-msg.mine { flex-direction: row-reverse; }
.chat-bubble-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale)); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: var(--pink); flex-shrink: 0; }
.chat-bubble { background: var(--pink-bg); border-radius: 14px; padding: 8px 12px; max-width: 80%; }
.chat-msg.mine .chat-bubble { background: var(--pink); color: white; }
.chat-bubble-name { font-size: 0.7rem; font-weight: 700; color: var(--pink); margin-bottom: 2px; }
.chat-msg.mine .chat-bubble-name { color: rgba(255,255,255,0.8); }
.chat-bubble-text { font-size: 0.85rem; line-height: 1.5; }
.chat-input-row { display: flex; gap: 8px; padding-top: 0.75rem; border-top: 1px solid var(--border); }
.chat-input { flex: 1; border: 1.5px solid var(--border); border-radius: 100px; padding: 9px 16px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; outline: none; transition: border-color 0.2s; }
.chat-input:focus { border-color: var(--pink); }
.btn-send { background: var(--pink); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.2s; }
.btn-send:hover { background: #b04068; }

/* FOOTER */
.footer { background: white; border-top: 1px solid var(--border); padding: 2rem 3rem; display: flex; align-items: center; justify-content: space-between; }
.footer-logo { font-family: 'Cantora One', cursive; font-size: 1.2rem; color: var(--pink); }
.footer-links { display: flex; gap: 1.5rem; }
.footer-links a { font-size: 0.85rem; color: var(--text-muted); text-decoration: none; cursor: pointer; }
.footer-links a:hover { color: var(--pink); }
.footer-copy { font-size: 0.8rem; color: var(--text-muted); }
`;

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
    <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity="0.6"/>
    <path d="M5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z" opacity="0.4"/>
  </svg>
);

const LogoIcon = () => (
  <svg viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="#FBE8F0"/>
    <path d="M10 16c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="#C9567A" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="12" r="2" fill="#C9567A"/>
    <path d="M13 20l3-4 3 4" stroke="#C9567A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const sampleMessages = [
  { id: 1, user: "Sarah J.", text: "So excited for this!! 🎉", mine: false, initials: "SJ" },
  { id: 2, user: "Mike T.", text: "I'll bring the potato salad!", mine: false, initials: "MT" },
  { id: 3, user: "You", text: "Can't wait to see everyone 🔥", mine: true, initials: "ME" },
  { id: 4, user: "Jess D.", text: "What time should we actually arrive?", mine: false, initials: "JD" },
];

const sampleEvents = [
  { id: 1, title: "Summer Ending Potluck", date: "Oct 24, 2024 • 6:00 PM", status: "Hosting", location: "123 Maple St", attendees: ["JD","MT","SJ"], count: 12, potluck: true, items: "Paper plates, Ice" },
  { id: 2, title: "Sarah's Birthday Bash", date: "Tomorrow • 8:00 PM", status: "Attending", host: "Sarah M.", location: "456 Oak Ave", attendees: ["SJ","MT","JD"], count: 8 },
];

function Nav({ page, setPage, loggedIn }) {
  return (
    <nav className="nav">
      <span className="nav-logo" onClick={() => setPage(loggedIn ? "events" : "landing")}>
        <LogoIcon /> Cohosted
      </span>
      <div className="nav-links">
        <a onClick={() => {}}>How It Works</a>
        <a onClick={() => {}}>Browse Templates</a>
      </div>
      <div className="nav-actions">
        {loggedIn ? (
          <>
            <button className="btn-ghost" onClick={() => setPage("events")}>My Events</button>
            <button className="btn-primary" onClick={() => setPage("create")}>+ Create Event</button>
          </>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => setPage("login")}>Log In</button>
            <button className="btn-primary" onClick={() => setPage("signup")}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span className="footer-logo">Cohosted</span>
      <div className="footer-links">
        <a>About</a><a>Privacy</a><a>Terms</a><a>Support</a><a>Contact</a>
      </div>
      <span className="footer-copy">© 2024 Cohosted. Party on.</span>
    </footer>
  );
}

function LandingPage({ setPage }) {
  return (
    <div className="landing">
      <div className="hero">
        <span className="sparkle" style={{top:"8%",left:"8%"}}><SparkleIcon/></span>
        <span className="sparkle" style={{top:"15%",right:"12%",fontSize:"2.4rem"}}><SparkleIcon/></span>
        <span className="sparkle" style={{bottom:"20%",right:"8%"}}><SparkleIcon/></span>
        <span className="sparkle" style={{bottom:"30%",left:"5%",fontSize:"1.2rem"}}><SparkleIcon/></span>
        <h1 className="hero-title">
          Events are <span>better</span><br/>when everyone plays<br/>a part
        </h1>
        <p className="hero-sub">
          The RSVP tool built for potlucks, watch parties, and group hangs.<br/>
          <strong>Start hosting <em>with</em> your friends,</strong> not just <em>for</em> them.
        </p>
        <button className="btn-hero" onClick={() => setPage("signup")}>Create Your First Event</button>
      </div>
      <Footer />
    </div>
  );
}

function SignupPage({ setPage, setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="auth-page">
      <div className="auth-body">
        <div className="auth-card">
          <h1 className="auth-title">Create an account</h1>
          <button className="btn-google"><GoogleIcon/> Continue with Google</button>
          <div className="auth-or">OR</div>
          <label className="auth-label">Email address</label>
          <input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="" />
          <label className="auth-label">
            Your password
            <span className="forgot-link" onClick={()=>setShowPw(p=>!p)}>{showPw?"Hide":"Show"}</span>
          </label>
          <input className="auth-input" type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="btn-submit" onClick={()=>{setLoggedIn(true);setPage("events");}}>Sign up</button>
          <div className="auth-switch">
            <div className="auth-switch-bar">Already have an account?</div>
            <button className="btn-switch" onClick={()=>setPage("login")}>Log in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ setPage, setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="auth-page">
      <div className="auth-body">
        <div className="auth-card">
          <h1 className="auth-title">Sign in</h1>
          <button className="btn-google"><GoogleIcon/> Continue with Google</button>
          <div className="auth-or">OR</div>
          <label className="auth-label">Email address</label>
          <input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <label className="auth-label">
            Your password
            <span className="forgot-link">Hide</span>
          </label>
          <input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="btn-submit" onClick={()=>{setLoggedIn(true);setPage("events");}}>Log in</button>
          <div style={{marginTop:"0.75rem"}}><span className="forgot-link">Forgot your password?</span></div>
          <div className="auth-switch">
            <div className="auth-switch-bar">New to Cohosted?</div>
            <button className="btn-switch" onClick={()=>setPage("signup")}>Create an account</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventsPage({ setPage, setCurrentEvent }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Celebrations</h1>
          <p className="page-sub">Here are all the events you're hosting or joining.</p>
        </div>
        <button className="btn-create" onClick={()=>setPage("create")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          Create New Event
        </button>
      </div>

      <div className="events-grid">
        {/* Hosting card */}
        <div className="event-card" onClick={()=>{setCurrentEvent(sampleEvents[0]);setPage("event");}}>
          <div className="event-card-img">
            <span className="event-card-badge">Hosting</span>
            <div style={{textAlign:"center",padding:"1rem"}}>
              <div style={{fontFamily:"Anton",fontSize:"1.1rem",lineHeight:1.2,color:"var(--text-dark)"}}>Events are <span style={{color:"var(--pink)"}}>better</span><br/>when everyone plays a part</div>
            </div>
          </div>
          <div className="event-card-body">
            <div className="event-card-date">📅 Oct 24, 2024 • 6:00 PM</div>
            <div className="event-card-name">Summer Ending Potluck</div>
            <div className="event-card-footer">
              <div className="avatar-row">
                {["JD","MT","SJ"].map(i=><div key={i} className="avatar">{i}</div>)}
              </div>
              <span style={{fontSize:"0.82rem",color:"var(--text-muted)"}}>You & 12 others attending</span>
            </div>
            <div className="potluck-banner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="var(--pink)" strokeWidth="1.5"/><path d="M5 9l2 2 4-4" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span><strong>3 items needed for potluck</strong><br/><span style={{fontSize:"0.75rem"}}>Including: Paper plates, Ice</span></span>
              <svg className="potluck-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 7h4M7 5l2 2-2 2" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        {/* Attending card */}
        <div className="event-card" onClick={()=>{setCurrentEvent(sampleEvents[1]);setPage("event");}}>
          <div className="event-card-img" style={{background:"linear-gradient(135deg,#7F77DD22,#C9567A22)"}}>
            <span className="event-card-badge attending">Attending</span>
            <div style={{width:60,height:60,borderRadius:"50%",background:"linear-gradient(135deg,var(--purple-pale),var(--pink-pale))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem"}}>🎂</div>
          </div>
          <div className="event-card-body">
            <div className="event-card-date">🕐 Tomorrow • 8:00 PM</div>
            <div className="event-card-name">Sarah's Birthday Bash</div>
            <div className="event-card-host">Hosted by Sarah M.</div>
            <div className="event-card-footer">
              <div className="avatar-row">
                {["SJ","MT","JD"].map(i=><div key={i} className="avatar">{i}</div>)}
                <div className="avatar-count">+8</div>
              </div>
              <span className="event-card-action">View Details</span>
            </div>
          </div>
        </div>

        {/* Draft card */}
        <div className="draft-card">
          <div className="draft-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="4" y="3" width="14" height="16" rx="2" stroke="#888" strokeWidth="1.5"/><path d="M7 7h8M7 11h8M7 15h5" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div className="draft-title">Winter Ski Trip</div>
          <div className="draft-meta">Draft • Updated 2 days ago</div>
          <span className="draft-link">Resume Planning</span>
        </div>

        {/* Inspiration card */}
        <div className="inspiration-card">
          <h2 className="inspiration-title">Need Inspiration?</h2>
          <p className="inspiration-sub">Browse our templates to host effortless dinner parties, game nights, or casual hangouts.</p>
          <button className="btn-templates">✨ Browse Templates</button>
        </div>
      </div>
    </div>
  );
}

function CreateEventPage({ setPage }) {
  const [features, setFeatures] = useState({potluck: false, polls: false, chat: true});
  const [vibeSelected, setVibeSelected] = useState(0);
  const toggleFeature = k => setFeatures(f=>({...f,[k]:!f[k]}));

  return (
    <div className="create-page">
      <h1 className="create-title">Let's get this party started.</h1>
      <p className="create-sub">Fill in the details below to create your event space. Don't stress, you can always change things later.</p>

      <div className="create-grid">
        {/* Section 1: Basics */}
        <div className="create-section">
          <div className="section-title"><span className="section-num">1</span> The Basics</div>
          <label className="field-label">Event Title</label>
          <input className="field-input" placeholder="e.g., Sarah's Birthday Bash" />
          <div className="date-time-row">
            <div>
              <label className="field-label">Date</label>
              <input className="field-input" type="date" style={{marginBottom:0}} />
            </div>
            <div>
              <label className="field-label">Time</label>
              <input className="field-input" type="time" style={{marginBottom:0}} />
            </div>
          </div>
          <div style={{height:"1rem"}} />
          <label className="field-label">Location</label>
          <input className="field-input" placeholder="🔍 Search address or venue..." />
          <label className="field-label">Description</label>
          <textarea className="field-input" placeholder="Tell your guests what to expect..." />
        </div>

        {/* Section 2: Vibe Check */}
        <div className="create-section">
          <div className="section-title"><span className="section-num">2</span> Vibe Check</div>
          <p style={{fontSize:"0.88rem",color:"var(--text-muted)",marginBottom:"1rem"}}>Choose a cover image that sets the mood for your gathering.</p>
          <div className="vibe-images">
            {["🎉 Party Vibes","🌿 Casual Hangout","🎂 Birthday Bash"].map((label, i) => (
              <div key={i} className={`vibe-img${vibeSelected===i?" selected":""}`} onClick={()=>setVibeSelected(i)}>
                <div className="vibe-img-inner" style={{background: i===0?"linear-gradient(135deg,#EEEDFE,#F5D0DF)":i===1?"linear-gradient(135deg,#EAF3DE,#E1F5EE)":"linear-gradient(135deg,#FAEEDA,#F5D0DF)"}}>
                  <span>{label}</span>
                </div>
                <div className="vibe-check">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Supercharge */}
        <div className="create-section supercharge-section">
          <div className="section-title"><span className="section-num">3</span> Supercharge Your Event</div>
          <div className="feature-grid">
            {[
              {key:"potluck", icon:"🥘", name:"Potluck List", desc:"Let guests claim items to bring so you don't end up with 5 bags of ice."},
              {key:"polls", icon:"📊", name:"Group Polls", desc:"Can't decide on a date or theme? Let your guests vote on the details."},
              {key:"chat", icon:"💬", name:"Event Chat", desc:"A dedicated space for hype, questions, and sharing photos after the party."},
            ].map(f=>(
              <div key={f.key} className={`feature-toggle${features[f.key]?" active":""}`} onClick={()=>toggleFeature(f.key)}>
                <div className="feature-check"/>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="create-actions">
        <button className="btn-cancel" onClick={()=>setPage("events")}>Cancel</button>
        <button className="btn-create-event" onClick={()=>setPage("events")}>Create Event</button>
      </div>
    </div>
  );
}

function EventPage({ event, setPage }) {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(sampleMessages);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(m => [...m, {id: Date.now(), user: "You", text: chatInput, mine: true, initials: "ME"}]);
    setChatInput("");
  };

  const sidebarItems = [
    { key: "chat", label: "Event Chat", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key: "polls", label: "Polls", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="10" width="4" height="11" rx="1"/><rect x="10" y="6" width="4" height="15" rx="1"/><rect x="17" y="2" width="4" height="19" rx="1"/></svg> },
    { key: "guests", label: "Guest List", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg> },
    { key: "files", label: "Files", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> },
  ];

  const ev = event || sampleEvents[0];

  return (
    <div className="event-page">
      <div className="event-main">
        <div className="event-hero">
          <div className="event-hero-badge">📅 Aug 15 • 2:00 PM</div>
          <div className="event-hero-hero-text">
            Events are <span>better</span> when everyone plays a part
          </div>
        </div>
        <div className="event-content">
          <div className="event-cat-badge">🎉 Social Gathering</div>
          <h1 className="event-title">{ev.title}</h1>
          <div className="event-location">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A4.5 4.5 0 0113.5 6c0 3-4.5 8.5-4.5 8.5S4.5 9 4.5 6A4.5 4.5 0 018 1.5z" stroke="var(--text-muted)" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="var(--text-muted)" strokeWidth="1.5"/></svg>
            {ev.location || "123 Sunshine Ave, Austin, TX"}
          </div>
          <div className="event-rsvp-row">
            <button className="btn-cantmake">Can't Make It</button>
            <button className="btn-going">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              I'm Going!
            </button>
          </div>

          <div className="event-info-grid">
            <div className="info-card">
              <div className="info-card-title">About the Event</div>
              <div className="info-card-content">Get ready for the ultimate summer send-off! We're firing up the grill, chilling the drinks, and setting up the yard games. Bring your favorite side dish if you'd like, but mostly just bring yourselves.</div>
              <div style={{marginTop:"1rem"}}>
                <div className="detail-row">
                  <span className="detail-icon">🍴</span>
                  <div><div className="detail-label">Food & Drink</div><div className="detail-val">Burgers, hotdogs, and veggie options provided. BYOB!</div></div>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">🎮</span>
                  <div><div className="detail-label">Activities</div><div className="detail-val">Cornhole, giant Jenga, and a firepit for s'mores later.</div></div>
                </div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-title">Hosted by</div>
              <div className="info-card-host">
                <div className="host-avatar">SJ</div>
                <div>
                  <div className="host-name">Sarah Jenkins</div>
                  <div className="host-contact">Contact Host</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="event-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-lounge">
            <div className="lounge-avatar">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="var(--pink)" strokeWidth="1.5"/><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="lounge-name">Event Lounge</div>
              <div className="lounge-sub">Collaborate with guests</div>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          {sidebarItems.map(item => (
            <div key={item.key} className={`sidebar-item${activeTab===item.key?" active":""}`} onClick={()=>setActiveTab(item.key)}>
              {item.icon} {item.label}
            </div>
          ))}
        </div>

        {activeTab === "chat" && (
          <div className="chat-panel">
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`chat-msg${msg.mine?" mine":""}`}>
                  <div className="chat-bubble-avatar">{msg.initials}</div>
                  <div className="chat-bubble">
                    <div className="chat-bubble-name">{msg.user}</div>
                    <div className="chat-bubble-text">{msg.text}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-row">
              <input
                className="chat-input"
                placeholder="Say something..."
                value={chatInput}
                onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendMessage()}
              />
              <button className="btn-send" onClick={sendMessage}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill="white"/></svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === "guests" && (
          <div style={{padding:"1rem",fontSize:"0.85rem"}}>
            {["Sarah Jenkins (Host)","Jake D.","Mike T.","Jess D.","You"].map((g,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                <div className="host-avatar" style={{width:32,height:32,fontSize:"0.75rem"}}>{g.slice(0,2).toUpperCase()}</div>
                <span style={{color:"var(--text-dark)"}}>{g}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "polls" && (
          <div style={{padding:"1rem",fontSize:"0.85rem",color:"var(--text-muted)"}}>
            <div style={{background:"var(--pink-bg)",borderRadius:"var(--radius-sm)",padding:"1rem",marginBottom:"0.75rem"}}>
              <div style={{fontWeight:700,color:"var(--text-dark)",marginBottom:"0.5rem"}}>What should we watch after?</div>
              {["Interstellar 🚀","The Grand Budapest Hotel 🏨","Mamma Mia 🎵"].map((opt,i)=>(
                <div key={i} style={{padding:"6px 10px",marginBottom:4,borderRadius:6,background:"white",border:"1px solid var(--border)",fontSize:"0.8rem",cursor:"pointer"}}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div style={{padding:"1rem",fontSize:"0.85rem",color:"var(--text-muted)",textAlign:"center",marginTop:"2rem"}}>
            <div style={{fontSize:"2rem",marginBottom:"0.5rem"}}>📁</div>
            <div>No files shared yet.</div>
            <button style={{marginTop:"1rem",background:"var(--pink-bg)",border:"1px solid var(--pink-pale)",borderRadius:100,padding:"8px 16px",color:"var(--pink)",fontWeight:600,fontSize:"0.82rem",cursor:"pointer",fontFamily:"Albert Sans"}}>Upload File</button>
          </div>
        )}

        <div className="sidebar-bottom">
          <button className="btn-cohost">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="var(--pink)" strokeWidth="1.5"/><path d="M2 14c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 6v4M11 8h4" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Invite Co-host
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  return (
    <>
      <style>{style}</style>
      <Nav page={page} setPage={setPage} loggedIn={loggedIn} />
      {page === "landing" && <LandingPage setPage={setPage} />}
      {page === "signup" && <SignupPage setPage={setPage} setLoggedIn={setLoggedIn} />}
      {page === "login" && <LoginPage setPage={setPage} setLoggedIn={setLoggedIn} />}
      {page === "events" && <EventsPage setPage={setPage} setCurrentEvent={setCurrentEvent} />}
      {page === "create" && <CreateEventPage setPage={setPage} />}
      {page === "event" && <EventPage event={currentEvent} setPage={setPage} />}
      {page !== "landing" && page !== "event" && <Footer />}
    </>
  );
}
