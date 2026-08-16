import sys

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace(
    'import util from "util";\nimport Stripe from "stripe";',
    'import util from "util";\nimport Stripe from "stripe";\nimport fs from "fs/promises";'
)

new_routes = """  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // Local Memory store for CRISPR
  const MEMORY_FILE = path.join(process.cwd(), "local_memory.json");
  
  async function getLocalMemory() {
    try {
      const data = await fs.readFile(MEMORY_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return { spacers: {} };
    }
  }

  async function saveLocalMemory(data: any) {
    await fs.writeFile(MEMORY_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  // CRISPR Endpoints
  app.get("/api/crispr/spacers", async (req, res) => {
    try {
      const memory = await getLocalMemory();
      res.json({ spacers: memory.spacers || {} });
    } catch (e: any) {
      res.status(500).json({ error: str(e) });
    }
  });

  app.post("/api/crispr/spacers", async (req, res) => {
    try {
      const { spacers } = req.body;
      if (!spacers) {
         res.status(400).json({ error: "Missing spacers" });
         return;
      }
      const memory = await getLocalMemory();
      // Merge
      for (const nodeIdx in spacers) {
        if (!memory.spacers[nodeIdx]) memory.spacers[nodeIdx] = [];
        const incoming = spacers[nodeIdx];
        for (const s of incoming) {
           if (!memory.spacers[nodeIdx].find((existing: any) => existing.spacer_id === s.spacer_id)) {
              memory.spacers[nodeIdx].push(s);
           }
        }
      }
      await saveLocalMemory(memory);
      res.json({ success: true, spacers: memory.spacers });
    } catch (e: any) {
      res.status(500).json({ error: str(e) });
    }
  });

  // DuckDuckGo Scraper Route"""

content = content.replace(
    '  const app = express();\n  const PORT = 3000;\n  app.use(express.json());\n\n  // DuckDuckGo Scraper Route',
    new_routes
)

with open("server.ts", "w") as f:
    f.write(content)
