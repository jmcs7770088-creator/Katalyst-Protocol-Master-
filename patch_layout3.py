import sys

with open("src/components/layout.tsx", "r") as f:
    content = f.read()

target1 = """               <a 
                 href="/api/download-source" """

replacement1 = """               <a 
                 href={`/api/download-source?key=${localStorage.getItem('architect_key')}`} """

content = content.replace(target1, replacement1)

target2 = """           <a 
             href="/api/download-source"
             download"""

replacement2 = """           <a 
             href={`/api/download-source?key=${localStorage.getItem('architect_key')}`}
             download"""

content = content.replace(target2, replacement2)

with open("src/components/layout.tsx", "w") as f:
    f.write(content)
