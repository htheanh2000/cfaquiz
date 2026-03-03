import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import CourseCategories from '@/components/landing/CourseCategories';
import WhyTrustUs from '@/components/landing/WhyTrustUs';
import PopularCourses from '@/components/landing/PopularCourses';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content">
        <Hero />
        <CourseCategories />
        <WhyTrustUs />
        <PopularCourses />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
