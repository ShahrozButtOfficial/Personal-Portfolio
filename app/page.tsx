"use client"

import React from "react"
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion"
import { cubicBezier } from "framer-motion";

type SectionId = "home" | "about" | "experience" | "projects" | "contact"

const sections: { id: SectionId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
]

// Variants
const fadeUp = (distance = 24, delay = 0) => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1), delay },
  },
})

const staggerChildren = (stagger = 0.06, delayChildren = 0.1) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren, when: "beforeChildren" },
  },
})

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1), delay } },
})

function useActiveSection(ids: SectionId[]) {
  const [active, setActive] = React.useState<SectionId>("home")
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id") as SectionId
          if (entry.isIntersecting && id) setActive(id)
        })
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])

  return { active, setActive }
}

function AnimatedText({
  text,
  className,
  per = "word",
  viewportAmount = 0.3
}: {
  text: string
  className?: string
  per?: "word" | "char"
  viewportAmount?: number
}) {
  const shouldReduce = useReducedMotion()
  const parts = per === "char" ? Array.from(text) : text.split(" ")
  return (
    <motion.span
      variants={staggerChildren(0.04, 0)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: viewportAmount }}
      className={`inline-block ${className}`}
    >
      {parts.map((p, i) => (
        <motion.span
          key={i}
          variants={
            shouldReduce
              ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
              : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }
          }
          transition={{ duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1) }}
          className="inline-block"
        >
          {p}
          {per === "word" ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  )
}

function Section({
  id,
  children,
  className,
}: {
  id: SectionId
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 sm:px-6 md:px-10 lg:px-16 ${className || ""}`}>
      {children}
    </section>
  )
}

// Utility: magnetic button hook for subtle pointer-follow motion
function useMagnetic(strength = 16) {
  const ref = React.useRef<HTMLElement | null>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      el.animate([{ transform: `translate(${x / strength}px, ${y / strength}px)` }], {
        duration: 200,
        fill: "forwards",
        easing: "cubic-bezier(0.22,1,0.36,1)",
      })
    }
    const reset = () => {
      el.animate([{ transform: "translate(0,0)" }], { duration: 250, fill: "forwards" })
    }
    el.addEventListener("mousemove", handleMove)
    el.addEventListener("mouseleave", reset)
    return () => {
      el.removeEventListener("mousemove", handleMove)
      el.removeEventListener("mouseleave", reset)
    }
  }, [strength])
  return ref
}

// 3D tilt wrapper for project cards
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const sx = useSpring(rx, { stiffness: 200, damping: 20 })
  const sy = useSpring(ry, { stiffness: 200, damping: 20 })

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 10) // rotateY
    rx.set(-(py - 0.5) * 10) // rotateX
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: sy, rotateY: sx, transformStyle: "preserve-3d" as any }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function MobileMenu({ active, onJump, isOpen, onClose }: { 
  active: SectionId; 
  onJump: (id: SectionId) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          
          {/* Menu */}
          <motion.nav
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 h-full w-64 border-l border-border bg-background/95 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col p-6">
              <div className="mb-8 flex items-center justify-between">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onJump("home")
                    onClose()
                  }}
                  className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 text-lg tracking-tight"
                >
                  {"< SB . DEV >"}
                </motion.button>
                <button
                  onClick={onClose}
                  className="rounded-md p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Close menu"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {sections.map((s) => {
                  const isActive = active === s.id
                  return (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onJump(s.id)
                        onClose()
                      }}
                      className={`block w-full rounded-lg px-4 py-3 text-left text-base font-medium transition-colors ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {s.label}
                    </motion.button>
                  )
                })}
              </div>
              
              <motion.a
                whileTap={{ scale: 0.98 }}
                href="#contact"
                onClick={(e) => {
                  e.preventDefault()
                  onJump("contact")
                  onClose()
                }}
                className="mt-6 rounded-lg bg-primary px-4 py-3 text-center text-base font-medium text-primary-foreground"
              >
                Contact
              </motion.a>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}

