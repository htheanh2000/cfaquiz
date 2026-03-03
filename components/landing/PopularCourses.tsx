'use client';

import { motion } from 'framer-motion';
import { Clock, BookOpen, Users, ArrowRight, Zap, Trophy, Star } from 'lucide-react';
import Link from 'next/link';

const studyPlans = [
  {
    id: 1,
    name: 'CFA Level I',
    subtitle: 'Foundation Program',
    duration: '6 months',
    questions: '2,500+',
    enrolled: '8,500+',
    features: ['All 10 subject areas', 'Mock exams included', 'Progress tracking'],
    badge: 'Most Popular',
    badgeColor: 'bg-emerald-500',
    highlight: true,
  },
  {
    id: 2,
    name: 'CFA Level II',
    subtitle: 'Intermediate Program',
    duration: '6 months',
    questions: '1,800+',
    enrolled: '4,200+',
    features: ['Vignette-style questions', 'Case studies', 'Performance analytics'],
    badge: null,
    badgeColor: null,
    highlight: false,
  },
  {
    id: 3,
    name: 'CFA Level III',
    subtitle: 'Advanced Program',
    duration: '6 months',
    questions: '1,200+',
    enrolled: '2,100+',
    features: ['Essay questions', 'Portfolio management focus', 'Expert feedback'],
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-400',
    highlight: false,
  },
];

const quickPractice = [
  { name: 'Ethics Quick Quiz', questions: 25, time: '30 min', icon: Star },
  { name: 'Quant Speed Drill', questions: 15, time: '20 min', icon: Zap },
  { name: 'FSA Deep Dive', questions: 40, time: '60 min', icon: BookOpen },
  { name: 'Full Mock Exam', questions: 180, time: '4.5 hrs', icon: Trophy },
];

export default function PopularCourses() {
  return (
    <section className="py-20 lg:py-28 bg-white">
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
            Study Plans
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Choose Your CFA Level
          </h2>
          <p className="text-lg text-slate-600">
            Comprehensive study plans designed for each level of the CFA exam
          </p>
        </motion.div>

        {/* Study Plans - Card Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          {studyPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 ${
                plan.highlight 
                  ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10' 
                  : 'border border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-6 px-3 py-1 ${plan.badgeColor} text-white text-xs font-medium rounded-full`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-500">{plan.subtitle}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{plan.duration}</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <BookOpen className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{plan.questions}</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{plan.enrolled}</div>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/login"
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  plan.highlight
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {plan.badge === 'Coming Soon' ? 'Notify Me' : 'Start Learning'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Practice Section - Minimal List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Practice Sessions</h3>
          <div className="space-y-2">
            {quickPractice.map((session, index) => {
              const Icon = session.icon;
              return (
                <motion.div
                  key={session.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    <span className="font-medium text-slate-700">{session.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{session.questions} questions</span>
                    <span className="text-slate-300">|</span>
                    <span>{session.time}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
