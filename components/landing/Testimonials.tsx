'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Michael Chen',
    role: 'CFA Level I Candidate',
    company: 'Investment Banking Analyst',
    avatar: 'MC',
    rating: 5,
    quote: 'The adaptive learning feature identified my weak spots in Quantitative Methods. After focused practice, I improved my mock exam scores by 25%.',
    passed: true,
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    role: 'CFA Level II Candidate',
    company: 'Portfolio Manager',
    avatar: 'SJ',
    rating: 5,
    quote: 'What sets CFA Quiz apart is the quality of explanations. Every wrong answer became a learning opportunity. Passed Level I on my first attempt!',
    passed: true,
  },
  {
    id: 3,
    name: 'David Park',
    role: 'CFA Level I Candidate',
    company: 'Equity Research Associate',
    avatar: 'DP',
    rating: 5,
    quote: 'The spaced repetition system helped me retain complex formulas. The performance analytics showed exactly where I needed more practice.',
    passed: true,
  },
  {
    id: 4,
    name: 'Emily Zhang',
    role: 'CFA Charterholder',
    company: 'Risk Manager',
    avatar: 'EZ',
    rating: 5,
    quote: 'Used CFA Quiz for all three levels. The mock exams were incredibly close to the actual exam format and difficulty. Highly recommended!',
    passed: true,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-slate-50">
      <div className="container mx-auto px-4 lg:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-full mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Hear From Our Candidates
          </h2>
          <p className="text-lg text-slate-600">
            Join thousands of successful CFA candidates who prepared with our platform
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          {/* Main Testimonial Card */}
          <div className="relative mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-slate-100"
              >
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-emerald-100 mb-6" />

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-lg lg:text-xl text-slate-700 leading-relaxed mb-8">
                  "{testimonials[currentIndex].quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonials[currentIndex].avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {testimonials[currentIndex].name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {testimonials[currentIndex].role}
                      </div>
                    </div>
                  </div>
                  {testimonials[currentIndex].passed && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      Passed
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevTestimonial}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </motion.button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    currentIndex === index
                      ? 'w-6 bg-emerald-500'
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextTestimonial}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </motion.button>
          </div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { value: '89%', label: 'Pass Rate' },
            { value: '15K+', label: 'Active Users' },
            { value: '4.8/5', label: 'User Rating' },
            { value: '50K+', label: 'Exams Taken' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center p-4"
            >
              <div className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
