import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Design tokens (match existing His Inks palette) ───────────────────────────
const ACCENT = '#C49A44';

// ── Healing timeline data ─────────────────────────────────────────────────────
const TIMELINE = [
  {
    period: 'Days 1–3',
    title: 'Fresh Tattoo',
    desc: 'Your tattoo is a fresh wound. The body begins its natural healing response.',
    items: [
      'Mild redness and tenderness can be normal.',
      'Keep the tattoo clean.',
      'Follow the covering instructions given by your artist.',
      'Wash gently when instructed.',
      'Pat dry instead of rubbing.',
      'Avoid touching the tattoo unnecessarily.',
    ],
  },
  {
    period: 'Days 4–7',
    title: 'Early Healing',
    desc: 'The skin begins to adjust and the first signs of healing appear.',
    items: [
      'The tattoo may begin to feel dry or itchy.',
      'Light peeling may begin.',
      'Apply a thin layer of the recommended moisturizer.',
      'Do not scratch or pick at the skin.',
      'Continue keeping the tattoo clean.',
    ],
  },
  {
    period: 'Weeks 2–3',
    title: 'Peeling & Recovery',
    desc: 'The outer layer sheds as the skin underneath regenerates.',
    items: [
      'Peeling can continue.',
      'The tattoo may temporarily look dull.',
      'Allow flakes to fall away naturally.',
      'Continue moisturizing as needed.',
      'Avoid deliberately removing peeling skin.',
    ],
  },
  {
    period: 'Weeks 3–4+',
    title: 'Settling In',
    desc: 'The tattoo becomes clearer as the new skin layer settles.',
    items: [
      'The outer layer of skin should gradually settle.',
      'The tattoo should begin to look clearer again.',
      'Continue protecting it from excessive sun exposure.',
      'Use sunscreen once the tattoo is fully healed.',
    ],
  },
];

// ── Do / Don't data ───────────────────────────────────────────────────────────
const DOS = [
  { title: 'Keep It Clean', body: 'Gently wash the tattoo according to your artist\'s instructions.' },
  { title: 'Moisturize Lightly', body: 'Use a suitable fragrance-free moisturizer. Avoid applying excessive product.' },
  { title: 'Let It Breathe', body: 'Wear clean, loose-fitting clothing over the tattoo when possible.' },
  { title: 'Stay Hydrated', body: 'Good general hydration supports healthy skin healing.' },
  { title: 'Let It Heal Naturally', body: 'Allow peeling skin to come off on its own — do not force it.' },
];

const DONTS = [
  { title: "Don't Scratch", body: 'Itching is common during healing. Resist the urge to scratch.' },
  { title: "Don't Pick", body: 'Never peel or pull off flakes or scabs — this can damage the tattoo.' },
  { title: 'Avoid Swimming', body: 'Avoid pools, hot tubs, lakes, oceans, and prolonged soaking while healing.' },
  { title: 'Avoid Direct Sun', body: 'Keep a healing tattoo away from direct sunlight to prevent fading and irritation.' },
  { title: 'Avoid Harsh Products', body: 'Do not use strongly fragranced or irritating products on the tattoo.' },
  { title: 'Avoid Excessive Friction', body: 'Avoid tight clothing or repeated rubbing against the area.' },
];

// ── Normal symptoms accordion data ───────────────────────────────────────────
const NORMAL_ITEMS = [
  { q: 'Mild redness', a: 'Some redness around a fresh tattoo can be expected initially. It typically reduces over the first few days.' },
  { q: 'Tenderness', a: 'The area may feel sensitive and sore for the first few days. This is a normal part of the healing process.' },
  { q: 'Mild itching', a: 'Itching is very common during the healing process as new skin forms. Avoid scratching — pat gently if needed.' },
  { q: 'Peeling', a: 'Light peeling is completely normal during healing. The outer skin sheds to reveal the healed tattoo beneath.' },
  { q: 'Temporary dull appearance', a: 'A healing tattoo can temporarily appear less vibrant or cloudy. This is normal — the colours settle as the skin heals fully.' },
];

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Can I shower with a new tattoo?',
    a: 'Normal showering may be possible depending on your artist\'s instructions — follow their specific guidance. Keep the tattoo out of the direct stream of water and avoid prolonged soaking during the healing period.',
  },
  {
    q: 'Can I exercise?',
    a: 'Follow your artist\'s advice. Avoid activities that cause excessive friction, heavy sweating, or direct contact with the tattoo while it is fresh. Light activity may be fine but consult your artist first.',
  },
  {
    q: 'Can I swim?',
    a: 'Avoid swimming and prolonged soaking — including pools, hot tubs, lakes, and the ocean — until the tattoo has fully healed. Submerging a healing tattoo can introduce bacteria and affect the result.',
  },
  {
    q: 'Why is my tattoo itchy?',
    a: 'Itching is a natural part of the skin\'s healing process. Do not scratch — this can damage the tattoo and introduce bacteria. Patting gently or applying a light moisturizer can help.',
  },
  {
    q: 'Why does my tattoo look dull?',
    a: 'Healing skin can temporarily make a tattoo appear dull, faded, or cloudy. This is normal and expected. As the skin fully settles over several weeks, the colours should become clearer again.',
  },
  {
    q: 'When can I expose my tattoo to sunlight?',
    a: 'Keep a healing tattoo away from direct sunlight. Once the tattoo is fully healed, apply a high-SPF sunscreen before sun exposure to help preserve the colours long-term.',
  },
  {
    q: 'How long does a tattoo take to heal?',
    a: 'Healing varies from person to person and depends on the size, placement, and your individual skin. The outer layer commonly settles over several weeks, though deeper layers can take longer. Follow your artist\'s specific guidance.',
  },
];

