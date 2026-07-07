import { useTranslation } from 'react-i18next';

interface LanguageOnboardingProps {
  onComplete: () => void;
}

export function LanguageOnboarding({ onComplete }: LanguageOnboardingProps) {
  const { i18n } = useTranslation();

  const selectLanguage = (lang: 'en' | 'es') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('app-language', lang);
    onComplete();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#F9F2E7' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        <img
          src="/assets/Frame_2087326403.png"
          alt="Genuine Eats"
          style={{ width: 88, height: 88, borderRadius: 20 }}
          className="shadow-lg mb-8"
        />

        <h1
          className="text-center text-[var(--color-navy)] mb-1"
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            lineHeight: 1.3,
          }}
        >
          Welcome to Genuine Eats
        </h1>
        <p
          className="text-center text-[var(--color-navy)]/70 mb-10"
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 400,
            fontSize: 16,
          }}
        >
          Bienvenido a Genuine Eats
        </p>

        <div className="w-full space-y-4">
          <button
            onClick={() => selectLanguage('en')}
            className="w-full bg-white rounded-2xl p-5 text-left transition-all active:scale-[0.98] hover:ring-2 hover:ring-[var(--color-orange)]"
            style={{
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              border: '1.5px solid #e8e2d8',
            }}
          >
            <span
              className="block text-[var(--color-navy)]"
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              English
            </span>
            <span className="block text-sm text-gray-500 mt-1">
              Continue in English
            </span>
          </button>

          <button
            onClick={() => selectLanguage('es')}
            className="w-full bg-white rounded-2xl p-5 text-left transition-all active:scale-[0.98] hover:ring-2 hover:ring-[var(--color-orange)]"
            style={{
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              border: '1.5px solid #e8e2d8',
            }}
          >
            <span
              className="block text-[var(--color-navy)]"
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              Espa&ntilde;ol
            </span>
            <span className="block text-sm text-gray-500 mt-1">
              Continuar en Espa&ntilde;ol
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
