'use client';

import dynamic from 'next/dynamic';

const DashboardMapInner = dynamic(() => import('./DashboardMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[460px] md:h-[520px] bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 font-medium text-xs sm:text-sm border border-slate-200">
      Loading Interactive Geospatial Map...
    </div>
  ),
});

export default function DashboardMap(props) {
  return <DashboardMapInner {...props} />;
}
