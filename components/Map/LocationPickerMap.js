'use client';

import dynamic from 'next/dynamic';

const LocationPickerInner = dynamic(() => import('./LocationPickerInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] sm:h-[300px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400 font-medium text-xs border border-slate-200">
      Loading Location Map Picker...
    </div>
  ),
});

export default function LocationPickerMap(props) {
  return <LocationPickerInner {...props} />;
}
