"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <SignIn afterSignInUrl={redirectUrl} />
    </div>
  );
}