function Navbar({ active, onJump }: { active: SectionId; onJump: (id: SectionId) => void }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  
  // Add blur effect based on scroll
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0.8, 1])

  return (
    <>
      <motion.header 
        className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
        style={{ opacity: headerOpacity }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 md:px-10 lg:px-16">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onJump("home")}
            className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 text-lg tracking-tight hover:opacity-90 transition-opacity duration-300"
            aria-label="Go to home"
          >
            {"< SB . DEV >"}
          </motion.button>

          {/* Desktop Navigation */}
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {sections.map((s) => {
              const isActive = active === s.id
              return (
                <div key={s.id} className="relative">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onJump(s.id)}
                    className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-highlight"
                        className="absolute inset-0 -z-10 rounded-md bg-gradient-to-r from-primary to-accent shadow-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    {s.label}
                  </motion.button>
                </div>
              )
            })}
          </nav>

          {/* Desktop Contact Button */}
          <div className="hidden md:block">
            <motion.a
              whileTap={{ scale: 0.98 }}
              whileHover={{ 
                scale: 1.05,
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))"
              }}
              href="#contact"
              onClick={(e) => {
                e.preventDefault()
                onJump("contact")
              }}
              className="rounded-md bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-200"
            >
              Contact
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
        </div>
        <motion.div 
          aria-hidden="true" 
          className="h-0.5 bg-gradient-to-r from-primary to-accent" 
          style={{ scaleX, transformOrigin: "left" }} 
        />
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Mobile Menu */}
      <MobileMenu 
        active={active} 
        onJump={onJump} 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
    </>
  )
}

function Hero() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 40])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05])
  const ctaMagnet = useMagnetic(14)
  const ghostMagnet = useMagnetic(18)

  return (
    <div
      ref={containerRef}
      className="mx-auto max-w-6xl w-full py-12 md:py-24"
    >
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-center gap-8 lg:gap-10">
        {/* Text Content - Full width on mobile, half on desktop */}
        <div className="w-full lg:col-span-1">
          <motion.div 
            variants={fadeUp(28)} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut"
            }}
          >
            <span className="inline-block rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              Available for work
            </span>
          </motion.div>

          <h1 className="text-balance mt-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            <AnimatedText 
              text="Hey, I'm Shahroz Butt —" 
              className="block bg-clip-text text-transparent" 
              viewportAmount={0.3}
            />
            <motion.span
              className="block bg-clip-text text-transparent mt-2"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, oklch(0.70 0.12 220) 0%, oklch(0.75 0.10 200) 50%, oklch(0.70 0.12 220) 100%)",
                backgroundSize: "200% 100%",
              }}
              initial={{ backgroundPositionX: "0%" }}
              animate={{ backgroundPositionX: ["0%", "100%"] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, repeatType: "mirror", duration: 8, ease: "linear" }}
            >
              <AnimatedText
                text="I build modern web apps and AI systems that blend performance, creativity, and innovation."
                className="block whitespace-pre-wrap"
                viewportAmount={0.3}
              />
            </motion.span>
          </h1>

          <motion.p
            variants={fadeUp(20, 0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-pretty mt-4 max-w-prose text-base text-muted-foreground sm:mt-6 sm:text-lg"
          >
            I care about clean UX, performance, and delivering production‑ready solutions. Let's turn ideas into products
            that actually scale.
          </motion.p>

          <motion.div
            variants={staggerChildren(0.08, 0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8"
          >
            <motion.a
              ref={ctaMagnet as any}
              variants={fadeUp(16)}
              href="#projects"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-200"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 36px 0 color-mix(in oklab, var(--color-primary) 35%, transparent)" 
              }}
              whileTap={{ scale: 0.95 }}
            >
              View Projects
            </motion.a>
            <motion.a
              ref={ghostMagnet as any}
              variants={fadeUp(16, 0.05)}
              href="#contact"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className="rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground transition-all duration-200"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 28px 0 color-mix(in oklab, var(--color-foreground) 20%, transparent)" 
              }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Me
            </motion.a>
          </motion.div>

          {/* Skills Marquee with continuous right-to-left animation */}
          <div aria-hidden className="mt-6 overflow-hidden sm:mt-8">
            <motion.div
              className="flex gap-3 whitespace-nowrap text-xs text-muted-foreground"
              animate={{ 
                x: ["0%", "-50%"] 
              }}
              transition={{
                x: {
                  duration: 20,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }
              }}
            >
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  {[
                    "TypeScript",
                    "React",
                    "Next.js",
                    "Tailwind",
                    "Framer Motion",
                    "Python",
                    "AWS",
                    "NLP",
                    "DeBERTa",
                    "Speech-to-Text",
                    "Transformers",
                    "Docker",
                    "DynamoDB",
                    "CI/CD",
                  ].map((t) => (
                    <motion.span 
                      key={t} 
                      className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Image Content - Centered on all screens */}
        <motion.div
          className="w-full lg:col-span-1 flex justify-center lg:justify-end"
          initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          style={{ y: imgY, scale: imgScale }}
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
          delay: 0.3,
    type: "spring",
    stiffness: 250,
    damping: 18,
    y: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
  }}
        >
          <div className="relative aspect-square w-48 sm:w-56 md:w-64 lg:w-80 mx-auto lg:mx-0">
            {/* Main image container with dark theme styling */}
            <div className="relative w-full h-full overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card to-muted shadow-2xl">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60 z-10" />
              
              {/* Profile image with dark theme filters */}
              <motion.img
                src="/img.png"
                alt="Shahroz Butt portrait"
                className="h-full w-full object-cover mix-blend-luminosity contrast-110 brightness-110 saturate-110"
                initial={false}
                whileHover={{ scale: 1.05, filter: "contrast(115%) brightness(115%) saturate(120%)" }}
                transition={{ type: "tween", duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1) }}
                style={{
                  filter: "contrast(110%) brightness(110%) saturate(110%)",
                }}
              />
              
              {/* Animated gradient border effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 opacity-50"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              />
              
              {/* Experience badge with continuous animation */}
              <motion.div
  className="pointer-events-none absolute -left-2 top-4 rounded-md border border-primary/20 bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg"
  initial={{ opacity: 0, y: -8, rotate: -6 }}
  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  animate={{
    y: [0, -4, 0],
    rotate: [-6, -4, -6],
  }}
  transition={{
    duration: 3,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
    type: "tween", 
  }}
