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
    transition: { duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1)
, delay },
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
  visible: { opacity: 1, transition: { duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1)
, delay } },
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
}: {
  text: string
  className?: string
  per?: "word" | "char"
}) {
  const shouldReduce = useReducedMotion()
  const parts = per === "char" ? Array.from(text) : text.split(" ")
  return (
    <motion.span
      variants={staggerChildren(0.04, 0)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.6 }}
      className={className}
    >
      {parts.map((p, i) => (
        <motion.span
          key={i}
          variants={
            shouldReduce
              ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
              : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }
          }
          transition={{ duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1)
 }}
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
    <section id={id} className={`scroll-mt-24 px-6 md:px-10 lg:px-16 ${className || ""}`}>
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

function Navbar({ active, onJump }: { active: SectionId; onJump: (id: SectionId) => void }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10 lg:px-16">
       <motion.button
  whileTap={{ scale: 0.98 }}
  onClick={() => onJump("home")}
  className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 text-lg tracking-tight hover:opacity-90 transition-opacity duration-300"
  aria-label="Go to home"
>
  {"< SB . DEV >"}
</motion.button>


        <nav aria-label="Primary" className="relative hidden items-center gap-1 md:flex">
          {sections.map((s) => {
            const isActive = active === s.id
            return (
              <div key={s.id} className="relative">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onJump(s.id)}
                  className={`relative rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-highlight"
                      className="absolute inset-0 -z-10 rounded-md bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {s.label}
                </motion.button>
              </div>
            )
          })}
        </nav>

        <motion.a
          whileTap={{ scale: 0.98 }}
          href="#contact"
          onClick={(e) => {
            e.preventDefault()
            onJump("contact")
          }}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          Contact
        </motion.a>
      </div>
      <motion.div aria-hidden="true" className="h-0.5 bg-primary" style={{ scaleX, transformOrigin: "left" }} />
    </header>
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
      className="mx-auto grid max-w-6xl items-center gap-10 py-16 md:grid-cols-2 md:py-24 lg:py-28"
    >
      <div>
        <motion.div variants={fadeUp(28)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <span className="inline-block rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            Available for work
          </span>
        </motion.div>

        <h1 className="text-balance mt-4 text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
          <AnimatedText text="Hey, I’m Shahroz Butt —" className="block bg-clip-text text-transparent" />
          <motion.span
            className="block bg-clip-text text-transparent"
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
              className="block"
            />
          </motion.span>
        </h1>

        <motion.p
          variants={fadeUp(20, 0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-pretty mt-6 max-w-prose text-muted-foreground"
        >
          I care about clean UX, performance, and delivering production‑ready solutions. Let’s turn ideas into products
          that actually scale.
        </motion.p>

        <motion.div
          variants={staggerChildren(0.08, 0.2)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <motion.a
            ref={ctaMagnet as any}
            variants={fadeUp(16)}
            href="#projects"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow transition-shadow"
            whileHover={{ boxShadow: "0 0 36px 0 color-mix(in oklab, var(--color-primary) 35%, transparent)" }}
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
            className="rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground transition-shadow"
            whileHover={{ boxShadow: "0 0 28px 0 color-mix(in oklab, var(--color-foreground) 20%, transparent)" }}
          >
            Contact Me
          </motion.a>
        </motion.div>

        {/* skills marquee */}
        <div aria-hidden className="mt-8 overflow-hidden">
          <motion.div
            className="flex gap-4 whitespace-nowrap text-xs text-muted-foreground"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4">
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
                  <span key={t} className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        className="relative mx-auto aspect-square w-64 overflow-hidden rounded-xl border border-border bg-card md:w-80"
        initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease: cubicBezier(0.22, 1, 0.36, 1)
 }}
        style={{ y: imgY, scale: imgScale }}
      >
        <motion.img
          src="/IMG_8218.jpg"
          alt="Shahroz Butt portrait"
          className="h-full w-full object-cover"
          initial={false}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "tween", duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1)
 }}
        />
        <motion.div
          className="pointer-events-none absolute -left-3 top-4 rounded-md border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground shadow"
          initial={{ opacity: 0, y: -8, rotate: -6 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, type: "spring", stiffness: 250, damping: 18 }}
        >
          1+ yrs experience
        </motion.div>
        {/* glow ring */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          initial={{ boxShadow: "0 0 0px rgba(0,0,0,0)" }}
          whileHover={{ boxShadow: "0 0 64px rgba(28, 100, 242, 0.25)" }}
          transition={{ type: "tween", duration: 0.3 }}
        />
      </motion.div>
    </div>
  )
}

function About() {
  return (
    <div className="mx-auto max-w-4xl py-16 md:py-24">
      <MaskReveal>
        <motion.h2
          variants={fadeUp(20)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-semibold md:text-4xl"
        >
          <AnimatedText text="About Me" />
        </motion.h2>
      </MaskReveal>
      <motion.p
        variants={fadeUp(18, 0.05)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-6 text-muted-foreground"
      >
        I’m a BS Computer Science student and software developer passionate about modern web stacks and applied AI. My
        work ranges from building cloud‑native systems on AWS to prototyping NLP and speech‑to‑text pipelines for
        real‑time media monitoring. I enjoy turning research ideas into real‑world tools and delivering software that
        solves actual problems.
      </motion.p>

      <motion.div
        variants={staggerChildren(0.06, 0.2)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-8 grid gap-4 md:grid-cols-3"
      >
        <motion.div variants={fadeUp(16)} className="rounded-lg border border-border bg-card p-4">
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
        <motion.div variants={fadeUp(16, 0.05)} className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Focus</div>
          <div className="mt-2 text-sm text-foreground">
            Finishing my AI‑Powered News Monitoring FYP, improving deployment pipelines, and building production‑ready
            SaaS features for small businesses.
          </div>
        </motion.div>
        <motion.div variants={fadeUp(16, 0.1)} className="rounded-lg border border-border bg-card p-4">
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
              <span key={s} className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
                {s}
              </span>
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
    <div className="mx-auto max-w-4xl py-16 md:py-24">
      <motion.h2
        variants={fadeUp(20)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-3xl font-semibold md:text-4xl"
      >
        <AnimatedText text="Experience" />
      </motion.h2>

      <div ref={ref} className="relative mt-10 space-y-8">
        <motion.div
          aria-hidden
          className="absolute left-3 top-0 h-full w-[2px] origin-top rounded bg-primary/20 md:left-4"
          style={{ scaleY: spineScaleY }}
        />
        {items.map((item, idx) => (
          <motion.div
            key={item.role}
            className="relative rounded-lg border border-border bg-card p-6 pl-8 md:pl-10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ delay: idx * 0.06, duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1)
 }}
          >
            <motion.span
              className="absolute left-0 top-6 block h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-md"
              animate={{ boxShadow: ["0 0 0 0px var(--color-primary)", "0 0 0 10px transparent"] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeOut" }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-lg font-semibold">{item.role}</div>
                <div className="text-sm text-muted-foreground">{item.org}</div>
              </div>
              <div className="text-xs text-muted-foreground">{item.period}</div>
            </div>
            <ul className="mt-4 list-inside space-y-2">
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
    <div className="mx-auto max-w-6xl py-16 md:py-24">
      <motion.h2
        variants={fadeUp(20)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-3xl font-semibold md:text-4xl"
      >
        <AnimatedText text="Selected Projects" />
      </motion.h2>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, idx) => (
          <TiltCard key={p.title} className="will-change-transform">
            <motion.a
              href={p.link}
              target={p.link && p.link !== "#" ? "_blank" : undefined}
              rel={p.link && p.link !== "#" ? "noreferrer" : undefined}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ delay: idx * 0.06, duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1)
 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative overflow-hidden">
                <motion.img
                  src={p.image || "/placeholder.svg?height=200&width=320&query=project image"}
                  alt={`${p.title} preview`}
                  className="h-48 w-full object-cover md:h-40 lg:h-44"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "tween", duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1)
 }}
                />
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-black/0"
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.18)" }}
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
                    <span key={t} className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
                      {t}
                    </span>
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

  React.useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [inView, controls])

  return (
    <div className="mx-auto max-w-3xl py-16 md:py-24">
      <MaskReveal>
        <motion.h2
          variants={fadeUp(20)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-semibold md:text-4xl"
        >
          <AnimatedText text="Let’s Collaborate!" />
        </motion.h2>
      </MaskReveal>
      <motion.p
        variants={fadeUp(18, 0.05)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-6 text-muted-foreground"
      >
        Have a project in mind? I’m open to freelance opportunities and collaborations that involve AI, cloud apps, or
        frontend design.
      </motion.p>
      <motion.form
        ref={ref}
        variants={staggerChildren(0.06, 0.2)}
        initial="hidden"
        animate={controls}
        className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          const name = fd.get("name")
          const email = fd.get("email")
          const message = fd.get("message")
          console.log("[v0] Contact form submitted:", { name, email, message })
          alert("Thanks for reaching out! I will get back to you shortly.")
          e.currentTarget.reset()
        }}
      >
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Name</span>
          <motion.input
            variants={fadeUp(14)}
            name="name"
            required
            placeholder="Your name"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Email</span>
          <motion.input
            variants={fadeUp(14, 0.05)}
            type="email"
            required
            name="email"
            placeholder="Your email"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Message</span>
          <motion.textarea
            variants={fadeUp(14, 0.1)}
            name="message"
            required
            rows={5}
            placeholder="Tell me about your project..."
            className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <motion.button
          variants={fadeUp(14, 0.15)}
          whileTap={{ scale: 0.98 }}
          whileHover={{ boxShadow: "0 0 36px 0 color-mix(in oklab, var(--color-primary) 35%, transparent)" }}
          type="submit"
          className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
        >
          Send Message
        </motion.button>
        <div className="text-xs text-muted-foreground">Prefer email? bshahroz48@gmail.com</div>
      </motion.form>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row md:px-10 lg:px-16">
        <div className="order-2 md:order-1">© {new Date().getFullYear()} Shahroz Butt. All rights reserved.</div>
        <div className="order-1 flex items-center gap-4 md:order-2">
          <a href="https://pk.linkedin.com/in/muhammad-shahroz-butt-4aa093309" className="hover:text-foreground" aria-label="LinkedIn" target="_blank">
            LinkedIn
          </a>
          <a href="https://github.com/ShahrozButtOfficial" className="hover:text-foreground" aria-label="GitHub" target="_blank">
            GitHub
          </a>
          <a href="mailto:bshahroz48@gmail.com" className="hover:text-foreground" aria-label="Email" target="_blank">
            Email
          </a>
          <a href="https://www.instagram.com/shahroz_butt_official/" className="hover:text-foreground" aria-label="Instagram" target="_blank">
            Instagram
          </a>
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
        className="fixed bottom-6 right-6 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg"
        style={{ opacity: show, scale: show }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        ↑
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
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.8, ease: cubicBezier(0.22, 1, 0.36, 1)
 }}
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

export default function Page() {
  const { active, setActive } = useActiveSection(sections.map((s) => s.id as SectionId))

  const onJump = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    setActive(id)
  }

  return (
    <main className="min-h-dvh">
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

      {/* background spotlight */}
      <BackgroundFX />
      {/* sticky nav */}
      <Navbar active={active} onJump={onJump} />

      {/* Home */}
      <Section id="home" className="pt-10">
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
