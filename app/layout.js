import { Oswald, JetBrains_Mono, Inter, PT_Serif, Caveat } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";
import Cursor from "@/components/Cursor";
import Curtain from "@/components/Curtain";
import { PERSON } from "@/lib/data";

// Temporary Cyrillic-capable fonts, see TODO.md
const display = Oswald({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const serif = PT_Serif({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  weight: "400",
  style: "italic",
});

// handwritten face for the hero stickers
const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin", "cyrillic"],
});

export const metadata = {
  title: `${PERSON.name} — ${PERSON.role.toLowerCase()}`,
  description: `${PERSON.role}, ${PERSON.experience} опыта в управлении проектами`,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ru"
      className={`${display.variable} ${mono.variable} ${body.variable} ${serif.variable} ${hand.variable}`}
    >
      <body>
        <Header />
        <SmoothScroll>{children}</SmoothScroll>
        <Cursor />
        <Curtain />
      </body>
    </html>
  );
}
