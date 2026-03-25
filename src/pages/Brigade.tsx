import { useState, useEffect } from "react"
import { GrainOverlay } from "@/components/grain-overlay"
import Icon from "@/components/ui/icon"

const ORDERS_URL = "https://functions.poehali.dev/d6d53170-6e92-4a93-876f-8472c6d7e95d"
const BIDS_URL = "https://functions.poehali.dev/baa20858-e76f-44bc-bbb8-a07c2ad1cff0"

interface Order {
  id: number
  name: string
  phone: string
  area: number
  ceiling_type: string
  comment: string
  city: string
  calculated_price: number
  created_at: string
  bids_count: number
  min_bid: number | null
}

interface Bid {
  id: number
  order_id: number
  brigade_name: string
  brigade_phone: string
  price: number
  comment: string
  created_at: string
}

interface BidForm {
  brigade_name: string
  brigade_phone: string
  price: string
  comment: string
}

const formatPrice = (n: number | null) => (n ? n.toLocaleString("ru-RU") + " ₽" : "—")
const formatDate = (s: string) => new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export default function Brigade() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [bidsLoading, setBidsLoading] = useState(false)
  const [bidForm, setBidForm] = useState<BidForm>({ brigade_name: "", brigade_phone: "", price: "", comment: "" })
  const [bidSubmitting, setBidSubmitting] = useState(false)
  const [bidSuccess, setBidSuccess] = useState(false)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch(ORDERS_URL)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const loadBids = async (orderId: number) => {
    setBidsLoading(true)
    try {
      const res = await fetch(`${BIDS_URL}?order_id=${orderId}`)
      const data = await res.json()
      setBids(data.bids || [])
    } catch {
      // silent
    } finally {
      setBidsLoading(false)
    }
  }

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order)
    setBidSuccess(false)
    setBidForm({ brigade_name: "", brigade_phone: "", price: "", comment: "" })
    loadBids(order.id)
  }

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !bidForm.brigade_name || !bidForm.brigade_phone || !bidForm.price) return
    setBidSubmitting(true)
    try {
      await fetch(BIDS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          brigade_name: bidForm.brigade_name,
          brigade_phone: bidForm.brigade_phone,
          price: Number(bidForm.price),
          comment: bidForm.comment,
        }),
      })
      setBidSuccess(true)
      setBidForm({ brigade_name: "", brigade_phone: "", price: "", comment: "" })
      loadBids(selectedOrder.id)
      loadOrders()
    } catch {
      // silent
    } finally {
      setBidSubmitting(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <GrainOverlay />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/15">
              <span className="font-sans text-sm font-bold text-foreground">П</span>
            </div>
            <span className="font-sans text-sm font-semibold text-foreground">ПотолокБиржа</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-foreground/50">Кабинет бригады</span>
            <button
              onClick={loadOrders}
              className="rounded-full border border-foreground/20 p-1.5 text-foreground/60 transition-all hover:border-foreground/40 hover:text-foreground"
            >
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Orders list */}
          <div>
            <div className="mb-6 flex items-baseline justify-between">
              <h1 className="font-sans text-3xl font-light text-foreground">Активные заявки</h1>
              <span className="font-mono text-xs text-foreground/50">{orders.length} заказов</span>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/60" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-foreground/40">
                <Icon name="Inbox" size={32} />
                <p className="font-mono text-sm">Заявок пока нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`w-full rounded-xl border p-4 text-left transition-all duration-200 hover:border-foreground/30 ${
                      selectedOrder?.id === order.id
                        ? "border-foreground/40 bg-foreground/10"
                        : "border-foreground/10 bg-foreground/5"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-foreground/40">#{order.id}</span>
                          <span className="font-sans text-base font-medium text-foreground">{order.name}</span>
                          {order.city && (
                            <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-mono text-xs text-foreground/60">
                              {order.city}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 font-mono text-xs text-foreground/50">
                          <span className="flex items-center gap-1">
                            <Icon name="Maximize2" size={10} />
                            {order.area} м²
                          </span>
                          <span>{order.ceiling_type}</span>
                          {order.comment && <span className="truncate max-w-[200px]">{order.comment}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {order.min_bid ? (
                          <div className="font-sans text-lg font-light text-foreground">{formatPrice(order.min_bid)}</div>
                        ) : order.calculated_price > 0 ? (
                          <div className="font-sans text-lg font-light text-foreground/60">~{formatPrice(order.calculated_price)}</div>
                        ) : null}
                        <div className="font-mono text-xs text-foreground/40">
                          {order.bids_count} {order.bids_count === 1 ? "ставка" : order.bids_count >= 2 && order.bids_count <= 4 ? "ставки" : "ставок"}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-foreground/30">{formatDate(order.created_at)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right panel — bids + bid form */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            {selectedOrder ? (
              <div className="rounded-xl border border-foreground/15 bg-foreground/5 p-6">
                {/* Order info */}
                <div className="mb-6 border-b border-foreground/10 pb-4">
                  <div className="mb-1 font-mono text-xs text-foreground/50">Заказ #{selectedOrder.id}</div>
                  <h2 className="mb-1 font-sans text-xl font-light text-foreground">{selectedOrder.name}</h2>
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-foreground/60">
                    <span>{selectedOrder.area} м²</span>
                    <span>{selectedOrder.ceiling_type}</span>
                    {selectedOrder.city && <span>{selectedOrder.city}</span>}
                    {selectedOrder.calculated_price > 0 && (
                      <span className="text-foreground/40">расчёт: ~{formatPrice(selectedOrder.calculated_price)}</span>
                    )}
                  </div>
                  {selectedOrder.comment && (
                    <p className="mt-2 font-mono text-xs text-foreground/50">{selectedOrder.comment}</p>
                  )}
                </div>

                {/* Existing bids */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-foreground/60">Текущие ставки</span>
                    {bidsLoading && <div className="h-3 w-3 animate-spin rounded-full border border-foreground/30 border-t-foreground/60" />}
                  </div>
                  {bids.length === 0 ? (
                    <p className="font-mono text-xs text-foreground/30">Ставок пока нет — будьте первым!</p>
                  ) : (
                    <div className="space-y-2">
                      {bids.map((bid, i) => (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between rounded-lg border p-2.5 ${
                            i === 0 ? "border-foreground/30 bg-foreground/10" : "border-foreground/10 bg-foreground/5"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              {i === 0 && <Icon name="Trophy" size={12} className="text-yellow-400" />}
                              <span className="font-sans text-sm text-foreground">{bid.brigade_name}</span>
                            </div>
                            {bid.comment && <span className="font-mono text-xs text-foreground/50">{bid.comment}</span>}
                          </div>
                          <span className="font-sans text-base font-medium text-foreground">{formatPrice(bid.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bid form */}
                <div className="border-t border-foreground/10 pt-4">
                  <h3 className="mb-4 font-mono text-xs text-foreground/60">Сделать ставку</h3>
                  {bidSuccess ? (
                    <div className="flex items-center gap-2 rounded-lg border border-foreground/20 bg-foreground/10 p-3">
                      <Icon name="CheckCircle" size={16} className="text-green-400" />
                      <span className="font-mono text-xs text-foreground/80">Ставка принята! Клиент увидит ваше предложение.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleBidSubmit} className="space-y-3">
                      <div>
                        <label className="mb-1 block font-mono text-xs text-foreground/50">Название бригады</label>
                        <input
                          type="text"
                          value={bidForm.brigade_name}
                          onChange={(e) => setBidForm({ ...bidForm, brigade_name: e.target.value })}
                          required
                          className="w-full border-b border-foreground/20 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/50 focus:outline-none"
                          placeholder="Бригада Иванова"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-mono text-xs text-foreground/50">Телефон</label>
                        <input
                          type="tel"
                          value={bidForm.brigade_phone}
                          onChange={(e) => setBidForm({ ...bidForm, brigade_phone: e.target.value })}
                          required
                          className="w-full border-b border-foreground/20 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/50 focus:outline-none"
                          placeholder="+7 (___) ___-__-__"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-mono text-xs text-foreground/50">Ваша цена (₽)</label>
                        <input
                          type="number"
                          value={bidForm.price}
                          onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                          required
                          min="1"
                          className="w-full border-b border-foreground/20 bg-transparent py-1.5 text-lg font-light text-foreground placeholder:text-foreground/30 focus:border-foreground/50 focus:outline-none"
                          placeholder="8000"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-mono text-xs text-foreground/50">Комментарий</label>
                        <input
                          type="text"
                          value={bidForm.comment}
                          onChange={(e) => setBidForm({ ...bidForm, comment: e.target.value })}
                          className="w-full border-b border-foreground/20 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/50 focus:outline-none"
                          placeholder="Сделаем за 1 день, гарантия 3 года"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={bidSubmitting}
                        className="w-full rounded-lg bg-foreground py-2.5 font-sans text-sm font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        {bidSubmitting ? "Отправляем..." : "Предложить цену"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-foreground/10 text-foreground/30">
                <Icon name="MousePointerClick" size={28} />
                <p className="font-mono text-sm">Выберите заказ из списка</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
