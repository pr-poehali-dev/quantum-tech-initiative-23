import { useState } from "react"
import { useReveal } from "@/hooks/use-reveal"
import { MagneticButton } from "@/components/magnetic-button"
import Icon from "@/components/ui/icon"

const CEILING_TYPES = [
  { label: "Матовый", value: "Матовый", price: 450 },
  { label: "Глянцевый", value: "Глянцевый", price: 550 },
  { label: "Сатиновый", value: "Сатиновый", price: 500 },
  { label: "Тканевый", value: "Тканевый", price: 650 },
  { label: "Парящий", value: "Парящий", price: 750 },
]

const CALC_URL = "https://functions.poehali.dev/2e2aa61a-038b-4264-913e-965fef1b4cd2"

interface CalcResult {
  total: number
  price_range: { min: number; max: number }
  area: number
  ceiling_type: string
  price_per_m2: number
  installation: number
}

export function CalculatorSection({ scrollToSection }: { scrollToSection?: (index: number) => void }) {
  const { ref, isVisible } = useReveal(0.3)
  const [area, setArea] = useState("")
  const [ceilingType, setCeilingType] = useState("Матовый")
  const [result, setResult] = useState<CalcResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCalculate = async () => {
    if (!area || Number(area) <= 0) return
    setLoading(true)
    try {
      const res = await fetch(CALC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: Number(area), ceiling_type: ceilingType }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (n: number) => n.toLocaleString("ru-RU") + " ₽"

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center px-6 pt-20 md:px-12 md:pt-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-8 transition-all duration-700 md:mb-12 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Калькулятор
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">/ Узнайте стоимость за 10 секунд</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          {/* Left — inputs */}
          <div
            className={`space-y-6 transition-all duration-700 ${
              isVisible ? "translate-x-0 opacity-100" : "-translate-x-16 opacity-0"
            }`}
            style={{ transitionDelay: "150ms" }}
          >
            <div>
              <label className="mb-2 block font-mono text-xs text-foreground/60">Площадь потолка (м²)</label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                min="1"
                className="w-full border-b border-foreground/30 bg-transparent py-2 text-2xl font-light text-foreground placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none"
                placeholder="20"
              />
            </div>

            <div>
              <label className="mb-3 block font-mono text-xs text-foreground/60">Тип потолка</label>
              <div className="flex flex-wrap gap-2">
                {CEILING_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setCeilingType(t.value)}
                    className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-all duration-200 ${
                      ceilingType === t.value
                        ? "border-foreground/60 bg-foreground/15 text-foreground"
                        : "border-foreground/20 text-foreground/60 hover:border-foreground/40 hover:text-foreground/80"
                    }`}
                  >
                    {t.label} · {t.price} ₽/м²
                  </button>
                ))}
              </div>
            </div>

            <MagneticButton
              variant="primary"
              size="lg"
              onClick={handleCalculate}
            >
              {loading ? "Считаем..." : "Рассчитать стоимость"}
            </MagneticButton>
          </div>

          {/* Right — result */}
          <div
            className={`flex flex-col justify-center transition-all duration-700 ${
              isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            {result ? (
              <div className="space-y-6">
                <div className="border-l border-foreground/30 pl-6">
                  <div className="font-mono text-xs text-foreground/60">Ориентировочная стоимость</div>
                  <div className="mt-1 font-sans text-4xl font-light text-foreground md:text-5xl">
                    {formatPrice(result.total)}
                  </div>
                  <div className="mt-1 font-mono text-xs text-foreground/50">
                    от {formatPrice(result.price_range.min)} до {formatPrice(result.price_range.max)}
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Площадь", value: `${result.area} м²` },
                    { label: "Тип", value: result.ceiling_type },
                    { label: "Материал", value: `${result.price_per_m2} ₽/м²` },
                    { label: "Монтаж", value: formatPrice(result.installation) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between border-b border-foreground/10 py-1.5">
                      <span className="font-mono text-xs text-foreground/50">{row.label}</span>
                      <span className="font-mono text-xs text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                  <Icon name="Info" size={14} className="shrink-0 text-foreground/50" />
                  <p className="font-mono text-xs text-foreground/60">
                    Точную цену предложат бригады на аукционе — часто ниже расчётной
                  </p>
                </div>

                <MagneticButton
                  variant="secondary"
                  size="lg"
                  onClick={() => scrollToSection?.(5)}
                >
                  Разместить заявку на аукцион →
                </MagneticButton>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { icon: "Calculator", text: "Введите площадь и выберите тип потолка" },
                  { icon: "Gavel", text: "Разместите заявку — бригады предложат цену" },
                  { icon: "Trophy", text: "Выберите лучшее предложение" },
                ].map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 transition-all duration-700 ${
                      isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    }`}
                    style={{ transitionDelay: `${400 + i * 150}ms` }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground/20">
                      <Icon name={step.icon as "Calculator"} size={14} className="text-foreground/60" fallback="Circle" />
                    </div>
                    <p className="pt-1 font-mono text-xs leading-relaxed text-foreground/70">{step.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
