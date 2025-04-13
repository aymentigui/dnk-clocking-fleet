import LoginForm from "@/components/my/auth-form/login";
import { getTranslations } from "next-intl/server";

export default async function LoginPage() {
  const s=await getTranslations('System');

  return (
    <div style={{ colorScheme: "light" }} className="min-h-screen py-10 overflow-auto w-full flex items-center justify-center bg-[url('/background.svg')] bg-cover bg-center bg-no-repeat">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-xs md:max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {s('login')}
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
