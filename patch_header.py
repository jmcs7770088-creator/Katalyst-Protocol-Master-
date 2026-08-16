import sys

with open("src/components/layout.tsx", "r") as f:
    content = f.read()

target = """             <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] md:text-[10px] text-emerald-400 font-mono">STATUS: COHERENT</div>
          </div>"""

replacement = """             <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] md:text-[10px] text-emerald-400 font-mono">STATUS: COHERENT</div>
             {hasArchitectKey && (
               <a 
                 href="/api/download-source" 
                 download 
                 className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-colors"
               >
                 <FileText className="w-3 h-3" />
                 Download Source
               </a>
             )}
          </div>"""

content = content.replace(target, replacement)

with open("src/components/layout.tsx", "w") as f:
    f.write(content)
