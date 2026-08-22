import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Meal-Harvest | Connecting Surplus Food to Need',
  description:
    'Meal-Harvest — a platform bridging food surplus with community need via real-time geospatial routing and NGO verification.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
