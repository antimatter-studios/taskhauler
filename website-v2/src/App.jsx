import Nav from './sections/Nav.jsx';
import Hero from './sections/Hero.jsx';
import Marquee from './sections/Marquee.jsx';
import Manifesto from './sections/Manifesto.jsx';
import Views from './sections/Views.jsx';
import Features from './sections/Features.jsx';
import Agentic from './sections/Agentic.jsx';
import Architecture from './sections/Architecture.jsx';
import WhyUse from './sections/WhyUse.jsx';
import WhyNot from './sections/WhyNot.jsx';
import Comparison from './sections/Comparison.jsx';
import FAQ from './sections/FAQ.jsx';
import CTA from './sections/CTA.jsx';
import Footer from './sections/Footer.jsx';

export default function App() {
  return (
    <div className="min-h-screen relative">
      <Nav />
      <Hero />
      <Marquee />
      <Manifesto />
      <Views />
      <Features />
      <Agentic />
      <Architecture />
      <WhyUse />
      <WhyNot />
      <Comparison />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
