'use client';

import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Building2, 
  PieChart, 
  Landmark,
  Layers,
  Briefcase,
  Scale,
  Award
} from 'lucide-react';

const subjects = [
  {
    icon: BarChart3,
    code: 'QUANT',
    title: 'Quantitative Methods',
    description: 'Time value of money, statistics, probability',
    questionCount: 450,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    icon: TrendingUp,
    code: 'ECON',
    title: 'Economics',
    description: 'Microeconomics, macroeconomics, global markets',
    questionCount: 380,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    icon: FileText,
    code: 'FSA',
    title: 'Financial Statement Analysis',
    description: 'Financial reporting, income statements, ratios',
    questionCount: 520,
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    icon: Building2,
    code: 'CORP',
    title: 'Corporate Issuers',
    description: 'Corporate governance, capital structure',
    questionCount: 320,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    icon: PieChart,
    code: 'EQUITY',
    title: 'Equity Investments',
    description: 'Security analysis, industry analysis, valuation',
    questionCount: 480,
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-600',
  },
  {
    icon: Landmark,
    code: 'FIXED',
    title: 'Fixed Income',
    description: 'Bond valuation, yield measures, credit analysis',
    questionCount: 510,
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
  },
  {
    icon: Layers,
    code: 'DERIV',
    title: 'Derivatives',
    description: 'Options, futures, swaps, hedging strategies',
    questionCount: 350,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    icon: Briefcase,
    code: 'ALT',
    title: 'Alternative Investments',
    description: 'Real estate, hedge funds, private equity',
    questionCount: 280,
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
  {
    icon: PieChart,
    code: 'PM',
    title: 'Portfolio Management',
    description: 'Modern portfolio theory, asset allocation',
    questionCount: 420,
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    icon: Scale,
    code: 'ETHICS',
    title: 'Ethics & Standards',
    description: 'Code of ethics, professional standards, GIPS',
    questionCount: 390,
    color: 'bg-teal-500',
    lightColor: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function CourseCategories() {
  return (
    <section id="programs" className="py-20 lg:py-28 bg-white">
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
            CFA Curriculum
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Complete Topic Coverage
          </h2>
          <p className="text-lg text-slate-600">
            Practice questions across all 10 CFA subject areas, aligned with the latest curriculum
          </p>
        </motion.div>

        {/* Subjects Grid - Minimal List Style */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="space-y-3">
            {subjects.map((subject, index) => {
              const Icon = subject.icon;
              return (
                <motion.div
                  key={subject.code}
                  variants={itemVariants}
                  whileHover={{ x: 8, backgroundColor: '#fafafa' }}
                  className="group flex items-center justify-between p-4 lg:p-5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${subject.lightColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${subject.textColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {subject.title}
                        </h3>
                        <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 rounded">
                          {subject.code}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">
                        {subject.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900">
                        {subject.questionCount}
                      </span>
                      <span className="text-sm text-slate-500 ml-1">questions</span>
                    </div>
                    <div className={`w-2 h-2 ${subject.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center gap-8 lg:gap-16 p-6 bg-slate-50 rounded-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">10</div>
              <div className="text-sm text-slate-500">Subject Areas</div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">4,100+</div>
              <div className="text-sm text-slate-500">Total Questions</div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">3</div>
              <div className="text-sm text-slate-500">CFA Levels</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
