function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-brand-accent font-display tracking-widest uppercase text-sm">
          His Inks Studio
        </p>
        <p className="text-white/30 text-xs tracking-wider">
          &copy; {new Date().getFullYear()} His Inks Studio. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
