import { useEffect, useState } from "react";

export function meta() {
  return [
    { title: "Spazio Terzo — Psicologia, psicoterapia, comunità" },
    {
      name: "description",
      content:
        "Spazio Terzo è un'associazione che mette in relazione psicologia, psicoterapia e territorio.",
    },
  ];
}

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <section className="hero" id="top">
        <header className="nav-wrap">
          <a href="#top" className="brand" aria-label="Spazio Terzo, home">
            <span className="brand-mark">S<span>3</span></span>
            <span>Spazio<br />Terzo</span>
          </a>
          <button
            className="menu-button"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Chiudi" : "Menu"}
          </button>
          <nav id="main-navigation" className={menuOpen ? "open" : ""}>
            <a onClick={closeMenu} href="#chi-siamo">Associazione</a>
            <a onClick={closeMenu} href="#percorsi">Cosa facciamo</a>
            <a onClick={closeMenu} href="#territorio">Sul territorio</a>
            <a onClick={closeMenu} href="#contatti">Contatti <Arrow /></a>
          </nav>
        </header>

        <div className="hero-copy">
          <p className="eyebrow entrance">Psicologia · Psicoterapia · Terzo settore</p>
          <h1 className="entrance delay-1">Spazio per<br /><em>sentirsi.</em></h1>
          <p className="hero-intro entrance delay-2">
            Un'associazione di professioniste e professionisti per prenderci cura
            delle persone e delle relazioni che abitano il territorio.
          </p>
          <a className="hero-link entrance delay-3" href="#chi-siamo">
            Scopri chi siamo <Arrow />
          </a>
        </div>

        <div className="hero-meta">
          <span>Bologna · dal 2014</span>
          <a href="#contatti">Scrivici <Arrow /></a>
        </div>
        <div className="hero-grain" />
      </section>

      <section className="manifesto" id="chi-siamo">
        <p className="section-label reveal">01 — L'associazione</p>
        <div className="manifesto-main reveal">
          <h2>Le storie individuali<br />sono sempre <em>storie collettive.</em></h2>
          <div className="manifesto-aside">
            <p>
              Spazio Terzo nasce dall'incontro tra psicologia e impegno sociale.
              Crediamo in una cura accessibile, attenta alle differenze e capace di
              generare legami.
            </p>
            <a className="text-link" href="#percorsi">Il nostro approccio <Arrow /></a>
          </div>
        </div>
      </section>

      <section className="image-statement" aria-label="Persone in ascolto">
        <div className="image-statement-photo" />
        <p className="photo-caption">Ogni incontro può aprire una possibilità.</p>
        <span className="vertical-word">ASCOLTO</span>
      </section>

      <section className="services" id="percorsi">
        <div className="services-heading reveal">
          <p className="section-label">02 — Come lavoriamo</p>
          <h2>Ci prendiamo cura<br />di ciò che <em>conta.</em></h2>
        </div>
        <div className="service-list">
          <a href="#contatti" className="service-row reveal">
            <span className="service-number">01</span>
            <h3>Psicoterapia</h3>
            <p>Percorsi individuali, di coppia e familiari.</p>
            <Arrow />
          </a>
          <a href="#contatti" className="service-row reveal">
            <span className="service-number">02</span>
            <h3>Sostegno psicologico</h3>
            <p>Uno spazio per attraversare momenti complessi.</p>
            <Arrow />
          </a>
          <a href="#territorio" className="service-row reveal">
            <span className="service-number">03</span>
            <h3>Progetti di comunità</h3>
            <p>Interventi, formazione e reti per il territorio.</p>
            <Arrow />
          </a>
        </div>
      </section>

      <section className="territory" id="territorio">
        <div className="territory-orbit" aria-hidden="true">
          <span>cura</span><span>rete</span><span>presenza</span><span>futuro</span>
        </div>
        <div className="territory-copy reveal">
          <p className="section-label">03 — Sul territorio</p>
          <h2>La cura non è<br />un lusso.</h2>
          <p>
            È un diritto da costruire insieme, nei quartieri, nelle scuole, nelle
            famiglie. Per questo lavoriamo con le persone e con le realtà che ogni
            giorno fanno comunità.
          </p>
          <a className="button-dark" href="#contatti">Parliamone <Arrow /></a>
        </div>
      </section>

      <section className="contact" id="contatti">
        <p className="section-label reveal">04 — Contatti</p>
        <div className="contact-content reveal">
          <h2>Facciamo<br /><em>spazio?</em></h2>
          <div>
            <p>Raccontaci di cosa hai bisogno.<br />Ti risponderemo con cura.</p>
            <a className="contact-mail" href="mailto:info@spazioterzo.it">info@spazioterzo.it <Arrow /></a>
          </div>
        </div>
        <footer>
          <a href="#top" className="brand footer-brand"><span className="brand-mark">S<span>3</span></span><span>Spazio<br />Terzo</span></a>
          <p>Associazione di promozione sociale<br />Bologna, Italia</p>
          <p>© {new Date().getFullYear()} Spazio Terzo</p>
        </footer>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');

        :root { --ink: #132b35; --paper: #f4f1e9; --orange: #e4573d; --line: rgba(19,43,53,.22); }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: var(--paper); color: var(--ink); font-family: 'DM Sans', Arial, sans-serif; }
        a { color: inherit; text-decoration: none; }
        .hero { min-height: 100svh; color: #f9f5ed; position: relative; overflow: hidden; display: flex; flex-direction: column; background: #273d42 url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2000&q=88') center/cover no-repeat; isolation: isolate; }
        .hero:before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(12,31,35,.94) 0%, rgba(12,31,35,.78) 35%, rgba(12,31,35,.3) 68%, rgba(12,31,35,.2) 100%), linear-gradient(0deg, rgba(10,27,32,.5), transparent 42%); }
        .hero-grain { position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .22; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.27'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; }
        .nav-wrap { width: 100%; height: 92px; display: flex; align-items: center; justify-content: space-between; padding: 18px clamp(24px, 5vw, 76px); position: relative; z-index: 2; }
        .brand { display: inline-flex; gap: 11px; align-items: center; font-size: 15px; line-height: .8; font-weight: 600; letter-spacing: -.04em; }
        .brand-mark { width: 33px; height: 33px; border: 1px solid currentColor; border-radius: 50%; display: grid; place-items: center; font: 600 17px/1 'Playfair Display', serif; letter-spacing: -.16em; }
        .brand-mark span { font: 500 9px/1 'DM Mono', monospace; letter-spacing: 0; margin-left: 1px; align-self: end; margin-bottom: 7px; }
        nav { display: flex; align-items: center; gap: clamp(18px, 2.8vw, 45px); font: 500 11px 'DM Mono', monospace; letter-spacing: .04em; text-transform: uppercase; }
        nav a { position: relative; padding: 8px 0; } nav a:after { content: ''; position: absolute; left: 0; right: 0; bottom: 2px; height: 1px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform .25s; } nav a:hover:after { transform: scaleX(1); }
        .menu-button { display: none; border: 0; color: inherit; background: none; font: 500 11px 'DM Mono', monospace; text-transform: uppercase; }
        .hero-copy { margin: auto 0 auto; padding: 74px clamp(24px, 10vw, 164px) 50px; max-width: 860px; }
        .eyebrow, .section-label { margin: 0 0 24px; font: 500 10px 'DM Mono', monospace; text-transform: uppercase; letter-spacing: .12em; }
        .eyebrow:before { content: '●'; color: var(--orange); margin-right: 10px; font-size: 8px; }
        h1, h2, h3, p { margin-top: 0; } h1, h2, h3 { letter-spacing: -.055em; font-weight: 500; }
        h1 { font-size: clamp(58px, 9.6vw, 145px); line-height: .82; margin: 0; } h1 em, h2 em { font-family: 'Playfair Display', Georgia, serif; font-weight: 500; }
        .hero-intro { max-width: 370px; font-size: 16px; line-height: 1.45; margin: 38px 0 24px; color: rgba(249,245,237,.87); }
        .hero-link, .text-link { font: 500 11px 'DM Mono', monospace; letter-spacing: .04em; text-transform: uppercase; border-bottom: 1px solid currentColor; padding-bottom: 7px; display: inline-flex; gap: 20px; align-items: center; }
        .hero-link span, .text-link span { font-size: 18px; line-height: 8px; }
        .hero-meta { border-top: 1px solid rgba(249,245,237,.35); padding: 18px clamp(24px, 5vw, 76px); display: flex; justify-content: space-between; font: 500 10px 'DM Mono', monospace; text-transform: uppercase; letter-spacing: .1em; }
        .hero-meta a { display: flex; gap: 12px; }
        .entrance { opacity: 0; transform: translateY(22px); animation: up .8s cubic-bezier(.2,.8,.2,1) forwards; } .delay-1 { animation-delay: .14s; } .delay-2 { animation-delay: .28s; } .delay-3 { animation-delay: .42s; }
        @keyframes up { to { opacity: 1; transform: translateY(0); } }
        .manifesto { padding: 152px clamp(24px, 9vw, 150px) 145px; background: var(--paper); }
        .section-label { color: #577077; }
        .manifesto-main { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(240px, .52fr); gap: clamp(42px, 10vw, 160px); align-items: end; }
        h2 { font-size: clamp(42px, 5.5vw, 79px); line-height: .98; margin: 0; }
        .manifesto-aside { padding-bottom: 7px; font-size: 16px; line-height: 1.5; }
        .manifesto-aside p { margin-bottom: 34px; }
        .image-statement { height: min(80vw, 760px); min-height: 530px; margin: 0 clamp(15px, 2.4vw, 36px); position: relative; overflow: hidden; background: #c5bdb1; }
        .image-statement-photo { position: absolute; inset: 0; background: url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=85') center 45%/cover no-repeat; filter: saturate(.68) contrast(.9); transform: scale(1.02); transition: transform 1.2s ease; } .image-statement:hover .image-statement-photo { transform: scale(1.07); }
        .image-statement:after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(13,37,43,.72), transparent 48%); }
        .photo-caption { position: absolute; z-index: 1; left: clamp(22px, 4vw, 62px); bottom: 30px; margin: 0; color: #fff; font: 500 10px 'DM Mono', monospace; letter-spacing: .1em; text-transform: uppercase; }
        .vertical-word { position: absolute; z-index: 1; top: 35px; right: clamp(13px, 2vw, 28px); writing-mode: vertical-rl; color: #fff; font: 500 11px 'DM Mono', monospace; letter-spacing: .32em; }
        .services { padding: 150px clamp(24px, 9vw, 150px) 130px; }
        .services-heading { margin-bottom: 85px; } .services-heading h2 { margin-left: min(15vw, 210px); }
        .service-list { border-top: 1px solid var(--line); }
        .service-row { display: grid; grid-template-columns: 90px minmax(200px, .9fr) minmax(230px, .65fr) 30px; align-items: center; gap: 15px; min-height: 123px; border-bottom: 1px solid var(--line); transition: padding .35s, background .35s, color .35s; }
        .service-row:hover { background: var(--ink); color: var(--paper); padding-left: 20px; padding-right: 20px; }
        .service-number { font: 500 10px 'DM Mono', monospace; color: #718589; }.service-row h3 { font-size: clamp(25px, 3vw, 39px); margin: 0; }.service-row p { margin: 0; font-size: 14px; color: #557076; }.service-row:hover p,.service-row:hover .service-number { color: #bbcbc9; }.service-row > span:last-child { font-size: 24px; }
        .territory { background: var(--orange); color: #172e37; min-height: 750px; position: relative; overflow: hidden; padding: 128px clamp(24px, 9vw, 150px); display: flex; align-items: center; }
        .territory-copy { position: relative; z-index: 1; max-width: 595px; }.territory .section-label { color: #172e37; }.territory h2 { font-size: clamp(58px, 7.7vw, 115px); line-height: .85; margin-bottom: 36px; }.territory-copy > p:not(.section-label) { max-width: 390px; font-size: 16px; line-height: 1.5; margin-bottom: 37px; }
        .button-dark { background: var(--ink); color: var(--paper); display: inline-flex; align-items: center; gap: 25px; padding: 17px 20px; font: 500 11px 'DM Mono', monospace; letter-spacing: .04em; text-transform: uppercase; transition: transform .25s; }.button-dark:hover { transform: translateY(-4px); }.button-dark span { font-size: 18px; }
        .territory-orbit { width: min(57vw, 790px); aspect-ratio: 1; position: absolute; right: -8vw; top: 50%; transform: translateY(-50%) rotate(-15deg); border: 1px solid rgba(19,43,53,.45); border-radius: 50%; animation: drift 14s ease-in-out infinite alternate; }.territory-orbit:before,.territory-orbit:after { content: ''; border: 1px solid rgba(19,43,53,.45); border-radius: 50%; position: absolute; inset: 12%; }.territory-orbit:after { inset: 27%; }.territory-orbit span { position: absolute; font: 500 10px 'DM Mono', monospace; text-transform: uppercase; letter-spacing: .12em; }.territory-orbit span:nth-child(1){top:-7px;left:22%}.territory-orbit span:nth-child(2){right:-13px;top:33%}.territory-orbit span:nth-child(3){bottom:10%;left:9%}.territory-orbit span:nth-child(4){left:40%;bottom:12%}@keyframes drift{to{transform:translateY(-53%) rotate(10deg)}}
        .contact { padding: 132px clamp(24px, 9vw, 150px) 31px; background: var(--ink); color: var(--paper); }.contact .section-label { color: #a3b7b7; }.contact-content { display: flex; justify-content: space-between; align-items: end; gap: 40px; min-height: 380px; }.contact h2 { font-size: clamp(70px, 9.2vw, 140px); line-height: .8; }.contact-content > div { font-size: 17px; line-height: 1.5; padding-bottom: 17px; }.contact-mail { display: inline-flex; gap: 22px; margin-top: 32px; padding-bottom: 7px; border-bottom: 1px solid currentColor; font: 500 11px 'DM Mono', monospace; text-transform: uppercase; letter-spacing: .05em; }.contact-mail span { font-size: 18px; }footer { border-top: 1px solid rgba(244,241,233,.27); margin-top: 100px; padding-top: 23px; display: grid; grid-template-columns: 1fr 1fr auto; align-items: start; gap: 20px; font-size: 11px; line-height: 1.45; color: #bbcbc9; }footer .footer-brand { color: var(--paper); font-size: 14px; }footer p { margin: 0; }
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s cubic-bezier(.2,.8,.2,1); }.reveal.is-visible { opacity: 1; transform: none; }
        @media (max-width: 720px) { .nav-wrap { height: 76px; padding: 14px 22px; }.menu-button { display: block; position: relative; z-index: 3; }nav { position: absolute; inset: 0; min-height: 100svh; background: var(--ink); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 22px; padding: 82px 24px 45px; opacity: 0; pointer-events: none; transition: opacity .3s; }nav.open { opacity: 1; pointer-events: auto; }nav a { font: 500 28px 'Playfair Display', serif; text-transform: none; letter-spacing: -.04em; }.hero-copy { padding: 60px 24px 38px; }.hero-intro { font-size: 14px; margin-top: 30px; }.hero-meta { padding: 15px 24px; font-size: 8px; }.manifesto { padding: 92px 24px 90px; }.manifesto-main { display: block; }.manifesto-aside { margin-top: 42px; max-width: 390px; }.image-statement { height: 127vw; min-height: 0; margin: 0 12px; }.services { padding: 95px 24px 90px; }.services-heading { margin-bottom: 54px; }.services-heading h2 { margin-left: 0; }.service-row { grid-template-columns: 38px 1fr 18px; gap: 8px; min-height: 117px; }.service-row p { display: none; }.service-row h3 { font-size: 28px; }.service-row:hover { padding-left: 9px; padding-right: 9px; }.territory { min-height: 670px; padding: 90px 24px; }.territory-orbit { width: 115vw; right: -53vw; top: 59%; }.contact { padding: 91px 24px 28px; }.contact-content { display: block; min-height: 375px; }.contact h2 { margin-bottom: 72px; }.contact-content > div { padding-bottom: 0; }footer { grid-template-columns: 1fr 1fr; margin-top: 72px; }footer p:last-child { grid-column: 1 / -1; } }
        @media (prefers-reduced-motion: reduce) { *,*:before,*:after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      `}</style>
    </main>
  );
}
