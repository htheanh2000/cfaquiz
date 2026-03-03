import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | CFA Quiz',
  description: 'Terms of Service for CFA Quiz',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Terms of Service</h1>
        <p className="text-slate-600 mb-6">
          This page will contain the full Terms of Service. Please contact support for any questions.
        </p>
        <Link
          href="/login"
          className="text-emerald-600 hover:underline font-medium"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
