const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { execSync } = require("child_process");

const port = parseInt(process.env.PORT || process.env.ALWAYSDATA_HTTPD_PORT || "3000", 10);
const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

// 🔹 Générer Prisma Client avant de démarrer l'application
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma client generated successfully.");
} catch (error) {
  console.log("❌ Failed to generate Prisma client:", error);
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});
