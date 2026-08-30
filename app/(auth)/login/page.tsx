import { LoginForm } from "@/components/auth/login-form";
import { oauthProvidersEnabled } from "@/lib/auth/providers-config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <LoginForm
      callbackUrl={callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"}
      google={oauthProvidersEnabled.google}
      microsoft={oauthProvidersEnabled.microsoft}
    />
  );
}
