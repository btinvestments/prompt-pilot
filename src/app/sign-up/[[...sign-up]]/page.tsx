"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <SignUp afterSignUpUrl={redirectUrl} />
    </div>
  );
}
