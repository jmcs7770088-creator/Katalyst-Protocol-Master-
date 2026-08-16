import sys
import re

with open("src/lib/katalyst.ts", "r") as f:
    content = f.read()

target1 = """  contextForLLM(maxRecent: number = 2): string {"""
replacement1 = """  contextForLLM(maxRecent: number = 24): string {"""
content = content.replace(target1, replacement1)

target2 = """    const ctx = useRosetta ? this.org.contextForLLM() : this.org.history.slice(-12).join("\\n");"""
replacement2 = """    const ctx = useRosetta ? this.org.contextForLLM(24) : this.org.history.slice(-24).join("\\n");"""
content = content.replace(target2, replacement2)

with open("src/lib/katalyst.ts", "w") as f:
    f.write(content)
