import sys
import re

with open("server.ts", "r") as f:
    content = f.read()

download_regex = re.compile(r'\s*app\.get\("/api/download-source", async \(req, res\) => \{.*?\n  \}\);', re.DOTALL)
content = download_regex.sub('', content)

admzip_regex = re.compile(r'import AdmZip from "adm-zip";\n?')
content = admzip_regex.sub('', content)

with open("server.ts", "w") as f:
    f.write(content)