>
  🚀 1+ yrs experience
</motion.div>


              {/* Subtle glow effect */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl"
                initial={{ boxShadow: "0 0 0px rgba(28, 100, 242, 0.1)" }}
                whileHover={{ 
                  boxShadow: "0 0 80px rgba(28, 100, 242, 0.25), inset 0 0 60px rgba(28, 100, 242, 0.1)" 
                }}
                transition={{ type: "tween", duration: 0.3 }}
              />
            </div>
            
            {/* Floating particles around image */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full bg-primary/40 ${
                  i === 1 ? "top-2 -right-2" : 
                  i === 2 ? "bottom-4 -left-1" : 
                  "top-3/4 -right-3"
                }`}
                animate={{
                  y: [0, -15, 0],
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="mx-auto max-w-4xl py-12 md:py-24">
      <MaskReveal>
        <motion.h2
          variants={fadeUp(20)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-2xl font-semibold sm:text-3xl md:text-4xl"
        >
          <AnimatedText text="About Me" viewportAmount={0.3} />
        </motion.h2>
      </MaskReveal>
      <motion.p
        variants={fadeUp(18, 0.05)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg"
      >
        I'm a BS Computer Science student and software developer passionate about modern web stacks and applied AI. My
        work ranges from building cloud‑native systems on AWS to prototyping NLP and speech‑to‑text pipelines for
        real‑time media monitoring. I enjoy turning research ideas into real‑world tools and delivering software that
        solves actual problems.
      </motion.p>

      <motion.div
        variants={staggerChildren(0.06, 0.2)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-3"
      >
        <motion.div 
          variants={fadeUp(16)} 
          className="rounded-lg border border-border bg-card p-4 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          }}
        >
          <div className="text-sm font-medium text-muted-foreground">What I Do</div>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <span className="rounded-md bg-accent px-2 py-1 text-accent-foreground">
              Build SPAs with React/Vue/Nuxt + Tailwind
            </span>
            <span className="rounded-md bg-accent px-2 py-1 text-accent-foreground">Architect serverless on AWS</span>
            <span className="rounded-md bg-accent px-2 py-1 text-accent-foreground">
              Prototype and deploy NLP/ML (e.g., DeBERTa)
            </span>
          </div>
        </motion.div>
        <motion.div 
          variants={fadeUp(16, 0.05)} 
          className="rounded-lg border border-border bg-card p-4 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 0.2
          }}
        >
          <div className="text-sm font-medium text-muted-foreground">Focus</div>
          <div className="mt-2 text-sm text-foreground">
            Finishing my AI‑Powered News Monitoring FYP, improving deployment pipelines, and building production‑ready
            SaaS features for small businesses.
          </div>
        </motion.div>
        <motion.div 
          variants={fadeUp(16, 0.1)} 
          className="rounded-lg border border-border bg-card p-4 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 0.4
          }}
        >
          <div className="text-sm font-medium text-muted-foreground">Skills</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "React",
              "Vue/Nuxt",
              "TailwindCSS",
              "Framer Motion",
              "Node.js",
              "Express",
              "Python",
              "NLP",
              "Speech‑to‑Text",
              "AWS",
              "Docker",
              "SQL",
              "CI/CD",
            ].map((s) => (
              <motion.span 
                key={s} 
                className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {s}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function Experience() {
  const items = [
    {
      role: "AI Engineer & FYP Lead",
      org: "AI-Powered News Monitoring System",
      period: "2025",
      bullets: [
        "Designed an end-to-end real-time media monitoring system using speech-to-text and NLP pipelines with DeBERTa for fake-news detection.",
        "Built data ingestion, preprocessing, and alerting modules.",
      ],
    },
    {
      role: "Cloud Developer / Architect",
      org: "MediAlert — Smart Healthcare",
      period: "2025",
      bullets: [
        "Designed cloud-native analytics and notification workflows using AWS Lambda, Step Functions, API Gateway, and Cognito.",
        "Implemented event-driven pipelines and secure authentication.",
      ],
    },
    {
      role: "Full-Stack Engineer (E-commerce)",
      org: "CraftKart",
      period: "2024",
      bullets: [
        "Built a scalable e-commerce platform with React/Nuxt, RDS, and S3, with Auto Scaling EC2 instances.",
        "Developed payment flows, catalog systems, and admin dashboards.",
      ],
    },
    {
      role: "Frontend Developer (Portfolio & Tools)",
      org: "Personal / University Projects",
      period: "2023–2025",
      bullets: ["Created animated search interfaces, draggable UIs, dashboards, and print‑ready PDF export features."],
    },
  ]

  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const spineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <div className="mx-auto max-w-4xl py-12 md:py-24">
      <motion.h2
        variants={fadeUp(20)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="text-2xl font-semibold sm:text-3xl md:text-4xl"
      >
        <AnimatedText text="Experience" viewportAmount={0.3} />
      </motion.h2>

      <div ref={ref} className="relative mt-8 space-y-6 sm:mt-10 sm:space-y-8">
        <motion.div
          aria-hidden
          className="absolute left-3 top-0 h-full w-[2px] origin-top rounded bg-primary/20 md:left-4"
          style={{ scaleY: spineScaleY }}
        />
        {items.map((item, idx) => (
          <motion.div
            key={item.role}
            className="relative rounded-lg border border-border bg-card p-4 pl-8 sm:p-6 md:pl-10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ delay: idx * 0.06, duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1) }}
          >
            <motion.span
              className="absolute left-0 top-6 block h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-md"
              animate={{ 
                scale: [1, 1.2, 1],
                boxShadow: ["0 0 0 0px var(--color-primary)", "0 0 0 10px transparent", "0 0 0 0px var(--color-primary)"] 
              }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeOut" }}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="text-lg font-semibold">{item.role}</div>
                <div className="text-sm text-muted-foreground">{item.org}</div>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right">{item.period}</div>
            </div>
            <ul className="mt-3 list-inside space-y-2 sm:mt-4">
              {item.bullets.map((b, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.6 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="text-sm text-foreground"
                >
                  • {b}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

type Project = {
  title: string
  description: string
  image: string
  tags: string[]
  link?: string
}

function Projects() {
  const projects: Project[] = [
    {
      title: "Quiz Web Application",
      description:
        "This project is a responsive quiz web application developed using React. The application simulates a quiz environment where users can answer multiple-choice questions divided into different sections, similar to a university entrance test.",
      image: "/msquizflix.png",
      tags: ["React", "CSS", "JS"],
      link: "https://msquizflix.netlify.app/",
    },
    {
      title: "Milk Budget Management Web Application",
      description:
        "The Milk Budget Management Web Application is a user-friendly platform designed to help users efficiently track and manage their monthly milk expenses. This application leverages modern web technologies, including Vue.js for the frontend, Express.js for the backend, and MongoDB as the database, to provide a seamless and interactive user experience.",
      image: "/milkish.png",
      tags: ["CSS", "HTML", "Dynamic Data Store","JS"],
      link: "https://mbudget.netlify.app/",
    },
    {
      title: "Result Generator System",
      description:
        "This project implements a Vue.js-based form for student marks entry with features to dynamically generate a PDF report. The form allows users to input student details such as name, month, class, number of subjects, and corresponding marks. A table dynamically populates for marks entry based on the number of subjects, enabling seamless user interaction. The PDF generation leverages jsPDF and jspdf-autotable libraries to create a professional report that includes: Student details, Subject-wise marks breakdown, Total marks, Obtained marks, Percentage, A random remark based on the percentage, A section for a signature. The user interface is designed with Tailwind CSS for responsiveness and aesthetic appeal, ensuring usability and accessibility. This project combines modern front-end frameworks and libraries to streamline academic data management, offering scalability and customization for diverse educational applications.",
      image: "",
      tags: ["vue", "ts", "tailwind"],
      link: "https://github.com/ShahrozButtOfficial/ResultGenerator/tree/master",
    },
    {
      title: "Retail Bill System",
      description:
        "This project is a Billing Management System designed using Python's Tkinter library. It is a desktop-based application tailored for professional use, allowing businesses to manage customer details, generate bills, and calculate product prices with taxes. The system includes modules for tracking cosmetics, grocery items, and beverages. Features include: Bill Generation: Automatically generates a bill with itemized details, tax calculations, and a total amount. Search Functionality: Allows users to retrieve past bills using a unique bill number. Save and Print: Bills can be saved in a structured format for future reference. User-friendly Interface: Built with Tkinter's LabelFrames and Buttons for an intuitive experience. This application is ideal for small to medium-sized businesses looking for a simple and efficient billing solution.",
      image: "/khatanama.png",
      tags: ["Python", "Tkinter"],
      link: "https://github.com/ShahrozButtOfficial/Retail-Billing-System",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl py-12 md:py-24">
      <motion.h2
        variants={fadeUp(20)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="text-2xl font-semibold sm:text-3xl md:text-4xl"
      >
        <AnimatedText text="Selected Projects" viewportAmount={0.3} />
      </motion.h2>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, idx) => (
          <TiltCard key={p.title} className="will-change-transform">
            <motion.a
              href={p.link}
              target={p.link && p.link !== "#" ? "_blank" : undefined}
              rel={p.link && p.link !== "#" ? "noreferrer" : undefined}
              className="group relative block overflow-hidden rounded-xl border border-border bg-card shadow-lg"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ delay: idx * 0.06, duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1) }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative overflow-hidden">
                <motion.img
                  src={p.image || "/placeholder.svg?height=200&width=320&query=project image"}
                  alt={`${p.title} preview`}
                  className="h-40 w-full object-cover sm:h-48 md:h-40 lg:h-44"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "tween", duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1) }}
                />
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 to-transparent opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{p.title}</h3>
                  <motion.span
                    className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.8 }}
                  >
                    Case
                  </motion.span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <motion.span 
                      key={t} 
                      className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.a>
          </TiltCard>
        ))}
      </div>
    </div>
  )
}

function Contact() {
  const controls = useAnimationControls()
  const ref = React.useRef<HTMLFormElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle')

  React.useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [inView, controls])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message')
    }

    try {
      // Using Formspree for form submission (free service)
      const response = await fetch('https://formspree.io/f/mzzjyakp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSubmitStatus('success')
        if (ref.current) {
          ref.current.reset()
        }         
      } else {
        throw new Error('Form submission failed')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-12 md:py-24">
      <MaskReveal>
        <motion.h2
          variants={fadeUp(20)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-2xl font-semibold sm:text-3xl md:text-4xl"
        >
          <AnimatedText text="Let's Collaborate!" viewportAmount={0.3} />
        </motion.h2>
      </MaskReveal>
      <motion.p
        variants={fadeUp(18, 0.05)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg"
      >
        Have a project in mind? I'm open to freelance opportunities and collaborations that involve AI, cloud apps, or
        frontend design.
      </motion.p>
      
      <motion.form
        ref={ref}
        variants={staggerChildren(0.06, 0.2)}
        initial="hidden"
        animate={controls}
        className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-4 sm:mt-8 sm:p-6"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Name *</span>
          <motion.input
            variants={fadeUp(14)}
            name="name"
            required
            placeholder="Your name"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isSubmitting}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Email *</span>
          <motion.input
            variants={fadeUp(14, 0.05)}
            type="email"
            required
            name="email"
            placeholder="Your email"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isSubmitting}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Message *</span>
          <motion.textarea
            variants={fadeUp(14, 0.1)}
            name="message"
            required
            rows={5}
            placeholder="Tell me about your project..."
            className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isSubmitting}
          />
        </label>
        
        {/* Status Messages */}
        <AnimatePresence>
          {submitStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-md bg-green-500/10 border border-green-500/20 p-3"
            >
              <p className="text-sm text-green-600">Thanks for your message! I'll get back to you soon.</p>

            </motion.div>
          )}
          {submitStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-md bg-red-500/10 border border-red-500/20 p-3"
            >
              <p className="text-sm text-red-600">Something went wrong. Please try again or email me directly.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          variants={fadeUp(14, 0.15)}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          whileHover={isSubmitting ? {} : { 
            scale: 1.02,
            boxShadow: "0 0 36px 0 color-mix(in oklab, var(--color-primary) 35%, transparent)" 
          }}
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed sm:w-fit"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
            />
          ) : null}
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </motion.button>
        
        <div className="text-xs text-muted-foreground">
          Prefer email? <a href="mailto:bshahroz48@gmail.com" className="text-primary hover:underline">bshahroz48@gmail.com</a>
        </div>
      </motion.form>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6 md:flex-row md:px-10 lg:px-16">
        <div className="order-2 text-center md:order-1 md:text-left">
          © {new Date().getFullYear()} Shahroz Butt. All rights reserved.
        </div>
        <div className="order-1 flex items-center gap-4 md:order-2">
          <motion.a 
            href="https://pk.linkedin.com/in/muhammad-shahroz-butt-4aa093309" 
            className="hover:text-foreground transition-colors" 
            aria-label="LinkedIn" 
            target="_blank"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            LinkedIn
          </motion.a>
          <motion.a 
            href="https://github.com/ShahrozButtOfficial" 
            className="hover:text-foreground transition-colors" 
            aria-label="GitHub" 
            target="_blank"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            GitHub
          </motion.a>
          <motion.a 
            href="mailto:bshahroz48@gmail.com" 
            className="hover:text-foreground transition-colors" 
            aria-label="Email" 
            target="_blank"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Email
          </motion.a>
          <motion.a 
            href="https://www.instagram.com/shahroz_butt_official/" 
            className="hover:text-foreground transition-colors" 
            aria-label="Instagram" 
            target="_blank"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Instagram
          </motion.a>
        </div>
      </div>
    </footer>
  )
}

// scroll-to-top floating action button
function ScrollTopFab() {
  const { scrollYProgress } = useScroll()
  const show = useTransform(scrollYProgress, [0.15, 0.2], [0, 1])
  return (
    <AnimatePresence>
      <motion.button
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg sm:bottom-6 sm:right-6"
        style={{ opacity: show, scale: show }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.span
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          ↑
        </motion.span>
      </motion.button>
    </AnimatePresence>
  )
}

function MaskReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const shouldReduce = useReducedMotion()
  if (shouldReduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% 0 0 round 8px)" }}
      whileInView={{ clipPath: "inset(0 0% 0 0 round 8px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: cubicBezier(0.22, 1, 0.36, 1) }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function BackgroundFX() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.2 })
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.2 })
  const shouldReduce = useReducedMotion()
  const bg = useMotionTemplate`radial-gradient(600px circle at ${sx}px ${sy}px, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 60%)`

  React.useEffect(() => {
    if (shouldReduce) return
    const onMove = (e: MouseEvent) => {
      sx.set(e.clientX)
      sy.set(e.clientY)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [shouldReduce, sx, sy])

  if (shouldReduce) return null
  return <motion.div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{ backgroundImage: bg }} />
}

// Add continuous background animation component
function ContinuousBackgroundAnimation() {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden">
      {/* Animated gradient orbs */}
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full mix-blend-soft-light ${
            i === 1 ? "w-96 h-96 bg-primary/10 top-1/4 -left-24" :
            i === 2 ? "w-80 h-80 bg-accent/10 top-1/2 -right-20" :
            i === 3 ? "w-64 h-64 bg-primary/5 bottom-1/4 left-1/4" :
            "w-72 h-72 bg-accent/5 top-1/3 right-1/3"
          }`}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 2
          }}
        />
      ))}
    </div>
  )
}

