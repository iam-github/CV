import Hero from "@/components/Hero";
import Manifest from "@/components/Manifest";
import WorkDrum from "@/components/WorkDrum";
import Achievements from "@/components/Achievements";
import ClientsStrip from "@/components/ClientsStrip";
import Skills from "@/components/Skills";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Manifest />
      <WorkDrum />
      <Achievements />
      <ClientsStrip />
      <Skills />
      <Footer />
    </main>
  );
}
