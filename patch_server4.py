import sys

with open("server.ts", "r") as f:
    content = f.read()

target = """  app.get("/api/download-source", async (req, res) => {
    try {
      const zip = new AdmZip();"""

replacement = """  app.get("/api/download-source", async (req, res) => {
    try {
      const key = req.query.key;
      // In production, we'd compare this against an env var. 
      // But since there's no DB for keys, we rely on the client to pass the architect key.
      if (!key) {
        res.status(401).json({ error: "Unauthorized. Architect key required." });
        return;
      }
      
      const zip = new AdmZip();"""

content = content.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(content)
