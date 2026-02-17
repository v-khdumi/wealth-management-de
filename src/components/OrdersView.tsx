import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Sparkle } from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { checkSuitability, checkCashSufficiency, checkConcentration } from '@/lib/business-logic'
import { toast } from 'sonner'
import type { OrderSide, OrderType, OrderStatus } from '@/lib/types'

interface OrdersViewProps {
  clientId: string
}

export function OrdersView({ clientId }: OrdersViewProps) {
  const { currentUser } = useAuth()
  const {
    portfolios,
    holdings,
    instruments,
    riskProfiles,
    orders,
    setOrders,
    setHoldings,
    setPortfolios,
    setTransactions,
    setAuditEvents,
  } = useDataStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY')
  const [orderType, setOrderType] = useState<OrderType>('MARKET')
  const [selectedInstrumentId, setSelectedInstrumentId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')

  const portfolio = useMemo(() => (portfolios || []).find(p => p.clientId === clientId), [portfolios, clientId])
  const riskProfile = useMemo(() => (riskProfiles || []).find(rp => rp.clientId === clientId), [riskProfiles, clientId])
  const portfolioHoldings = useMemo(() => (holdings || []).filter(h => h.portfolioId === portfolio?.id), [holdings, portfolio])
  const clientOrders = useMemo(() => (orders || []).filter(o => o.portfolioId === portfolio?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [orders, portfolio])

  const handleSubmitOrder = async () => {
    if (!currentUser || !portfolio || !riskProfile) return

    const instrument = (instruments || []).find(i => i.id === selectedInstrumentId)
    if (!instrument) {
      toast.error('Invalid instrument')
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity')
      return
    }

    const suitability = checkSuitability(instrument, riskProfile)
    if (!suitability.suitable) {
      toast.error('Suitability Check Failed', { description: suitability.reason })
      return
    }

    if (orderSide === 'BUY') {
      const estimatedCost = qty * (orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : instrument.currentPrice)
      const cashCheck = checkCashSufficiency(portfolio, estimatedCost)
      
      if (!cashCheck.sufficient) {
        toast.error('Insufficient Cash', {
          description: `Required: $${estimatedCost.toLocaleString()}, Available: $${cashCheck.available.toLocaleString()}`
        })
        return
      }

      const concentrationCheck = checkConcentration(portfolioHoldings, instruments || [], portfolio, selectedInstrumentId, qty)
      if (!concentrationCheck.acceptable) {
        toast.error('Concentration Limit Exceeded', {
          description: `This order would result in ${concentrationCheck.resultingPercentage.toFixed(1)}% concentration (limit ${concentrationCheck.limit}%)`
        })
        return
      }
    }

    const order: any = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portfolioId: portfolio.id,
      instrumentId: selectedInstrumentId,
      side: orderSide,
      orderType,
      quantity: qty,
      limitPrice: orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : undefined,
      status: 'PENDING' as OrderStatus,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      idempotencyKey: `${portfolio.id}-${selectedInstrumentId}-${Date.now()}`,
    }

    setOrders((current) => [...(current || []), order])

    const auditEvent: any = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ORDER_CREATED',
      actorUserId: currentUser.id,
      clientId,
      timestamp: new Date().toISOString(),
      details: { orderId: order.id, instrument: instrument.symbol, quantity: qty, side: orderSide },
    }
    setAuditEvents((current) => [...(current || []), auditEvent])

    toast.success('Order Submitted', { description: `Order for ${qty} shares of ${instrument.symbol} created` })
    
    setTimeout(() => executeOrder(order.id), 2000)

    setIsDialogOpen(false)
    resetForm()
  }

  const executeOrder = (orderId: string) => {
    setOrders((current) => {
      const updated = (current || []).map(o => {
        if (o.id === orderId && o.status === 'PENDING') {
          const instrument = (instruments || []).find(i => i.id === o.instrumentId)
          if (!instrument) return { ...o, status: 'FAILED' as OrderStatus, failureReason: 'Instrument not found' }

          const executedPrice = o.orderType === 'LIMIT' && o.limitPrice ? o.limitPrice : instrument.currentPrice
          
          setPortfolios((currentPortfolios) => {
            return (currentPortfolios || []).map(p => {
              if (p.id !== o.portfolioId) return p

              const totalCost = o.quantity * executedPrice

              if (o.side === 'BUY') {
                return { ...p, cash: p.cash - totalCost, totalValue: p.totalValue }
              } else {
                return { ...p, cash: p.cash + totalCost, totalValue: p.totalValue }
              }
            })
          })

          setHoldings((currentHoldings) => {
            const existingHolding = (currentHoldings || []).find(h => h.portfolioId === o.portfolioId && h.instrumentId === o.instrumentId)

            if (o.side === 'BUY') {
              if (existingHolding) {
                return (currentHoldings || []).map(h => {
                  if (h.id === existingHolding.id) {
                    const newQuantity = h.quantity + o.quantity
                    const newAvgCost = ((h.quantity * h.averageCost) + (o.quantity * executedPrice)) / newQuantity
                    return { ...h, quantity: newQuantity, averageCost: newAvgCost, currentPrice: executedPrice, lastUpdated: new Date().toISOString() }
                  }
                  return h
                })
              } else {
                const newHolding: any = {
                  id: `hold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  portfolioId: o.portfolioId,
                  instrumentId: o.instrumentId,
                  quantity: o.quantity,
                  averageCost: executedPrice,
                  currentPrice: executedPrice,
                  lastUpdated: new Date().toISOString(),
                }
                return [...(currentHoldings || []), newHolding]
              }
            } else {
              if (existingHolding) {
                return (currentHoldings || []).map(h => {
                  if (h.id === existingHolding.id) {
                    const newQuantity = h.quantity - o.quantity
                    if (newQuantity <= 0) return null as any
                    return { ...h, quantity: newQuantity, lastUpdated: new Date().toISOString() }
                  }
                  return h
                }).filter(Boolean)
              }
            }
            
            return currentHoldings || []
          })

          const transaction: any = {
            id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            portfolioId: o.portfolioId,
            instrumentId: o.instrumentId,
            type: o.side,
            quantity: o.quantity,
            price: executedPrice,
            amount: o.quantity * executedPrice,
            timestamp: new Date().toISOString(),
            orderId: o.id,
          }
          setTransactions((current) => [...(current || []), transaction])

          toast.success('Order Executed', { description: `${o.quantity} shares of ${instrument?.symbol} at $${executedPrice.toFixed(2)}` })

          return { ...o, status: 'EXECUTED' as OrderStatus, executedAt: new Date().toISOString(), executedPrice }
        }
        return o
      })
      return updated
    })
  }

  const resetForm = () => {
    setOrderSide('BUY')
    setOrderType('MARKET')
    setSelectedInstrumentId('')
    setQuantity('')
    setLimitPrice('')
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Orders</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={20} weight="bold" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Order</DialogTitle>
              <DialogDescription>
                Paper trading simulation with validation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Order Side</Label>
                <RadioGroup value={orderSide} onValueChange={(v) => setOrderSide(v as OrderSide)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BUY" id="buy" />
                    <Label htmlFor="buy">Buy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SELL" id="sell" />
                    <Label htmlFor="sell">Sell</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrument">Instrument</Label>
                <Select value={selectedInstrumentId} onValueChange={setSelectedInstrumentId}>
                  <SelectTrigger id="instrument">
                    <SelectValue placeholder="Select instrument..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(instruments || []).map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.symbol} - ${inst.currentPrice.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="space-y-2">
                <Label>Order Type</Label>
                <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MARKET" id="market" />
                    <Label htmlFor="market">Market</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LIMIT" id="limit" />
                    <Label htmlFor="limit">Limit</Label>
                  </div>
                </RadioGroup>
              </div>

              {orderType === 'LIMIT' && (
                <div className="space-y-2">
                  <Label htmlFor="limitPrice">Limit Price</Label>
                  <Input
                    id="limitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="Enter limit price"
                  />
                </div>
              )}

              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <p className="text-muted-foreground">Available Cash:</p>
                <p className="font-bold">${portfolio.cash.toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmitOrder} className="flex-1" disabled={!selectedInstrumentId || !quantity}>
                  Submit Order
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {clientOrders.length} order{clientOrders.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientOrders.map(order => {
                  const instrument = (instruments || []).find(i => i.id === order.instrumentId)
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold">{instrument?.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={order.side === 'BUY' ? 'default' : 'secondary'}>
                          {order.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{order.orderType}</TableCell>
                      <TableCell className="text-right">{order.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${order.executedPrice?.toFixed(2) || order.limitPrice?.toFixed(2) || instrument?.currentPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === 'EXECUTED' ? 'default' :
                            order.status === 'PENDING' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
