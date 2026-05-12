import "./globals.css";

export const metadata = {
  title: "OMDALA | The Operating Layer for Real-World State Transitions",
  description:
    "OMDALA is verified coordination infrastructure for identity, trust, resources, and real-world activation."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
