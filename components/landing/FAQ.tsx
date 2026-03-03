'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How is CFA Quiz different from other prep providers?',
    answer: 'CFA Quiz uses adaptive learning technology that personalizes your study experience. Our algorithm identifies your weak areas and prioritizes questions accordingly, making your study time more efficient. Plus, our detailed analytics help you track progress and focus on what matters most.',
  },
  {
    question: 'Are the questions aligned with the current CFA curriculum?',
    answer: 'Yes, all our questions are updated annually to align with the latest CFA Institute curriculum. Our content team works closely with CFA charterholders to ensure accuracy and relevance.',
  },
  {
    question: 'Can I use CFA Quiz on my mobile device?',
    answer: 'Absolutely! CFA Quiz is fully responsive and works seamlessly on all devices. Study on your commute, during breaks, or anywhere you have internet access.',
  },
  {
    question: 'How does the free trial work?',
    answer: 'Our 7-day free trial gives you full access to all features including practice questions, mock exams, and analytics. No credit card required to start. Cancel anytime during the trial period.',
  },
  {
    question: 'Do you offer mock exams that simulate the real CFA exam?',
    answer: 'Yes, we offer full-length mock exams that mirror the actual CFA exam format, timing, and difficulty level. You\'ll receive detailed performance reports after each mock exam to identify areas for improvement.',
  },
  {
    question: 'How does the spaced repetition system work?',
    answer: 'Our spaced repetition system automatically schedules reviews of questions you\'ve answered incorrectly at optimal intervals. This scientifically-proven technique helps strengthen long-term retention of complex concepts and formulas.',
  },
  {
    question: 'Can I track my progress over time?',
    answer: 'Yes, our comprehensive analytics dashboard shows your performance trends, subject-wise breakdown, time efficiency metrics, and comparison with other candidates. You can also see your predicted pass probability based on your practice performance.',
  },
  {
    question: 'What if I need help or have questions?',
    answer: 'Our support team is available via email and live chat. We typically respond within 24 hours. You can also access our extensive knowledge base and community forums for quick answers.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white">
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
            FAQ
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600">
            Everything you need to know about CFA Quiz
          </p>
        </motion.div>

        {/* FAQ List - Minimal Style */}
        <div className="max-w-3xl mx-auto">
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border border-slate-100 rounded-xl overflow-hidden bg-white hover:border-slate-200 transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left group"
                >
                  <span className="text-base font-medium text-slate-900 pr-4 group-hover:text-emerald-600 transition-colors">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className={`w-5 h-5 transition-colors ${openIndex === index ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5">
                        <p className="text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Help CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span className="text-slate-600">Still have questions?</span>
            <a href="mailto:support@cfaquiz.com" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
