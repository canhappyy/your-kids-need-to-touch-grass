import { redirect } from "next/navigation";

/**
 * Redirects direct visits to /history to the home page with the history overlay open.
 */
export default function HistoryPage() {
  redirect("/?history=open");
}
