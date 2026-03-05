import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Shield,
  Zap,
  Brain,
  BarChart3,
  FileSearch,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Lock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const marqueeItems = [
  "Risk Assessment", "Financial Analysis", "Document Parsing", "Credit Scoring",
  "Loan Decisioning", "Compliance Checks", "Portfolio Monitoring", "Audit Trails",
  "GST Verification", "Bank Statement Analysis", "Legal Case Tracking", "Real-time Alerts",
];

function Marquee({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex shrink-0 gap-4"
        animate={{ x: reverse ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...marqueeItems, ...marqueeItems].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground whitespace-nowrap shadow-card"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Leverage advanced AI models to analyze financials, assess risk, and generate comprehensive credit memos automatically.",
  },
  {
    icon: FileSearch,
    title: "Smart Document Parsing",
    description: "Upload annual reports, GST data, and bank statements — our engine extracts and structures key financial metrics instantly.",
  },
  {
    icon: Shield,
    title: "Risk Scoring Engine",
    description: "Multi-factor risk scoring with weighted components: financial strength, compliance health, litigation exposure, and qualitative adjustments.",
  },
  {
    icon: BarChart3,
    title: "Financial Intelligence",
    description: "Automated ratio analysis, trend detection, and peer benchmarking across DSCR, debt-to-equity, EBITDA margins, and more.",
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description: "Streamlined evaluation workflows with role-based access, approval chains, and real-time notifications at every stage.",
  },
  {
    icon: Lock,
    title: "Audit & Compliance",
    description: "Complete audit trails, comment threads, and version history for every evaluation — ensuring full regulatory compliance.",
  },
];

const stats = [
  { value: "10x", label: "Faster Decisions" },
  { value: "99.2%", label: "Accuracy Rate" },
  { value: "50K+", label: "Evaluations Processed" },
  { value: "200+", label: "Financial Institutions" },
];

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-background" />
            </div>
            <span className="text-lg font-semibold tracking-tight">IntelliCredit</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Results</a>
            <a href="#cta" className="hover:text-foreground transition-colors">Get Started</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-1.5">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-32 pb-20 md:pt-44 md:pb-32"
      >
        <div className="mx-auto max-w-7xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-card"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            AI-Powered Credit Decisioning Platform
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.9] mb-2"
            >
              Smarter Credit
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.9] text-muted-foreground"
            >
              Decisions, Faster.
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          >
            Transform your credit evaluation workflow with AI that analyzes financials,
            scores risk, and generates recommendations — reducing decision time from weeks to hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8 h-12">
                Start Evaluating <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                See How It Works
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_40%,transparent_100%)]" />
        </div>
      </motion.section>

      {/* Marquee */}
      <section className="py-12 space-y-4">
        <Marquee />
        <Marquee reverse />
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 md:py-28">
        <AnimatedSection className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
                <div className="text-4xl md:text-5xl font-semibold tracking-tight">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-card/50">
        <AnimatedSection className="mx-auto max-w-7xl px-6">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Everything you need for
              <br />
              <span className="text-muted-foreground">credit intelligence</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A complete platform that automates the most complex parts of credit evaluation
              while keeping humans in control of final decisions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i + 1}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28">
        <AnimatedSection className="mx-auto max-w-7xl px-6">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Three steps to
              <br />
              <span className="text-muted-foreground">better decisions</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Documents",
                desc: "Drop annual reports, GST filings, bank statements, and legal notices. Our AI parses and extracts key data points.",
              },
              {
                step: "02",
                title: "AI Analysis",
                desc: "Automated financial ratio analysis, risk scoring, compliance checks, and peer benchmarking run in parallel.",
              },
              {
                step: "03",
                title: "Get Recommendations",
                desc: "Receive a comprehensive credit memo with risk scores, loan recommendations, and actionable insights.",
              },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="relative">
                <div className="text-6xl font-semibold text-muted/50 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-muted-foreground">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* CTA */}
      <section id="cta" className="py-20 md:py-28">
        <AnimatedSection className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="rounded-2xl border border-border bg-card p-12 md:p-16 shadow-elevated"
          >
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Ready to transform your
              <br />
              credit workflow?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join hundreds of financial institutions already using IntelliCredit
              to make faster, more accurate lending decisions.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-10 h-12">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-background" />
            </div>
            <span className="text-sm font-medium">IntelliCredit</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>© 2026 IntelliCredit. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Trusted by 200+ institutions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