export default function Page() {
  const { active, setActive } = useActiveSection(sections.map((s) => s.id as SectionId))

  const onJump = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    setActive(id)
  }

  return (
    <main className="min-h-dvh overflow-x-hidden">
      <style jsx global>{`
        :root {
          /* neutrals */
          --background: oklch(0.14 0.02 250);        /* midnight */
          --foreground: oklch(0.98 0 0);            /* near-white */
          --card: oklch(0.17 0.02 250);
          --card-foreground: var(--foreground);
          --popover: var(--card);
          --popover-foreground: var(--foreground);

          /* brand */
          --primary: oklch(0.72 0.12 210);          /* cyan */
          --primary-foreground: oklch(0.15 0.02 250); /* dark blue for strong contrast */
          --accent: oklch(0.78 0.12 70);            /* amber */
          --accent-foreground: oklch(0.17 0.02 80); /* dark amber */

          /* support */
          --secondary: oklch(0.20 0.02 250);
          --secondary-foreground: var(--foreground);
          --muted: oklch(0.22 0.01 250);
          --muted-foreground: oklch(0.76 0.02 250);
          --destructive: oklch(0.60 0.20 25);
          --destructive-foreground: var(--foreground);

          /* ui tokens */
          --border: oklch(0.28 0.02 250);
          --input: var(--border);
          --ring: oklch(0.65 0.04 210);

          /* charts keep in family */
          --chart-1: var(--primary);
          --chart-2: oklch(0.68 0.10 230);
          --chart-3: oklch(0.64 0.11 180);
          --chart-4: var(--accent);
          --chart-5: oklch(0.60 0.10 140);
        }
      `}</style>

      {/* Continuous background animations */}
      <ContinuousBackgroundAnimation />
      
      {/* background spotlight */}
      <BackgroundFX />
      
      {/* sticky nav with blur effect */}
      <Navbar active={active} onJump={onJump} />

      {/* Home */}
      <Section id="home" className="pt-8 sm:pt-10">
        <Hero />
      </Section>

      {/* About */}
      <Section id="about">
        <About />
      </Section>

      {/* Experience */}
      <Section id="experience">
        <Experience />
      </Section>

      {/* Projects */}
      <Section id="projects">
        <Projects />
      </Section>

      {/* Contact */}
      <Section id="contact">
        <Contact />
      </Section>

      {/* Footer */}
      <Footer />

      {/* Floating scroll-to-top */}
      <ScrollTopFab />
    </main>
  )
}