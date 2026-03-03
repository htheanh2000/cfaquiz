import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | CFA Quiz',
  description: 'Privacy Policy for CFA Quiz',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
        <p className="text-slate-600 mb-6">
          This page will contain the full Privacy Policy. Please contact support for any questions.
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
