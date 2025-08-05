import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    // User is logged in, redirect to dashboard
    redirect(ROUTES.DASHBOARD);
  } else {
    // User is not logged in, redirect to login
    redirect(ROUTES.LOGIN);
  }
}
