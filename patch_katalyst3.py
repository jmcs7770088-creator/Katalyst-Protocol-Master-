import sys

with open("src/lib/katalyst.ts", "r") as f:
    content = f.read()

target1 = """  contextForLLM(maxRecent: number = 12): string {"""
replacement1 = """  contextForLLM(maxRecent: number = -1): string {"""

content = content.replace(target1, replacement1)

target2 = """    const ctx = useRosetta ? this.org.contextForLLM(12) : this.org.history.slice(-12).join("\\n");"""
replacement2 = """    const ctx = useRosetta ? this.org.contextForLLM(-1) : this.org.history.join("\\n");"""

content = content.replace(target2, replacement2)

target3 = """    const recent = this.history.slice(-maxRecent);"""
replacement3 = """    const recent = maxRecent === -1 ? this.history : this.history.slice(-maxRecent);"""

content = content.replace(target3, replacement3)

with open("src/lib/katalyst.ts", "w") as f:
    f.write(content)
