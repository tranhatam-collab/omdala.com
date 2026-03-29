import "./globals.css";

export const metadata = {
  title: "OMDALA | The Operating Layer for Real-World Value",
  description:
    "OMDALA is the master coordination layer for identity, trust, resources, and real-world activation."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
