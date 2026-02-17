import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Confetti, Sparkle, Target, ArrowRight } from '@phosphor-icons/react'

interface MilestoneCelebrationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalName: string
  milestonePercentage: number
  currentAmount: number
  targetAmount: number
}

export function MilestoneCelebration({
  open,
  onOpenChange,
  goalName,
  milestonePercentage,
  currentAmount,
  targetAmount,
}: MilestoneCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [open])

  const getMessage = () => {
    if (milestonePercentage >= 100) {
      return {
        title: '🎉 Goal Achieved!',
        message: "You've reached your target!",
        emoji: '🏆',
      }
    } else if (milestonePercentage >= 75) {
      return {
        title: '🌟 Almost There!',
        message: "You're in the home stretch!",
        emoji: '🚀',
      }
    } else if (milestonePercentage >= 50) {
      return {
        title: '🎯 Halfway Milestone!',
        message: "You're halfway to your goal!",
        emoji: '⭐',
      }
    } else if (milestonePercentage >= 25) {
      return {
        title: '💪 Great Progress!',
        message: "You've reached the first quarter!",
        emoji: '🎊',
      }
    } else {
      return {
        title: '✨ First Steps!',
        message: "You've started your journey!",
        emoji: '🌱',
      }
    }
  }

  const { title, message, emoji } = getMessage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-4 border-primary/30">
        <AnimatePresence>
          {showConfetti && (
            <>
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    scale: [0, 1, 0.8, 0],
                    rotate: Math.random() * 360,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 0.3,
                    ease: 'easeOut',
                  }}
                  style={{
                    width: 12,
                    height: 12,
                    background: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'][
                      Math.floor(Math.random() * 5)
                    ],
                    borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <div className="relative z-10 py-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
              <span className="text-7xl">{emoji}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl font-display font-bold text-foreground">
              {title}
            </h2>
            <p className="text-xl text-muted-foreground">{message}</p>

            <div className="py-6">
              <p className="text-sm text-muted-foreground mb-2">Goal: {goalName}</p>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-5xl font-display font-bold text-primary wealth-number">
                  {milestonePercentage}%
                </span>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 max-w-xs mx-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Current</p>
                    <p className="font-bold wealth-number">${currentAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Target</p>
                    <p className="font-bold wealth-number">${targetAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {milestonePercentage < 100 && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-accent-foreground flex items-center justify-center gap-2">
                  <Sparkle size={16} weight="fill" className="text-accent" />
                  Keep up the great work!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your next milestone is just around the corner
                </p>
              </div>
            )}

            {milestonePercentage >= 100 && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-success flex items-center justify-center gap-2">
                  <Trophy size={16} weight="fill" />
                  Congratulations on achieving your goal!
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full gap-2"
              size="lg"
            >
              Continue
              <ArrowRight size={18} weight="bold" />
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
