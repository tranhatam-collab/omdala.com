import { redirect } from "next/navigation";

// Legacy skeleton route: sign-in lives on the auth host, reached through /login.
export default function LegacySignInPage() {
  redirect("/login");
}
