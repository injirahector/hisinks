import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Design tokens ─────────────────────────────────────────────────────────────
const ACCENT = '#C49A44';

// ── Checklist cards data ──────────────────────────────────────────────────────
const CHECKLIST = [
  {
    number: '01',
    title: 'Get a Good Night\'s Sleep',
    body: 'A well-rested body can make a long tattoo session easier to handle. Try to get a good night\'s sleep before your appointment.',
  },
  {
    number: '02',
    title: 'Eat Before Your Appointment',
    body: 'Have a proper meal before your appointment, especially if your session will be long. Avoid arriving on an empty stomach. For longer sessions, consider bringing a small snack.',
  },
  {
    number: '03',
    title: 'Stay Hydrated',
    body: 'Drink enough water before your appointment and stay hydrated throughout the day. Good hydration supports your overall comfort during the session.',
  },
  {
    number: '04',
    title: 'Wear Comfortable Clothing',
    body: 'Choose clothing that provides easy access to the tattoo area and is comfortable for sitting through a long session. For example: a thigh tattoo? Consider loose shorts. A back tattoo? Wear something with easy access to the area.',
  },
  {
    number: '05',
    title: 'Keep the Tattoo Area Clean',
    body: 'Arrive with clean skin around the tattoo area. Avoid applying heavy lotions, oils, or products immediately before your appointment unless your artist has instructed you to do so.',
  },
  {
    number: '06',
    title: 'Avoid Sunburn & Irritated Skin',
    body: 'Avoid excessive sun exposure before your appointment. If the tattoo area is sunburned, irritated, or damaged, contact His Inks before your appointment.',
  },
  {
    number: '07',
    title: 'Avoid Alcohol',
    body: 'Avoid alcohol before your tattoo appointment. Arriving under the influence may affect your ability to safely participate in the session and may result in your appointment being postponed.',
  },
  {
    number: '08',
    title: 'Bring What You Need',
    body: 'Make sure you have everything you need for the day.',
    isList: true,
    items: [
      'Identification, if requested by the studio',
      'Booking confirmation',
      'Payment method',
      'Phone / charger',
      'Water',
      'Small snack for longer sessions',
      'Reference images, if discussing a custom tattoo',
    ],
  },
];

// ── Things to avoid data ──────────────────────────────────────────────────────
const AVOID_ITEMS = [
  {
    title: "Don't Arrive Hungry",
    body: 'Eat before your appointment. An empty stomach can make your session more uncomfortable.',
  },
  {
    title: "Don't Arrive Intoxicated",
    body: 'Do not arrive under the influence of alcohol or recreational drugs.',
  },
  {
    title: "Don't Sunburn the Area",
    body: 'Avoid excessive sun exposure on the tattoo area before your appointment.',
  },
  {
    title: "Don't Apply Heavy Products",
    body: 'Avoid heavy lotions, oils, or other products on the tattoo area unless your artist has instructed you otherwise.',
  },
  {
    title: 'Check the Guest Policy',
    body: "Please check the studio's guest policy before bringing additional people to your appointment.",
  },
];

// ── Design preparation data ───────────────────────────────────────────────────
const DESIGN_TIPS = [
  {
    title: 'Bring Reference Images',
    body: 'Save a few examples of styles, elements, or compositions you like. References help communicate the style, composition, and overall direction you have in mind.',
  },
  {
    title: 'Know Your Preferred Placement',
    body: "Be ready to discuss where you'd like the tattoo placed on your body.",
  },
  {
    title: 'Consider Size',
    body: "Have an approximate idea of the size you want, while remaining open to your artist's recommendations.",
  },
  {
    title: 'Be Open to Professional Guidance',
    body: 'Your artist may recommend adjustments to size, placement, or composition to help the tattoo work well on your body.',
  },
];

