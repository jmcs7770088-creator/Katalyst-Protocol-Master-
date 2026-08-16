import sys
import re

with open("server.ts", "r") as f:
    content = f.read()

import_admzip = 'import Stripe from "stripe";\nimport fs from "fs/promises";\nimport AdmZip from "adm-zip";'
content = content.replace('import Stripe from "stripe";\nimport fs from "fs/promises";', import_admzip)

download_route = """  // CRISPR Endpoints

  app.get("/api/download-source", async (req, res) => {
    try {
      const zip = new AdmZip();
      
      // We want to zip the whole applet directory, but exclude node_modules, dist, and .git
      const rootDir = process.cwd();
      const files = await fs.readdir(rootDir);
      
      for (const file of files) {
        if (["node_modules", "dist", ".git", ".env"].includes(file)) continue;
        
        const stat = await fs.stat(file);
        if (stat.isDirectory()) {
          zip.addLocalFolder(file, file);
        } else {
          zip.addLocalFile(file);
        }
      }
      
      const zipBuffer = zip.toBuffer();
      res.set("Content-Type", "application/zip");
      res.set("Content-Disposition", "attachment; filename=katalyst_source_code.zip");
      res.send(zipBuffer);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });"""

content = content.replace("  // CRISPR Endpoints", download_route)

with open("server.ts", "w") as f:
    f.write(content)
