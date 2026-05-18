import Hero from './sections/Hero'
import Why from './sections/Why'
import Features from './sections/Features'
import HowItWorks from './sections/HowItWorks'
import Footer from './sections/Footer'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Hero />
      <Why />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  )
}
