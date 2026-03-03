'use client';

import { motion } from 'framer-motion';
import { 
  Brain, 
  BarChart2, 
  Clock, 
  Target, 
  Repeat, 
  Lightbulb,
  CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Adaptive Learning',
    description: 'Our algorithm identifies your weak areas and prioritizes questions to maximize learning efficiency.',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    icon: BarChart2,
    title: 'Detailed Analytics',
    description: 'Track your progress with comprehensive performance metrics and identify areas for improvement.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Clock,
    title: 'Timed Practice',
    description: 'Simulate real exam conditions with timed sessions to build speed and confidence.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    icon: Target,
    title: 'Exam-Quality Questions',
    description: 'Practice with questions that match the difficulty and format of the actual CFA exam.',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: Repeat,
    title: 'Spaced Repetition',
    description: 'Review wrong answers at optimal intervals to strengthen long-term retention.',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    icon: Lightbulb,
    title: 'Expert Explanations',
    description: 'Every question includes detailed explanations to deepen your understanding of concepts.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
];

const benefits = [
  '5,000+ practice questions',
  'Full mock exams included',
  'Mobile-friendly access',
  'Updated for 2024 curriculum',
  'Performance heatmaps',
  'Study streak tracking',
];

export default function WhyTrustUs() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50">
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
            Why Choose Us
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Designed for CFA Success
          </h2>
          <p className="text-lg text-slate-600">
            Our platform combines proven study techniques with cutting-edge technology to help you pass
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300"
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-slate-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