// ── What to expect steps ──────────────────────────────────────────────────────
const PROCESS_STEPS = [
  { step: '01', title: 'Consultation', desc: 'A brief discussion about your tattoo idea and what you have in mind.' },
  { step: '02', title: 'Design Discussion', desc: 'Review of the design, style, and direction with your artist.' },
  { step: '03', title: 'Placement & Sizing', desc: 'Deciding where the tattoo will be placed and finalising the size.' },
  { step: '04', title: 'Preparation', desc: 'The area is cleaned and prepared for the session.' },
  { step: '05', title: 'Tattoo Session', desc: 'Your tattoo is applied. Duration varies depending on the design.' },
  { step: '06', title: 'Final Review', desc: 'You review the finished tattoo with your artist.' },
  { step: '07', title: 'Aftercare Instructions', desc: 'Your artist explains how to care for your new tattoo while it heals.' },
];

// ── Quick checklist items ─────────────────────────────────────────────────────
const QUICK_CHECKLIST = [
  'Get enough rest',
  'Eat a proper meal',
  'Stay hydrated',
  'Wear suitable clothing',
  'Keep the tattoo area clean',
  'Bring your reference images',
  'Check your appointment time',
  'Confirm your appointment location',
  'Avoid alcohol / intoxication',
  'Contact His Inks if something changes',
];

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Should I eat before my tattoo?',
    a: "Yes. Having a proper meal before your appointment helps keep your energy and comfort levels stable during the session. Avoid arriving on an empty stomach, especially for longer appointments.",
  },
  {
    q: 'Can I drink alcohol before my appointment?',
    a: "We recommend avoiding alcohol before your appointment. Arriving under the influence may affect your ability to safely participate and may result in the session being postponed.",
  },
  {
    q: 'What should I wear?',
    a: 'Wear comfortable clothing that provides practical access to the tattoo area. For example, loose shorts for a thigh tattoo, or a top with easy back access for a back tattoo.',
  },
  {
    q: 'Can I bring reference images?',
    a: 'Absolutely. References help communicate the style, composition, and overall direction you have in mind. Save images of styles, elements, or compositions you like and bring them along.',
  },
  {
    q: 'What if my tattoo area gets sunburned?',
    a: "Contact His Inks before your appointment if the tattoo area is sunburned, irritated, or damaged. It's better to reschedule than to tattoo compromised skin.",
  },
  {
    q: "What if I'm sick before my appointment?",
    a: 'Contact His Inks as soon as possible if you are unwell or unable to attend. Please do not come to your appointment feeling significantly unwell.',
  },
  {
    q: 'Can I bring someone with me?',
    a: "Please check the studio's guest policy before bringing additional people to your appointment.",
  },
  {
    q: "What if I'm running late?",
    a: 'Contact His Inks immediately if you are running late. Tattoo appointments are scheduled around specific time slots, so please get in touch as soon as possible.',
  },
];

// ── Accordion item ────────────────────────────────────────────────────────────
function AccordionItem({ question, answer, index }) {
  const [open, setOpen] = useState(false);
  const id = `ba-accordion-${index}`;

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

// ── Section eyebrow label ─────────────────────────────────────────────────────
function SectionEyebrow({ text }) {
  return (
    <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: ACCENT }}>
      {text}
    </p>
  );
}


