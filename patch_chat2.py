import sys

with open("src/components/chat.tsx", "r") as f:
    content = f.read()

target = """      kat.org.history.push(`Katalyst: ${reply}`);
      if (kat.org.history.length > 24) kat.org.history = kat.org.history.slice(-24);"""

replacement = """      kat.org.history.push(`Katalyst: ${reply.substring(0, 300)}`);
      if (kat.org.history.length > 16) kat.org.history = kat.org.history.slice(-16);"""

content = content.replace(target, replacement)

with open("src/components/chat.tsx", "w") as f:
    f.write(content)
