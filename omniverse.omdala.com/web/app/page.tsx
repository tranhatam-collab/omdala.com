import Link from "next/link";

const FEATURES = [
  {
    icon: "💡",
    title: "Control all your devices",
    desc: "Lights, thermostats, locks, plugs — manage everything from one dashboard.",
  },
  {
    icon: "🎬",
    title: "Create scenes instantly",
    desc: "Set the perfect mood with one tap. Movie Time, Good Morning, Goodnight.",
  },
  {
    icon: "⚡",
    title: "Smart automations",
    desc: "Trigger actions by time, presence, or sensor. Your space adapts to you.",
  },
  {
    icon: "🔌",
    title: "Works with any manufacturer",
    desc: "Philips Hue, Nest, TP-Link, Yale, LIFX, Wyze and 100+ more.",
  },
  {
    icon: "🏢",
    title: "Home, office, or venue",
    desc: "Built for any space. Manage multiple locations from one account.",
  },
  {
    icon: "👥",
    title: "Invite your team",
    desc: "Share control with family, colleagues, or facilities staff.",
  },
];

const DEVICES = [
  "Philips Hue",
  "Google Nest",
  "TP-Link Kasa",
  "LIFX",
  "Yale",
  "Wyze",
  "Ecobee",
  "Ring",
  "Lutron",
  "Sonos",
  "Arlo",
  "August",
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "1 home",
      "Up to 10 devices",
      "5 scenes",
      "Basic automations",
      "Community support",
    ],
    cta: "Get started free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Home Pro",
    price: "$4.99",
    period: "per month",
    features: [
      "Unlimited homes",
      "Unlimited devices",
      "Unlimited scenes",
      "Advanced automations",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Business Space",
    price: "$9.99",
    period: "per user / month",
    features: [
      "Everything in Home Pro",
      "Team management",
      "Multi-user access",
      "Activity audit log",
      "Dedicated support",
    ],
    cta: "Contact sales",
    href: "/signup",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-400">
            AI Omniverse
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#devices" className="hover:text-white transition-colors">
              Devices
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Now in beta — 100+ devices supported
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          Control your entire
          <br />
          physical world with one app
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Smart home. Smart office. Smart venue. One app.
          <br />
          AI Omniverse puts every device at your fingertips.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
          >
            Sign in
          </Link>
        </div>
        {/* Dashboard preview mockup */}
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="flex-1 text-center text-xs text-gray-500">
              AI Omniverse Dashboard
            </span>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Living Room Light",
                status: "On",
                color: "text-yellow-400",
                icon: "💡",
              },
              {
                label: "Thermostat",
                status: "72°F",
                color: "text-blue-400",
                icon: "🌡️",
              },
              {
                label: "Front Door Lock",
                status: "Locked",
                color: "text-green-400",
                icon: "🔒",
              },
              {
                label: "Office Plug",
                status: "On",
                color: "text-indigo-400",
                icon: "🔌",
              },
            ].map((d) => (
              <div
                key={d.label}
                className="bg-gray-800 rounded-xl p-4 text-left"
              >
                <div className="text-2xl mb-2">{d.icon}</div>
                <div className="text-xs text-gray-400 mb-1">{d.label}</div>
                <div className={`text-sm font-semibold ${d.color}`}>
                  {d.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Everything you need to control your space
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          A complete platform for device control, automation, and team
          collaboration.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-700 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Devices */}
      <section id="devices" className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Works with your devices
          </h2>
          <p className="text-gray-400 text-center mb-12">
            100+ devices supported and growing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {DEVICES.map((d) => (
              <div
                key={d}
                className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-3 text-sm font-medium text-gray-300"
              >
                {d}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            + many more coming soon
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Built for every space
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: "🏠",
              title: "Homeowners",
              desc: "Smart home control, energy savings, and family sharing.",
            },
            {
              icon: "🏢",
              title: "Office Managers",
              desc: "Meeting rooms, guest experience, and team access.",
            },
            {
              icon: "🎪",
              title: "Venues",
              desc: "Multi-zone control, events, and guest automation.",
            },
            {
              icon: "🏭",
              title: "Facilities",
              desc: "Large spaces, shift-based control, and audit logs.",
            },
          ].map((u) => (
            <div
              key={u.title}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center"
            >
              <div className="text-4xl mb-3">{u.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{u.title}</h3>
              <p className="text-gray-400 text-sm">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple pricing
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Start free. Upgrade when you need more.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-8 flex flex-col ${
                  p.highlight
                    ? "border-indigo-500 bg-indigo-950/50 shadow-lg shadow-indigo-900/30"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                {p.highlight && (
                  <span className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1 rounded-full self-start mb-4">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <div className="mb-1">
                  <span className="text-3xl font-extrabold">{p.price}</span>
                  <span className="text-gray-400 text-sm ml-1">
                    /{p.period}
                  </span>
                </div>
                <ul className="my-6 space-y-2 flex-1">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`text-center font-semibold py-2.5 rounded-xl transition-colors text-sm ${
                    p.highlight
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-100"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-lg font-bold text-indigo-400">
              AI Omniverse
            </span>
            <p className="text-gray-500 text-sm mt-1">
              Control your entire physical world.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
          <p className="text-gray-600 text-xs">
            © 2026 OMDALA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
