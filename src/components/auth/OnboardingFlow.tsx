import { useState } from 'react'
import { ChevronRight, Utensils, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { FDA_ALLERGENS, LIFESTYLE_PREFERENCES, ALLERGEN_ICONS } from '../../lib/allergens'

const DIETARY_PREFERENCES = ['No Preference', ...LIFESTYLE_PREFERENCES]

interface Props {
  userId: string
  userName: string
  onComplete: () => void
}

type Step = 'welcome' | 'allergens' | 'diet' | 'done'

export default function OnboardingFlow({ userId, userName, onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome')
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [selectedDiet, setSelectedDiet] = useState('No Preference')
  const [saving, setSaving] = useState(false)

  const firstName = userName.split(' ')[0] || 'there'

  const toggleAllergen = (a: string) =>
    setSelectedAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    )

  const handleFinish = async () => {
    setSaving(true)
    await supabase
      .from('users')
      .update({
        dietary_alerts: selectedAllergens,
        dietary_preference: selectedDiet,
        onboarding_completed: true,
      })
      .eq('id', userId)
    setSaving(false)
    onComplete()
  }

  const stepIndex = { welcome: 0, allergens: 1, diet: 2, done: 3 }[step]
  const totalSteps = 3

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-[var(--color-orange)] transition-all duration-500"
            style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
          />
        </div>

        <div className="px-7 py-8">
          {step === 'welcome' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-[var(--color-orange)] flex items-center justify-center mb-6">
                <Utensils className="w-9 h-9 text-[var(--color-orange)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-navy)] mb-2">
                Welcome, {firstName}!
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                Let's set up your dining preferences so we can personalize your experience at every station.
              </p>
              <button
                onClick={() => setStep('allergens')}
                className="w-full bg-[var(--color-orange)] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-95 transition"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 'allergens' && (
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-widest mb-1">
                Step 1 of 2
              </p>
              <h2 className="text-xl font-bold text-[var(--color-navy)] mb-1">Allergen Alerts</h2>
              <p className="text-sm text-gray-500 mb-5">
                Select any allergens to avoid. We'll flag menu items that contain them.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {FDA_ALLERGENS.map((a) => {
                  const active = selectedAllergens.includes(a)
                  return (
                    <button
                      key={a}
                      onClick={() => toggleAllergen(a)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm font-medium ${
                        active
                          ? 'border-[var(--color-orange)] bg-orange-50 text-[var(--color-orange)]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{ALLERGEN_ICONS[a]} {a}</span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                          active
                            ? 'bg-[var(--color-orange)] border-[var(--color-orange)]'
                            : 'border-gray-300'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setStep('diet')}
                className="w-full bg-[var(--color-orange)] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-95 transition"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'diet' && (
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-widest mb-1">
                Step 2 of 2
              </p>
              <h2 className="text-xl font-bold text-[var(--color-navy)] mb-1">Lifestyle Preference</h2>
              <p className="text-sm text-gray-500 mb-5">
                Choose a preference to filter menu items across all stations.
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {DIETARY_PREFERENCES.map((d) => {
                  const active = selectedDiet === d
                  const icon = ALLERGEN_ICONS[d] || ''
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDiet(d)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                        active
                          ? 'border-[var(--color-orange)] bg-orange-50 text-[var(--color-orange)]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{icon ? `${icon} ${d}` : d}</span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                          active
                            ? 'bg-[var(--color-orange)] border-[var(--color-orange)]'
                            : 'border-gray-300'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full bg-[var(--color-orange)] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-95 transition disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>All Done <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
