'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Award, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: 'Pass Rate', value: '89%', icon: TrendingUp },
  { label: 'Active Learners', value: '15K+', icon: Users },
  { label: 'Questions', value: '5000+', icon: Sparkles },
];

const features = [
  'Adaptive learning algorithm',
  'Real exam simulation',
  'Performance analytics',
  'Expert explanations',
];

export default function Hero() {
  return (
    <section id="home" className="relative pt-28 lg:pt-36 pb-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full mb-6"
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-medium">
              Trusted by 15,000+ CFA Candidates
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight tracking-tight"
          >
            Master the CFA Exam
            <br />
            <span className="text-emerald-600">With Confidence</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg lg:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Practice with thousands of exam-quality questions, track your progress with 
            detailed analytics, and pass your CFA exam on the first attempt.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/login"
              className="group flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg shadow-emerald-600/20"
            >
              Start Practicing Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#programs"
              className="px-8 py-4 text-slate-700 border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 font-medium"
            >
              View Study Plans
            </Link>
          </motion.div>

          {/* Feature List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-x-6 gap-y-3"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-2 text-slate-600"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 max-w-3xl mx-auto"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-slate-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-500">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-100 rounded-full blur-[128px] opacity-30 pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-100 rounded-full blur-[128px] opacity-30 pointer-events-none" />
      </div>
    </section>
  );
}
