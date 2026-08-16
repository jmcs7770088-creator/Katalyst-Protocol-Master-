import sys

with open("src/lib/katalyst.ts", "r") as f:
    content = f.read()

target = """    this.history.push(text.substring(0, 200));
    if (this.history.length > 16) this.history = this.history.slice(-16);"""

replacement = """    this.history.push(text);
    // Unbounded history"""

content = content.replace(target, replacement)

with open("src/lib/katalyst.ts", "w") as f:
    f.write(content)
