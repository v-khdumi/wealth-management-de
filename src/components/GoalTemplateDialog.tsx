import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Target,
  Sparkle,
  Calendar,
  CurrencyDollar,
  ArrowRight,
  MagnifyingGlass,
  TrendUp,
  Lightbulb,
} from '@phosphor-icons/react'
import { getTemplatesByType, getMostPopularTemplates, type GoalTemplate } from '@/lib/goal-templates'
import type { GoalType } from '@/lib/types'

interface GoalTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: GoalTemplate, customAmount: number, customYears: number) => void
}

export function GoalTemplateDialog({ open, onOpenChange, onSelectTemplate }: GoalTemplateDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)
  const [customAmount, setCustomAmount] = useState<number>(0)
  const [customYears, setCustomYears] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'popular' | GoalType>('popular')

  const handleTemplateClick = (template: GoalTemplate) => {
    setSelectedTemplate(template)
    setCustomAmount(template.suggestedAmount)
    setCustomYears(template.suggestedYears)
  }

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, customAmount, customYears)
      onOpenChange(false)
      setSelectedTemplate(null)
    }
  }

  const handleBack = () => {
    setSelectedTemplate(null)
  }

  const popularTemplates = getMostPopularTemplates(6)
  const retirementTemplates = getTemplatesByType('RETIREMENT')
  const houseTemplates = getTemplatesByType('HOUSE')
  const educationTemplates = getTemplatesByType('EDUCATION')
  const otherTemplates = getTemplatesByType('OTHER')

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return []
    
    const query = searchQuery.toLowerCase()
    return getMostPopularTemplates(12).filter(
      t => t.name.toLowerCase().includes(query) || 
           t.description.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const monthlyContribution = useMemo(() => {
    if (!selectedTemplate || customYears === 0) return 0
    return Math.ceil((customAmount - 0) / (customYears * 12))
  }, [selectedTemplate, customAmount, customYears])

  if (selectedTemplate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <span className="text-4xl">{selectedTemplate.icon}</span>
              <div>
                <div>{selectedTemplate.name}</div>
                <DialogDescription className="mt-1">
                  {selectedTemplate.description}
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-accent/10 border-2 border-accent/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Lightbulb size={24} weight="duotone" className="text-accent mt-1" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-accent-foreground">Helpful Tips</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {selectedTemplate.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label htmlFor="goal-amount" className="text-base font-semibold mb-3 block">
                  Target Amount
                </Label>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-display font-bold text-primary wealth-number">
                    ${customAmount.toLocaleString()}
                  </span>
                </div>
                <Slider
                  id="goal-amount"
                  min={selectedTemplate.minAmount}
                  max={selectedTemplate.maxAmount}
                  step={selectedTemplate.maxAmount > 500000 ? 50000 : selectedTemplate.maxAmount > 100000 ? 10000 : 5000}
                  value={[customAmount]}
                  onValueChange={(values) => setCustomAmount(values[0])}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <span>${selectedTemplate.minAmount.toLocaleString()}</span>
                  <span>${selectedTemplate.maxAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="goal-years" className="text-base font-semibold mb-3 block">
                  Time Horizon
                </Label>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-display font-bold text-secondary wealth-number">
                    {customYears}
                  </span>
                  <span className="text-2xl text-muted-foreground">years</span>
                </div>
                <Slider
                  id="goal-years"
                  min={selectedTemplate.minYears}
                  max={selectedTemplate.maxYears}
                  step={1}
                  value={[customYears]}
                  onValueChange={(values) => setCustomYears(values[0])}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <span>{selectedTemplate.minYears} years</span>
                  <span>{selectedTemplate.maxYears} years</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="p-6 border-2 border-primary/30 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Target Date</p>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {new Date(Date.now() + customYears * 365.25 * 24 * 60 * 60 * 1000).getFullYear()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendUp size={18} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Monthly Contribution</p>
                  </div>
                  <p className="text-2xl font-display font-bold text-primary wealth-number">
                    ${monthlyContribution.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                This is a simplified calculation. Actual returns will vary based on market performance and your investment strategy.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back to Templates
            </Button>
            <Button onClick={handleConfirm} className="flex-1 gap-2">
              Create Goal
              <ArrowRight size={16} weight="bold" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkle size={28} weight="duotone" className="text-accent" />
            Choose a Goal Template
          </DialogTitle>
          <DialogDescription>
            Start with a pre-configured template and customize it to your needs
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {searchQuery && filteredTemplates.length > 0 ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="grid md:grid-cols-2 gap-4 pb-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : searchQuery ? (
          <div className="flex-1 flex items-center justify-center text-center py-12">
            <div>
              <p className="text-muted-foreground mb-2">No templates found</p>
              <p className="text-sm text-muted-foreground">Try a different search term</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="RETIREMENT">Retirement</TabsTrigger>
              <TabsTrigger value="HOUSE">Home</TabsTrigger>
              <TabsTrigger value="EDUCATION">Education</TabsTrigger>
              <TabsTrigger value="OTHER">Other</TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid md:grid-cols-2 gap-4 pb-4">
                  {popularTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="RETIREMENT" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid md:grid-cols-2 gap-4 pb-4">
                  {retirementTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="HOUSE" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid md:grid-cols-2 gap-4 pb-4">
                  {houseTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="EDUCATION" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid md:grid-cols-2 gap-4 pb-4">
                  {educationTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="OTHER" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid md:grid-cols-2 gap-4 pb-4">
                  {otherTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  template: GoalTemplate
  onClick: () => void
}

function TemplateCard({ template, onClick }: TemplateCardProps) {
  const typeColors: Record<GoalType, string> = {
    RETIREMENT: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    HOUSE: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    EDUCATION: 'bg-green-500/10 text-green-700 border-green-500/20',
    OTHER: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  }

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-4xl">{template.icon}</span>
            <div className="flex-1">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <Badge variant="outline" className={`mt-1 text-xs ${typeColors[template.type]}`}>
                {template.type}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CurrencyDollar size={16} className="text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Suggested</p>
              <p className="font-semibold">${(template.suggestedAmount / 1000).toFixed(0)}k</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">Timeline</p>
              <p className="font-semibold">{template.suggestedYears} years</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