// ── Accordion item ────────────────────────────────────────────────────────────
function AccordionItem({ question, answer, index }) {
  const [open, setOpen] = useState(false);
  const id = `accordion-${index}`;

  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 px-1 text-left
                   hover:text-white transition-colors focus:outline-none focus-visible:ring-2
                   focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B]"
      >
        <span className={`text-sm font-medium transition-colors ${open ? 'text-white' : 'text-white/70'}`}>
          {question}
        </span>
        <span
          className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center
                      transition-all duration-200
                      ${open ? 'border-brand-accent bg-brand-accent/10 rotate-45' : 'border-white/20'}`}
          aria-hidden="true"
        >
          <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {open && (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-btn`}
          className="pb-4 px-1"
        >
          <p className="text-white/55 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionEyebrow({ text }) {
  return (
    <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: ACCENT }}>
      {text}
    </p>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Aftercare() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(ellipse, ${ACCENT}, transparent 70%)` }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <SectionEyebrow text="His Inks Studio" />

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Tattoo Aftercare
          </h1>

          <p className="text-xl sm:text-2xl text-white/70 font-display mb-4 leading-snug">
            Take care of your tattoo.<br />
            Let your art heal properly.
          </p>

          <p className="text-white/45 text-base leading-relaxed max-w-xl mx-auto mb-8">
            Your tattoo needs time, care, and patience while it heals. Follow this guide to
            help protect your new tattoo and keep it looking its best.
          </p>

          {/* Healing guide pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/3 text-white/40 text-xs uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} aria-hidden="true" />
            Healing Guide · 4 Weeks
          </div>
        </div>
      </section>

      {/* ── Healing Timeline ──────────────────────────────────────────────── */}
      <section className="py-16 px-6" aria-labelledby="timeline-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionEyebrow text="Week by Week" />
            <h2 id="timeline-heading" className="font-display text-3xl sm:text-4xl text-white mb-3">
              Your Healing Journey
            </h2>
            <p className="text-white/45 text-sm max-w-lg mx-auto leading-relaxed">
              Every tattoo heals differently, but this timeline gives you a general idea of what to expect.
            </p>
          </div>

          {/* Timeline grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8">
            {TIMELINE.map((stage, i) => (
              <div
                key={i}
                className="bg-[#0B0B0B] p-6 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* Period badge */}
                <span
                  className="inline-block self-start text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 border"
                  style={{ color: ACCENT, borderColor: `${ACCENT}40` }}
                >
                  {stage.period}
                </span>

                {/* Stage number */}
                <div className="flex items-center gap-3">
                  <span
                    className="font-display text-4xl font-semibold leading-none opacity-20 select-none"
                    aria-hidden="true"
                    style={{ color: ACCENT }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-lg text-white leading-tight">{stage.title}</h3>
                </div>

                <p className="text-white/35 text-xs leading-relaxed">{stage.desc}</p>

                <ul className="space-y-2 mt-auto" role="list">
                  {stage.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-white/55 text-sm">
                      <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: ACCENT }} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Timeline note */}
          <p className="mt-6 text-center text-white/30 text-xs leading-relaxed max-w-lg mx-auto">
            Healing times vary from person to person. Always follow the specific instructions
            provided by your tattoo artist.
          </p>
        </div>
      </section>

      {/* ── Care For Your Tattoo (Do's) ───────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="care-heading">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <SectionEyebrow text="Care For Your Tattoo" />
            <h2 id="care-heading" className="font-display text-3xl sm:text-4xl text-white">
              What To Do
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8">
            {DOS.map((item, i) => (
              <div
                key={i}
                className="bg-[#0B0B0B] p-6 hover:bg-white/[0.02] transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center mb-4 transition-colors group-hover:border-opacity-60"
                  style={{ borderColor: `${ACCENT}50`, color: ACCENT }}
                  aria-hidden="true"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="font-display text-base text-white mb-2">{item.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What To Avoid (Don'ts) ────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="avoid-heading">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <SectionEyebrow text="What To Avoid" />
            <h2 id="avoid-heading" className="font-display text-3xl sm:text-4xl text-white">
              Things To Avoid
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8">
            {DONTS.map((item, i) => (
              <div
                key={i}
                className="bg-[#0B0B0B] p-6 hover:bg-white/[0.02] transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-full border border-red-500/30 flex items-center justify-center mb-4"
                  aria-hidden="true"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="font-display text-base text-white mb-2">{item.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's Normal — Accordion ─────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="normal-heading">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <SectionEyebrow text="During Healing" />
            <h2 id="normal-heading" className="font-display text-3xl sm:text-4xl text-white">
              What&apos;s Normal?
            </h2>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              These common experiences are a normal part of the healing process.
            </p>
          </div>

          <div className="border border-white/8 px-4">
            {NORMAL_ITEMS.map((item, i) => (
              <AccordionItem key={i} index={`normal-${i}`} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── When To Get Help ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="help-heading">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full border border-red-500/30 bg-red-500/10
                              flex items-center justify-center" aria-hidden="true">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-red-400 mb-1">Important</p>
                <h2 id="help-heading" className="font-display text-2xl text-white">When To Get Help</h2>
              </div>
            </div>

            <p className="text-white/60 text-sm leading-relaxed mb-4">
              If you notice unusual or worsening symptoms, seek advice. Do not ignore symptoms that appear to be getting worse rather than better.
            </p>

            <p className="text-white/45 text-sm mb-5">Consider seeking professional advice if you experience:</p>

            <ul className="space-y-2 mb-6" role="list">
              {[
                'Severe or worsening pain',
                'Significant swelling',
                'Spreading redness',
                'Pus or unusual discharge',
                'Fever',
                'Red streaking from the tattoo',
                'Symptoms that appear to be getting worse rather than better',
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-white/55 text-sm">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>

            <div className="border-t border-red-500/15 pt-5">
              <p className="text-white/45 text-sm leading-relaxed">
                If you&apos;re unsure about how your tattoo is healing,{' '}
                <Link
                  to="/messages"
                  className="underline underline-offset-2 transition-colors hover:text-white"
                  style={{ color: ACCENT }}
                >
                  contact His Inks
                </Link>{' '}
                for guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="faq-heading">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <SectionEyebrow text="FAQ" />
            <h2 id="faq-heading" className="font-display text-3xl sm:text-4xl text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="border border-white/8 px-4">
            {FAQS.map((item, i) => (
              <AccordionItem key={i} index={`faq-${i}`} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Reference ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="quick-heading">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <SectionEyebrow text="Quick Reminder" />
            <h2 id="quick-heading" className="font-display text-3xl text-white">At a Glance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/8">
            {/* Do column */}
            <div className="bg-[#0B0B0B] p-6">
              <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>
                ✓ Do
              </p>
              <ul className="space-y-3" role="list">
                {[
                  'Keep it clean',
                  'Moisturize lightly',
                  'Let it peel naturally',
                  'Wear clean, loose clothing',
                  'Follow your artist\'s instructions',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-white/65 text-sm">
                    <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: ACCENT }} aria-hidden="true">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Don't column */}
            <div className="bg-[#0B0B0B] p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-red-400 mb-4">
                ✗ Don&apos;t
              </p>
              <ul className="space-y-3" role="list">
                {[
                  'Scratch',
                  'Pick',
                  'Soak',
                  'Swim while healing',
                  'Expose a fresh tattoo to direct sun',
                  'Use harsh or strongly fragranced products',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-white/65 text-sm">
                    <span className="mt-0.5 flex-shrink-0 text-red-400 font-bold" aria-hidden="true">✗</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6">
        <div className="max-w-2xl mx-auto">
          <div
            className="relative overflow-hidden rounded-xl border p-8 sm:p-10 text-center"
            style={{ borderColor: `${ACCENT}30`, background: `linear-gradient(135deg, ${ACCENT}08, transparent)` }}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-30"
              style={{ background: ACCENT }}
              aria-hidden="true"
            />
            <div className="relative">
              <SectionEyebrow text="Still Have Questions?" />
              <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">
                Every tattoo heals differently.
              </h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-md mx-auto mb-8">
                If you&apos;re unsure about your tattoo&apos;s healing or need clarification on the aftercare
                instructions provided by your artist, get in touch with His Inks.
              </p>
              <Link to="/messages" className="btn-primary inline-block">
                Contact His Inks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <section className="py-8 px-6 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/20 text-xs leading-relaxed">
            Aftercare guidance is general information and does not replace professional medical advice.
            Always follow the specific aftercare instructions provided by your tattoo artist.
          </p>
        </div>
      </section>
    </div>
  );
}
