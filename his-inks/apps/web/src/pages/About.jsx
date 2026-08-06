import { Link } from 'react-router-dom';

const VALUES = [
  {
    title: 'Custom Only',
    desc: 'Every design is created exclusively for you. No flash, no repeats — your tattoo belongs to you alone.',
  },
  {
    title: 'Fine Craftsmanship',
    desc: 'Using premium inks and sterile, single-use equipment. Your safety and the quality of the work are non-negotiable.',
  },
  {
    title: 'Collaborative Process',
    desc: 'We sit down together before every session to make sure the design perfectly captures your vision.',
  },
  {
    title: 'Lasting Art',
    desc: 'Techniques chosen to age gracefully on your skin — so your tattoo looks as good in 20 years as the day it was done.',
  },
];

function About() {
  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-20">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-4">Our Story</p>
          <h1 className="font-display text-5xl md:text-6xl mb-6">About His Inks</h1>
          <p className="text-white/40 max-w-xl mx-auto leading-relaxed text-lg">
            A private tattoo studio built on one principle — that permanent art deserves permanent care.
          </p>
        </div>

        {/* Story section */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">The Studio</p>
            <h2 className="font-display text-3xl md:text-4xl mb-6 leading-snug">
              Where skin becomes a canvas
            </h2>
            <div className="space-y-4 text-white/50 leading-relaxed">
              <p>
                His Inks Studio was born from a passion for fine art and the belief that tattoos are one
                of the most intimate forms of self-expression. Every mark made is deliberate, every line
                considered.
              </p>
              <p>
                Operating as a private, appointment-only studio, we offer each client our undivided
                attention. There are no walk-ins, no rush jobs — just dedicated time and craft given to
                your piece.
              </p>
              <p>
                From delicate fine-line work to bold realism, the studio specialises in custom designs
                that are as individual as the person wearing them.
              </p>
            </div>
          </div>
          {/* Placeholder */}
          <div className="aspect-[4/5] bg-white/5 border border-white/10 flex items-center justify-center">
            <p className="text-white/20 text-sm tracking-widest uppercase">Studio Photo</p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-3">What We Stand For</p>
            <h2 className="font-display text-3xl">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title}
                className="border border-white/10 p-7 hover:border-brand-accent/40 transition-colors duration-300">
                <div className="w-8 h-px bg-brand-accent mb-5" />
                <h3 className="font-display text-lg mb-3">{v.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="mb-24 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-3">How It Works</p>
            <h2 className="font-display text-3xl">The Process</h2>
          </div>
          <div className="space-y-0">
            {[
              { step: '01', title: 'Submit a Request', desc: 'Fill out the booking form with your tattoo idea, placement, and preferred date.' },
              { step: '02', title: 'Consultation', desc: "We'll reach out to discuss your vision, answer questions, and finalise the design concept." },
              { step: '03', title: 'Design Review', desc: 'A custom design is created for your approval before the session begins.' },
              { step: '04', title: 'Your Session', desc: "We create your tattoo in a clean, private environment with your full comfort in mind." },
              { step: '05', title: 'Aftercare', desc: "We provide full aftercare instructions and a complimentary touch-up if needed." },
            ].map((item, i, arr) => (
              <div key={item.step} className={`flex gap-6 ${i < arr.length - 1 ? 'pb-8' : ''}`}>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border border-brand-accent/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-accent text-xs font-mono">{item.step}</span>
                  </div>
                  {i < arr.length - 1 && <div className="flex-1 w-px bg-white/10 mt-2" />}
                </div>
                <div className="pb-2">
                  <h3 className="text-white font-medium mb-1">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border border-white/8 py-16 px-8">
          <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">Ready?</p>
          <h2 className="font-display text-3xl mb-5">Start your tattoo journey</h2>
          <p className="text-white/40 mb-8 max-w-sm mx-auto">
            Every great tattoo starts with a conversation. Let&apos;s talk about yours.
          </p>
          <Link to="/book" className="btn-primary">Book a Consultation</Link>
        </div>
      </div>
    </div>
  );
}

export default About;