// ── Main page component ───────────────────────────────────────────────────────
export default function BeforeAppointment() {
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
            Before Your Appointment
          </h1>

          <p className="text-xl sm:text-2xl text-white/70 font-display mb-4 leading-snug">
            Prepare for your tattoo.
          </p>

          <p className="text-white/45 text-base leading-relaxed max-w-xl mx-auto mb-8">
            A little preparation goes a long way. Follow these simple steps before your His Inks
            appointment so you arrive comfortable, prepared, and ready for your session.
          </p>

          {/* Guide pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/3 text-white/40 text-xs uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} aria-hidden="true" />
            Preparation Guide &middot; His Inks Studio
          </div>
        </div>
      </section>

      {/* ── Pre-Appointment Checklist ──────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="checklist-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionEyebrow text="Preparation" />
            <h2 id="checklist-heading" className="font-display text-3xl sm:text-4xl text-white mb-3">
              Your Pre-Appointment Checklist
            </h2>
            <p className="text-white/45 text-sm max-w-lg mx-auto leading-relaxed">
              Follow these steps in the days and hours leading up to your appointment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8">
            {CHECKLIST.map((item, i) => (
              <div
                key={i}
                className="bg-[#0B0B0B] p-6 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Number */}
                <span
                  className="font-display text-4xl font-semibold leading-none opacity-20 select-none"
                  aria-hidden="true"
                  style={{ color: ACCENT }}
                >
                  {item.number}
                </span>

                <h3 className="font-display text-base text-white leading-snug">{item.title}</h3>

                {item.isList ? (
                  <>
                    <p className="text-white/45 text-sm leading-relaxed">{item.body}</p>
                    <ul className="space-y-1.5 mt-1" role="list">
                      {item.items.map((li, j) => (
                        <li key={j} className="flex items-start gap-2 text-white/55 text-sm">
                          <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: ACCENT }} aria-hidden="true" />
                          {li}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-white/45 text-sm leading-relaxed">{item.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tattoo Design Preparation ─────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="design-heading">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <SectionEyebrow text="Custom Tattoo" />
            <h2 id="design-heading" className="font-display text-3xl sm:text-4xl text-white mb-3">
              Your Tattoo Idea
            </h2>
            <p className="text-white/45 text-sm max-w-lg leading-relaxed">
              If you are getting a custom tattoo, come prepared to discuss your idea. Reference
              images can help communicate the style, composition, and overall direction you have in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8">
            {DESIGN_TIPS.map((tip, i) => (
              <div
                key={i}
                className="bg-[#0B0B0B] p-6 hover:bg-white/[0.02] transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center mb-4"
                  style={{ borderColor: `${ACCENT}50`, color: ACCENT }}
                  aria-hidden="true"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="font-display text-base text-white mb-2">{tip.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Things to Avoid ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="avoid-heading">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <SectionEyebrow text="Important" />
            <h2 id="avoid-heading" className="font-display text-3xl sm:text-4xl text-white">
              Things to Avoid
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8">
            {AVOID_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-[#0B0B0B] p-6 hover:bg-white/[0.02] transition-colors"
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


      {/* ── Appointment Location ──────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="location-heading">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <SectionEyebrow text="Location" />
            <h2 id="location-heading" className="font-display text-3xl sm:text-4xl text-white">
              Your Appointment Location
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/8">
            {/* Studio */}
            <div className="bg-[#0B0B0B] p-8 hover:bg-white/[0.02] transition-colors">
              <div
                className="w-10 h-10 rounded-full border flex items-center justify-center mb-5"
                style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
                aria-hidden="true"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
                </svg>
              </div>
              <span
                className="inline-block text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 border mb-4"
                style={{ color: ACCENT, borderColor: `${ACCENT}40` }}
              >
                Studio Appointment
              </span>
              <p className="text-white/55 text-sm leading-relaxed">
                If your appointment is at the studio, arrive a few minutes early so you have time
                to settle in before your session begins.
              </p>
            </div>

            {/* House Call */}
            <div className="bg-[#0B0B0B] p-8 hover:bg-white/[0.02] transition-colors">
              <div
                className="w-10 h-10 rounded-full border flex items-center justify-center mb-5"
                style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
                aria-hidden="true"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <span
                className="inline-block text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 border mb-4"
                style={{ color: ACCENT, borderColor: `${ACCENT}40` }}
              >
                House Call
              </span>
              <p className="text-white/55 text-sm leading-relaxed mb-3">
                For house-call appointments, make sure the agreed location is ready and that there
                is a clean, comfortable area suitable for the tattoo session.
              </p>
              <p className="text-white/40 text-sm leading-relaxed">
                Keep pets and unnecessary distractions away from the work area where possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Arrive on Time ────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="timing-heading">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/8">
            <div className="bg-[#0B0B0B] p-8">
              <SectionEyebrow text="Punctuality" />
              <h2 id="timing-heading" className="font-display text-3xl sm:text-4xl text-white mb-4">
                Arrive on Time
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-4">
                Tattoo appointments are scheduled around specific time slots. Please arrive on time
                and allow yourself enough time to get ready before your session begins.
              </p>
              <p className="text-white/40 text-sm leading-relaxed">
                Arriving a few minutes early is always a good idea.
              </p>
            </div>

            <div className="bg-[#0B0B0B] p-8 flex flex-col justify-center">
              <div
                className="rounded-lg border p-6"
                style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}08` }}
              >
                <p className="font-display text-white text-lg mb-2">Running late?</p>
                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  Contact His Inks as soon as possible so we can accommodate your situation.
                </p>
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: ACCENT }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Message His Inks
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What to Expect ────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="expect-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionEyebrow text="The Session" />
            <h2 id="expect-heading" className="font-display text-3xl sm:text-4xl text-white mb-3">
              What to Expect
            </h2>
            <p className="text-white/45 text-sm max-w-lg mx-auto leading-relaxed">
              Here is a general overview of how your appointment will typically flow.
              Exact duration varies depending on the design and your individual session.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8">
            {PROCESS_STEPS.map((s, i) => (
              <div
                key={i}
                className="bg-[#0B0B0B] p-6 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <span
                  className="font-display text-4xl font-semibold leading-none opacity-20 select-none"
                  aria-hidden="true"
                  style={{ color: ACCENT }}
                >
                  {s.step}
                </span>
                <h3 className="font-display text-base text-white leading-snug">{s.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Checklist ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="quick-heading">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <SectionEyebrow text="Quick Reference" />
            <h2 id="quick-heading" className="font-display text-3xl text-white">
              Ready for Your Appointment?
            </h2>
          </div>

          <div
            className="border rounded-xl p-6 sm:p-8"
            style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}06` }}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3" role="list">
              {QUICK_CHECKLIST.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                  <span
                    className="mt-0.5 flex-shrink-0 font-bold"
                    style={{ color: ACCENT }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
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
              <AccordionItem key={i} index={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Please Note ───────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/6" aria-labelledby="notice-heading">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-white/10 bg-white/3 p-8">
            <div className="flex items-start gap-4 mb-4">
              <div
                className="flex-shrink-0 w-9 h-9 rounded-full border flex items-center justify-center"
                style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
                aria-hidden="true"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] mb-1" style={{ color: ACCENT }}>Please Note</p>
                <h2 id="notice-heading" className="font-display text-xl text-white">General Guidance</h2>
              </div>
            </div>
            <p className="text-white/55 text-sm leading-relaxed">
              Every tattoo and appointment is different. The guidance on this page is general
              preparation information. Always follow the specific instructions provided by your
              His Inks artist.
            </p>
          </div>
        </div>
      </section>

      {/* ── After Your Appointment — Aftercare CTA ────────────────────────── */}
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
              <SectionEyebrow text="After Your Appointment" />
              <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">
                Aftercare is just as important.
              </h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-md mx-auto mb-8">
                Once your tattoo session is complete, proper aftercare is essential. Learn how to
                care for your new tattoo while it heals.
              </p>
              <Link to="/aftercare" className="btn-primary inline-block">
                View Aftercare Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── View My Bookings CTA ──────────────────────────────────────────── */}
      <section className="py-8 px-6 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/40 text-sm mb-3">
            Want to check your upcoming appointment?
          </p>
          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: ACCENT }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            View My Bookings
          </Link>
        </div>
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <section className="py-8 px-6 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/20 text-xs leading-relaxed">
            Preparation guidance is general information and does not replace advice from your
            tattoo artist. Always follow the specific instructions provided by your His Inks artist.
          </p>
        </div>
      </section>

    </div>
  );
}
