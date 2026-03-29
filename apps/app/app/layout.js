import "./globals.css";

export const metadata = {
  title: "OMDALA App | Coordination Workspace",
  description:
    "App shell for nodes, requests, trust, and passwordless-first entry across the OMDALA system."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
