import Navbar from "../layout/navbar";
import Footer from "../layout/footer";
import Hero from "./hero";
import HowItWorks from "./how-it-works";
import FaqContact from "./faq-contact";

export default function Landing() {
  return (
    <div
      id="top"
      className="flex min-h-dvh flex-col bg-indigo-surface"
    >
      <Navbar showDeleteData={false} showStartCta />

      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <div className="contact-gradient -mt-6 rounded-t-[24px]">
          <FaqContact />
          <Footer variant="landing" />
        </div>
      </main>
    </div>
  );
}
