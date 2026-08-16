import sys

with open("src/components/layout.tsx", "r") as f:
    content = f.read()

target = """            </button>
          ))}
        </nav>
      </div>"""

replacement = """            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
           <a 
             href="/api/download-source"
             download
             className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium transition-colors bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30"
           >
             <FileText className="w-5 h-5 shrink-0" />
             Download Source Code
           </a>
           <div className="text-[10px] text-slate-500 mt-2 text-center uppercase tracking-widest px-2">Keep your code 100% private.</div>
        </div>
      </div>"""

content = content.replace(target, replacement)

with open("src/components/layout.tsx", "w") as f:
    f.write(content)
