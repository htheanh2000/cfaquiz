'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Award, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

const benefits = [
  { icon: Award, text: '7-day free trial' },
  { icon: Shield, text: 'No credit card required' },
  { icon: Zap, text: 'Cancel anytime' },
];

export default function CTA() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[128px] opacity-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full blur-[128px] opacity-10" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full mb-8"
          >
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-300">Join 15,000+ successful candidates</span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl lg:text-5xl font-bold text-white mb-6"
          >
            Ready to Pass Your
            <br />
            <span className="text-emerald-400">CFA Exam?</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 mb-10 max-w-xl mx-auto"
          >
            Start practicing today with our comprehensive question bank and join thousands of candidates who passed with CFA Quiz.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-all duration-200 font-medium text-lg shadow-lg shadow-emerald-500/25"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.text} className="flex items-center gap-2 text-slate-400">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{benefit.text}</span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
