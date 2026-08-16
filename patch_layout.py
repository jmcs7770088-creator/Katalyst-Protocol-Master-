import sys
import re

with open("src/components/layout.tsx", "r") as f:
    content = f.read()

target = """  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Trigger re-render of stats
  const refreshStats = () => {"""

replacement = """  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasArchitectKey, setHasArchitectKey] = useState(false);

  useEffect(() => {
    const checkKey = () => {
      setHasArchitectKey(!!localStorage.getItem('architect_key'));
    };
    checkKey();
    window.addEventListener('storage', checkKey);
    // Poll occasionally just in case it was set in the chat tab without a storage event in the same window
    const interval = setInterval(checkKey, 1000);
    return () => {
      window.removeEventListener('storage', checkKey);
      clearInterval(interval);
    };
  }, []);

  // Trigger re-render of stats
  const refreshStats = () => {"""

content = content.replace(target, replacement)

target2 = """  const tabs = [
    { id: 'chat', label: 'Live Chat', icon: MessageSquare },
    { id: 'field', label: 'Semantic Field', icon: Network },
    { id: 'crispr', label: 'CRISPR Shield', icon: Shield },
    { id: 'pnt', label: 'PNT Navigation', icon: Navigation },
    { id: 'diamond', label: 'Time Diamond', icon: Clock },
    { id: 'wire', label: 'Wire & State', icon: Activity },
    { id: 'benchmark', label: 'Benchmark Data', icon: FileText },
    { id: 'legal', label: 'Commercial Licensing', icon: Info },
  ];"""

replacement2 = """  const allTabs = [
    { id: 'chat', label: 'Live Chat', icon: MessageSquare },
    { id: 'field', label: 'Semantic Field', icon: Network },
    { id: 'crispr', label: 'CRISPR Shield', icon: Shield },
    { id: 'pnt', label: 'PNT Navigation', icon: Navigation },
    { id: 'diamond', label: 'Time Diamond', icon: Clock },
    { id: 'wire', label: 'Wire & State', icon: Activity },
    { id: 'benchmark', label: 'Benchmark Data', icon: FileText },
    { id: 'legal', label: 'Commercial Licensing', icon: Info },
  ];

  const tabs = hasArchitectKey ? allTabs : [
    { id: 'chat', label: 'Live Chat', icon: MessageSquare },
    { id: 'legal', label: 'Commercial Licensing', icon: Info },
  ];

  useEffect(() => {
    if (!hasArchitectKey && !['chat', 'legal'].includes(activeTab)) {
      setActiveTab('chat');
    }
  }, [hasArchitectKey, activeTab]);"""

content = content.replace(target2, replacement2)

with open("src/components/layout.tsx", "w") as f:
    f.write(content)
