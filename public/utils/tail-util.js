 tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              DEFAULT: '#6366f1',
              light: '#818cf8',
              dark: '#4f46e5'
            },
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            card: '#ffffff',
            cardDark: '#1f2937',
            bgSoft: '#f8fafc',
            bgSoftDark: '#0f172a'
          },
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui']
          },
          animation: {
            'fade-in': 'fadeIn 0.5s ease-in-out',
            'slide-up': 'slideUp 0.3s ease-out',
            'pulse-slow': 'pulse 3s infinite',
            'bounce-subtle': 'bounceSubtle 2s infinite'
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0', transform: 'translateY(10px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' }
            },
            slideUp: {
              '0%': { transform: 'translateY(20px)', opacity: '0' },
              '100%': { transform: 'translateY(0)', opacity: '1' }
            },
            bounceSubtle: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-5px)' }
            }
          }
        }
      }
    };
