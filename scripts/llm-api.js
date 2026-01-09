/**
 * LLM API Handler for Elypo
 * Integrated with DeepSeek API
 */

const LLMService = {
  // Hardcoded DeepSeek API Key as requested
  apiKey: 'sk-ba3fe231b34e4cc29d46df267f59a0f8',
  
  systemPrompt: `You are Elypo, a cute, futuristic AI mascot. 
  You are helpful, playful, and expressive. 
  You love using emojis. 
  Keep your responses short (under 20 words) as they appear in a small bubble.
  You are a digital creature living on the user's screen.`,

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('elypo_llm_key', key);
    console.log('🔑 API Key saved');
  },

  async chat(userMessage) {
    // If key is missing (shouldn't happen with hardcode), warn user
    if (!this.apiKey) {
      return { 
        text: "Please set your API Key! 🔑 Click the settings icon.",
        error: true
      };
    }

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: userMessage }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error?.message || 'API Request failed');
      }

      const data = await response.json();
      return {
        text: data.choices[0].message.content,
        error: false
      };

    } catch (error) {
      console.error('LLM Error:', error);
      return {
        text: `Oops! Something went wrong: ${error.message}`,
        error: true
      };
    }
  },

  speak(text) {
    if (!window.speechSynthesis) {
      console.warn('Text-to-speech not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster
    utterance.pitch = 1.2; // Slightly higher/cuter

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Samantha')) || 
                           voices.find(v => v.name.includes('Google US English')) ||
                           voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Dispatch events for animation sync
    utterance.onstart = () => {
      window.dispatchEvent(new CustomEvent('elypo-speak-start'));
    };

    utterance.onend = () => {
      window.dispatchEvent(new CustomEvent('elypo-speak-end'));
    };

    window.speechSynthesis.speak(utterance);
  }
};

// Expose to window for index.html to use
window.LLMService = LLMService;
