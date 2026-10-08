import Link from "next/link";

export default function NotFound() {
  return <main className="market-information"><p className="market-eyebrow">404</p><h1>This listing is not public.</h1><p className="market-information__lead">The route may be unavailable, unpublished, or outside the current private inventory.</p><Link className="market-button market-button--solid" href="/en/brands">Browse approved brands</Link></main>;
}
