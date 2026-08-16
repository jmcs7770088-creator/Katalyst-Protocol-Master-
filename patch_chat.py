import sys
import re

with open("src/components/chat.tsx", "r") as f:
    content = f.read()

# 1. Update loadVoices
target_voices = """      } else if (availableVoices.length > 0) {
        let defaultVoice = availableVoices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.toLowerCase().includes('male') || 
           v.name.toLowerCase().includes('guy') || 
           v.name.toLowerCase().includes('david') || 
           v.name.toLowerCase().includes('matthew') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('brian') ||
          v.name.toLowerCase().includes('mark') ||
          v.name.toLowerCase().includes('aaron'))
        );
        if (!defaultVoice) { 
          defaultVoice = availableVoices.find(v => v.lang.startsWith('en'));
        }
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
          localStorage.setItem('katalyst_voice_name', defaultVoice.name);
        }
      }"""

replacement_voices = """      } else if (availableVoices.length > 0) {
        let defaultVoice = 
          availableVoices.find(v => v.name.includes('Google US English')) ||
          availableVoices.find(v => v.name.includes('Google') && v.lang.startsWith('en') && v.name.toLowerCase().includes('male')) ||
          availableVoices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
          availableVoices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.toLowerCase().includes('male') || 
             v.name.toLowerCase().includes('guy') || 
             v.name.toLowerCase().includes('david') || 
             v.name.toLowerCase().includes('matthew'))
          ) ||
          availableVoices.find(v => v.lang.startsWith('en'));
          
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
          localStorage.setItem('katalyst_voice_name', defaultVoice.name);
        }
      }"""

content = content.replace(target_voices, replacement_voices)

# 2. Update Web Speech API behavior
target_speech = """      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(finalTranscript || interimTranscript);
      };"""

replacement_speech = """      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      
      let baseInput = input;
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(baseInput + (baseInput ? ' ' : '') + finalTranscript + interimTranscript);
        if (finalTranscript) {
          baseInput = baseInput + (baseInput ? ' ' : '') + finalTranscript;
        }
      };"""

content = content.replace(target_speech, replacement_speech)

# 3. Increase history storage from 16 to 24 and stop substring 200
target_history = """      kat.org.history.push(`Katalyst: ${reply.substring(0, 200)}`);
      if (kat.org.history.length > 16) kat.org.history = kat.org.history.slice(-16);"""

replacement_history = """      kat.org.history.push(`Katalyst: ${reply}`);
      if (kat.org.history.length > 24) kat.org.history = kat.org.history.slice(-24);"""

content = content.replace(target_history, replacement_history)

# 4. Modify Mic UI
target_mic_btn = """          <button
            type="button"
            onClick={toggleListen}
            className={`p-1.5 rounded transition-colors ${isListening ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-500 hover:text-sky-400'}`}
          >
            {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
          </button>"""

replacement_mic_btn = """          <button
            type="button"
            onClick={toggleListen}
            className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${isListening ? 'text-white bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-slate-400 hover:text-white bg-slate-800'}`}
            title={isListening ? "Stop Recording" : "Start Voice Input"}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>"""

content = content.replace(target_mic_btn, replacement_mic_btn)

with open("src/components/chat.tsx", "w") as f:
    f.write(content)
