// middleware.ts
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { apiAuthPrefix, authRoutes, privateRoutes } from "./route";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Autoriser une liste d’origines (séparées par des virgules dans l’ENV)
// ex: API_CORS_AUTORIZED="http://localhost:3001,https://app.example.com"
// function applyCors(res: NextResponse, req: Request) {
//   const allowlist = (process.env.API_CORS_AUTORIZED ?? "http://localhost:3001")
//     .split(",")
//     .map(s => s.trim());

//   const origin = req.headers.get("origin");
//   const allowedOrigin = origin && allowlist.includes(origin) ? origin : allowlist[0];

//   res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
//   res.headers.set("Vary", "Origin"); // important pour les CDN
//   res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
//   res.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization");
//   res.headers.set("Access-Control-Allow-Credentials", "true");
// }

export default auth(async (req) => {
  const { cookies, nextUrl, method } = req;

  // 1) Réponse immédiate aux preflights OPTIONS (avant toute auth)
  // if (method === "OPTIONS") {
  //   const preflight = new NextResponse(null, { status: 204 });
  //   applyCors(preflight, req);
  //   return preflight;
  // }

  // 2) Réponse “par défaut”
  const response = NextResponse.next();
  // applyCors(response, req);

  // --- ton code existant, inchangé, mais on réutilise `response` et on applique CORS sur tout retour ---

  const isLogging = !!req.auth;
  let lang = cookies.get("lang")?.value || "en";
  const supportedLanguages = ["en", "fr", "ar"];
  if (!supportedLanguages.includes(lang)) lang = "en";

  const isPrivateRoutes = privateRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isApiAuthRoutes = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoutes = authRoutes.includes(nextUrl.pathname);

  response.cookies.set("lang", lang);

  if (isApiAuthRoutes) {
    return response;
  }

  if (isAuthRoutes) {
    if (isLogging) {
      const domainUrl = process.env.DOMAIN_URL;
      if (!domainUrl) {
        console.log("DOMAIN_URL is not defined in the environment variables");
        throw new Error("DOMAIN_URL is not defined in the environment variables");
      }
      const redirectRes = NextResponse.redirect(`${domainUrl}/admin`);
      redirectRes.cookies.set("lang", lang);
      // applyCors(redirectRes, req);
      return redirectRes;
    }
    return response;
  }

  if (isPrivateRoutes && !isLogging) {
    const domainUrl = process.env.DOMAIN_URL;
    if (!domainUrl) {
      throw new Error("DOMAIN_URL is not defined in the environment variables");
    }
    const redirectRes = NextResponse.redirect(`${domainUrl}/auth/login`);
    redirectRes.cookies.set("lang", lang);
    // applyCors(redirectRes, req);
    return redirectRes;
  }

  return response;
});

export const config = {
  // Tu peux cibler tout le site ou seulement l’API :
  // matcher: ['/api/:path*', '/((?!_next|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
