import "./globals.css";

export const metadata = {
  title: "BusManagerV1 — Take A Bus To AfrikaBurn",
  description: "Ticketing, resale and operations manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
