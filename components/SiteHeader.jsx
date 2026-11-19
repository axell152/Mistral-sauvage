'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SECTIONS } from '../lib/sections';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (slug) => pathname === `/${slug}` || pathname.startsWith(`/${slug}/`);
  const linkClass = (active) =>
    `text-sm font-medium transition ${active ? 'text-white underline underline-offset-4 decoration-2' : 'text-[#E9DFC3] hover:text-white'}`;

  return (
    <header className="sticky top-0 z-50 bg-[#244738] border-b border-[#1B352A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
          <img src="/logo-header.png" alt="Mistral sauvage" className="h-20 w-auto" />
        </Link>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {SECTIONS.map((s) => (
            <Link key={s.slug} href={`/${s.slug}`} className={linkClass(isActive(s.slug))}>
              {s.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="text-sm font-semibold bg-[#BCAA7C] hover:bg-[#CDBE96] text-[#244738] px-4 py-2 rounded-xl transition"
          >
            Contact
          </Link>
        </nav>

        {/* Bouton burger mobile */}
        <button
          type="button"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="md:hidden w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[#E9DFC3] text-xl"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav className="md:hidden bg-[#244738] border-t border-[#1B352A] px-4 py-4 flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              onClick={() => setOpen(false)}
              className={`${linkClass(isActive(s.slug))} py-1`}
            >
              {s.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="text-sm font-semibold bg-[#BCAA7C] text-[#244738] px-4 py-2.5 rounded-xl text-center"
          >
            Contact
          </Link>
        </nav>
      )}
    </header>
  );
}
