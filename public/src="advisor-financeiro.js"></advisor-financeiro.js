/**
 * Advisor Financeiro Widget Universal
 * Pode ser adicionado a qualquer página web
 * 
 * INSTALAÇÃO:
 * 1. Inclua este script na sua página:
 *    <script src="advisor-financeiro.js"></script>
 * 
 * 2. Configure a API key (opcional):
 *    <script>
 *      window.AdvisorFinanceiroConfig = {
 *        apiKey: 'sua-chave-deepseek-aqui'
 *      };
 *    </script>
 * 
 * 3. O widget aparecerá automaticamente no canto inferior direito
 */

(function() {
  'use strict';

  // Configuração padrão
  const CONFIG = {
    apiKey: (window.AdvisorFinanceiroConfig && window.AdvisorFinanceiroConfig.apiKey) || 'demo-mode',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
    theme: 'dark', // dark, light
    language: 'pt'
  };

  // Evitar múltiplas inicializações
  if (window.AdvisorFinanceiroWidget) {
    return;
  }

  class AdvisorFinanceiroWidget {
    constructor() {
      this.isOpen = false;
      this.isInitialized = false;
      this.init();
    }

    init() {
      if (this.isInitialized) return;
      
      this.createStyles();
      this.createHTML();
      this.attachEventListeners();
      this.createParticles();
      this.isInitialized = true;
      
      console.log('💰 Advisor Financeiro Widget carregado com sucesso!');
    }

    createStyles() {
      const style = document.createElement('style');
      style.id = 'advisor-financeiro-styles';
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .af-widget-container * {
          box-sizing: border-box;
        }
        
        .af-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 999998;
        }

        .af-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(34, 197, 94, 0.3);
          border-radius: 50%;
          animation: af-float 6s ease-in-out infinite;
        }

        @keyframes af-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }

        .af-chat-toggle {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 2rem;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4);
          z-index: 999999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: af-pulse 2s infinite;
          font-family: 'Inter', sans-serif;
        }

        .af-chat-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 40px rgba(34, 197, 94, 0.6);
        }

        @keyframes af-pulse {
          0% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.6), 0 0 0 10px rgba(34, 197, 94, 0.1); }
          100% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4); }
        }

        .af-chat-widget {
          position: fixed;
          bottom: 7rem;
          right: 2rem;
          width: 380px;
          height: 550px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          display: none;
          flex-direction: column;
          overflow: hidden;
          z-index: 999998;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          transform: translateY(20px) scale(0.95);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Inter', sans-serif;
        }

        .af-chat-widget.af-show {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .af-chat-header {
          background: linear-gradient(135deg, #1e293b, #334155);
          padding: 1.25rem 1.5rem;
          color: #fff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .af-chat-header::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #22c55e, transparent);
        }

        .af-header-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .af-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .af-status {
          font-size: 0.75rem;
          color: #22c55e;
          font-weight: 500;
        }

        .af-close-btn {
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: background 0.2s;
          font-size: 1.2rem;
          background: none;
          border: none;
          color: white;
        }

        .af-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .af-chat-body {
          flex: 1;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          gap: 1rem;
          color: white;
          scrollbar-width: thin;
          scrollbar-color: #22c55e transparent;
        }

        .af-chat-body::-webkit-scrollbar {
          width: 4px;
        }

        .af-chat-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .af-chat-body::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 2px;
        }

        .af-message {
          padding: 0.875rem 1.25rem;
          border-radius: 18px;
          max-width: 85%;
          line-height: 1.5;
          font-weight: 400;
          position: relative;
          animation: af-messageSlide 0.3s ease-out;
        }

        @keyframes af-messageSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .af-message.af-user { 
          align-self: flex-end; 
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white; 
          border-bottom-right-radius: 6px;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .af-message.af-bot { 
          align-self: flex-start; 
          background: linear-gradient(135deg, #374151, #4b5563);
          border-bottom-left-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .af-typing-indicator {
          align-self: flex-start;
          background: #374151;
          padding: 1rem 1.25rem;
          border-radius: 18px;
          border-bottom-left-radius: 6px;
          max-width: 85%;
        }

        .af-typing-dots {
          display: flex;
          gap: 4px;
        }

        .af-typing-dots span {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: af-typing 1.4s infinite ease-in-out;
        }

        .af-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .af-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes af-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }

        .af-chat-input-area {
          display: flex;
          padding: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          gap: 0.75rem;
          background: rgba(15, 23, 42, 0.5);
        }

        .af-user-input {
          flex: 1;
          padding: 0.875rem 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 0.95rem;
          background: rgba(30, 41, 59, 0.5);
          color: white;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }

        .af-user-input:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }

        .af-user-input::placeholder {
          color: #9ca3af;
        }

        .af-send-btn {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          padding: 0.875rem 1.25rem;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          min-width: 80px;
        }

        .af-send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
        }

        .af-send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .af-welcome-message {
          text-align: center;
          color: #9ca3af;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .af-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .af-suggestion-btn {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .af-suggestion-btn:hover {
          background: rgba(34, 197, 94, 0.2);
          transform: translateY(-1px);
        }

        .af-powered-by {
          text-align: center;
          font-size: 0.7rem;
          color: #6b7280;
          padding: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .af-chat-widget {
            width: calc(100vw - 2rem);
            height: calc(100vh - 10rem);
            right: 1rem;
            bottom: 6rem;
          }
          
          .af-chat-toggle {
            right: 1.5rem;
            bottom: 1.5rem;
          }
        }

        /* Position variants */
        .af-position-bottom-left .af-chat-toggle {
          left: 2rem;
          right: auto;
        }
        
        .af-position-bottom-left .af-chat-widget {
          left: 2rem;
          right: auto;
        }

        .af-position-top-right .af-chat-toggle {
          top: 2rem;
          bottom: auto;
        }
        
        .af-position-top-right .af-chat-widget {
          top: 7rem;
          bottom: auto;
        }

        .af-position-top-left .af-chat-toggle {
          top: 2rem;
          left: 2rem;
          bottom: auto;
          right: auto;
        }
        
        .af-position-top-left .af-chat-widget {
          top: 7rem;
          left: 2rem;
          bottom: auto;
          right: auto;
        }
      `;
      
      document.head.appendChild(style);
    }

    createHTML() {
      const container = document.createElement('div');
      container.className = `af-widget-container af-position-${CONFIG.position}`;
      container.innerHTML = `
        <div class="af-particles" id="af-particles"></div>
        
        <button class="af-chat-toggle" id="af-chat-toggle" title="Abrir Advisor Financeiro">
          💰
        </button>

        <div class="af-chat-widget" id="af-chat-widget">
          <div class="af-chat-header">
            <div class="af-header-info">
              <div class="af-avatar">💸</div>
              <div>
                <div style="font-weight: 600; font-size: 1rem;">Advisor Financeiro</div>
                <div class="af-status">● Online</div>
              </div>
            </div>
            <button class="af-close-btn" id="af-close-btn">✕</button>
          </div>
          
          <div class="af-chat-body" id="af-chat-body">
            <div class="af-welcome-message">
              <strong>🤖 Olá! Sou o seu Advisor Financeiro com IA</strong><br>
              Especializado no mercado financeiro português.<br>
              Posso ajudar com orçamentos, investimentos, PPR, fiscalidade e muito mais!
              ${CONFIG.apiKey === 'demo-mode' ? 
                '<div style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.8;">⚠️ <strong>Modo Demo:</strong> Configure a API key para respostas personalizadas</div>' : 
                '<div style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.8;">✅ <strong>IA Ativa:</strong> Respostas powered by DeepSeek</div>'
              }
            </div>
          </div>
          
          <div class="af-chat-input-area">
            <input type="text" class="af-user-input" id="af-user-input" placeholder="Digite sua pergunta financeira..." />
            <button class="af-send-btn" id="af-send-btn">📤</button>
          </div>
          
          <div class="af-powered-by">
            Powered by Advisor Financeiro Widget
          </div>
        </div>
      `;
      
      document.body.appendChild(container);
    }

    createParticles() {
      const particles = document.getElementById('af-particles');
      for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'af-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particles.appendChild(particle);
      }
    }

    attachEventListeners() {
      const toggle = document.getElementById('af-chat-toggle');
      const closeBtn = document.getElementById('af-close-btn');
      const input = document.getElementById('af-user-input');
      const sendBtn = document.getElementById('af-send-btn');

      toggle.addEventListener('click', () => this.toggleChat());
      closeBtn.addEventListener('click', () => this.toggleChat());
      sendBtn.addEventListener('click', () => this.sendMessage());
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    toggleChat() {
      const widget = document.getElementById('af-chat-widget');
      const toggle = document.getElementById('af-chat-toggle');
      
      if (this.isOpen) {
        widget.classList.remove('af-show');
        setTimeout(() => {
          widget.style.display = 'none';
        }, 300);
        toggle.innerHTML = '💰';
        this.isOpen = false;
      } else {
        widget.style.display = 'flex';
        setTimeout(() => {
          widget.classList.add('af-show');
        }, 10);
        toggle.innerHTML = '✕';
        this.isOpen = true;
        
        if (document.querySelectorAll('.af-message').length === 0) {
          this.showSuggestions();
        }
      }
    }

    showSuggestions() {
      const suggestions = [
        "Como fazer um orçamento familiar?",
        "Onde investir 1000€ em Portugal?",
        "Qual o melhor PPR para a reforma?",
        "Como sair das dívidas do cartão?",
        "Devo comprar casa ou arrendar?"
      ];

      const chatBody = document.getElementById('af-chat-body');
      const suggestionsDiv = document.createElement('div');
      suggestionsDiv.className = 'af-suggestions';
      
      suggestions.forEach(suggestion => {
        const btn = document.createElement('button');
        btn.className = 'af-suggestion-btn';
        btn.textContent = suggestion;
        btn.onclick = () => {
          document.getElementById('af-user-input').value = suggestion;
          this.sendMessage();
        };
        suggestionsDiv.appendChild(btn);
      });
      
      chatBody.appendChild(suggestionsDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    showTypingIndicator() {
      const chatBody = document.getElementById('af-chat-body');
      const typingDiv = document.createElement('div');
      typingDiv.className = 'af-typing-indicator';
      typingDiv.id = 'af-typing-indicator';
      typingDiv.innerHTML = `
        <div class="af-typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
      chatBody.appendChild(typingDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    removeTypingIndicator() {
      const indicator = document.getElementById('af-typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    }

    addMessage(message, isUser = false) {
      const chatBody = document.getElementById('af-chat-body');
      const messageDiv = document.createElement('div');
      messageDiv.className = `af-message ${isUser ? 'af-user' : 'af-bot'}`;
      messageDiv.textContent = message;
      chatBody.appendChild(messageDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    async callDeepSeekAPI(userMessage) {
      if (CONFIG.apiKey === 'demo-mode') {
        // Respostas demo para quando não há API key
        const demoResponses = [
          "Esta é uma resposta de demonstração. Para obter conselhos financeiros personalizados da IA, configure a sua chave API DeepSeek.",
          "💡 Modo Demo: Posso ajudar com questões financeiras básicas. Para análises avançadas, ative a integração com DeepSeek AI.",
          "🔧 Configure a API key para desbloquear todo o potencial do advisor financeiro com IA!"
        ];
        return demoResponses[Math.floor(Math.random() * demoResponses.length)];
      }

      const systemPrompt = `Você é um advisor financeiro português especializado e experiente. Suas características:

PERSONALIDADE:
- Profissional mas acessível
- Empático e compreensivo
- Claro e direto nas explicações
- Focado em soluções práticas

EXPERTISE:
- Orçamento familiar e pessoal
- Investimentos em Portugal (PPR, fundos, ações, obrigações)
- Produtos bancários portugueses
- Fiscalidade portuguesa
- Planeamento de reforma
- Gestão de dívidas
- Literacia financeira

INSTRUÇÕES:
- Responda sempre em português de Portugal
- Use exemplos práticos com valores em euros
- Mencione produtos e instituições portuguesas relevantes
- Dê conselhos conservadores e responsáveis
- Pergunte detalhes quando necessário para dar melhor conselho
- Limite respostas a 150-200 palavras
- Use emojis ocasionalmente para tornar mais amigável

Se não souber algo específico, seja honesto e sugira consultar um profissional qualificado.`;

      try {
        const response = await fetch(CONFIG.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            max_tokens: 300,
            temperature: 0.7,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error('DeepSeek API Error:', error);
        return "Peço desculpa, mas estou com dificuldades técnicas neste momento. 😅 Pode tentar reformular a pergunta?";
      }
    }

    async sendMessage() {
      const input = document.getElementById('af-user-input');
      const sendBtn = document.getElementById('af-send-btn');
      const message = input.value.trim();
      
      if (message === '' || sendBtn.disabled) return;

      // Disable input
      input.disabled = true;
      sendBtn.disabled = true;
      sendBtn.innerHTML = '⏳';
      
      // Add user message
      this.addMessage(message, true);
      input.value = '';
      
      // Remove suggestions
      const suggestions = document.querySelector('.af-suggestions');
      if (suggestions) suggestions.remove();
      
      // Show typing
      this.showTypingIndicator();
      
      try {
        const response = await this.callDeepSeekAPI(message);
        this.removeTypingIndicator();
        this.addMessage(response, false);
      } catch (error) {
        this.removeTypingIndicator();
        this.addMessage("Peço desculpa, ocorreu um erro. Pode tentar novamente? 😔", false);
      } finally {
        // Re-enable input
        input.disabled = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '📤';
        input.focus();
      }
    }
  }

  // Initialize widget when DOM is ready
  function initWidget() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        new AdvisorFinanceiroWidget();
      });
    } else {
      new AdvisorFinanceiroWidget();
    }
  }

  // Global API
  window.AdvisorFinanceiroWidget = {
    init: initWidget,
    version: '1.0.0'
  };

  // Auto-initialize
  initWidget();

})();
