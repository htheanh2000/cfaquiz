'use client';

export default function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-9999 focus:px-4 focus:py-2 focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:[clip:auto] focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      Skip to main content
    </a>
  );
}
