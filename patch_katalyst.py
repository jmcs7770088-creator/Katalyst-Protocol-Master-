import sys

with open("src/lib/katalyst.ts", "r") as f:
    content = f.read()

# Add load and sync methods to CrisprMemoryVault
crispr_methods = """  async loadFromBackend() {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch("/api/crispr/spacers");
      const data = await res.json();
      if (data.spacers) {
        for (const idx in data.spacers) {
          this.spacers[idx] = data.spacers[idx];
        }
      }
    } catch (e) {
      console.warn("Failed to load CRISPR memory", e);
    }
  }

  private async syncToBackend() {
    if (typeof window === 'undefined') return;
    try {
      await fetch("/api/crispr/spacers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spacers: this.spacers })
      });
    } catch (e) {
      console.warn("Failed to sync CRISPR memory", e);
    }
  }

  scanAndAcquire"""

content = content.replace("  scanAndAcquire", crispr_methods)

# Now, in createSpacer, we call syncToBackend
content = content.replace(
    "this.spacers[targetNode].push(spacer);\n    return spacer;",
    "this.spacers[targetNode].push(spacer);\n    this.syncToBackend();\n    return spacer;"
)

# And in KatalystWrapper constructor, we call loadFromBackend
content = content.replace(
    "  constructor() {\n    this.org = new Organism();\n  }",
    "  constructor() {\n    this.org = new Organism();\n    this.org.crispr.loadFromBackend();\n  }"
)

with open("src/lib/katalyst.ts", "w") as f:
    f.write(content)

