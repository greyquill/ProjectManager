'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { ChevronRight, ChevronDown, BookOpen, Menu, X } from 'lucide-react'

interface DocSection {
  id: string
  title: string
  children?: DocSection[]
}

const docStructure: DocSection[] = [
  {
    id: 'implementation-deployment',
    title: 'IMPLEMENTATION & DEPLOYMENT',
    children: [
      { id: 'onboarding-process', title: '16. Onboarding Process' },
      { id: 'pricing-model', title: '17. Pricing Model' },
    ],
  },
  {
    id: 'technical-architecture-overview',
    title: 'TECHNICAL ARCHITECTURE OVERVIEW',
    children: [
      { id: 'system-architecture', title: '18. System Architecture' },
      { id: 'deployment-options', title: '19. Deployment Options' },
    ],
  },
  {
    id: 'regulatory-compliance',
    title: 'REGULATORY & COMPLIANCE CONSIDERATIONS',
    children: [
      { id: 'healthcare-regulations', title: '20. Healthcare Regulations' },
      { id: 'international-standards', title: '21. International Standards' },
    ],
  },
  {
    id: 'success-metrics-kpis',
    title: 'SUCCESS METRICS & KPIs',
    children: [
      { id: 'business-metrics', title: '22. Business Metrics' },
    ],
  },
  {
    id: 'competitive-analysis',
    title: 'COMPETITIVE ANALYSIS',
    children: [
      { id: 'market-positioning', title: '23. Market Positioning' },
    ],
  },
  {
    id: 'risk-assessment-mitigation',
    title: 'RISK ASSESSMENT & MITIGATION',
    children: [
      { id: 'technical-risks', title: '24. Technical Risks' },
      { id: 'business-risks', title: '25. Business Risks' },
    ],
  },
  {
    id: 'roadmap-future-enhancements',
    title: 'ROADMAP & FUTURE ENHANCEMENTS',
    children: [
      { id: 'product-roadmap', title: '26. Product Roadmap (Next 12-24 Months)' },
      { id: 'emerging-technologies', title: '27. Emerging Technologies' },
    ],
  },
  {
    id: 'conclusion-next-steps',
    title: 'CONCLUSION & NEXT STEPS',
    children: [
      { id: 'summary', title: '28. Summary' },
    ],
  },
]

export default function BusinessDocsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['implementation-deployment'])
  )
  const [activeSection, setActiveSection] = useState('onboarding-process')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [headings, setHeadings] = useState<Array<{ id: string; title: string; level: number }>>([])

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSections(newExpanded)
  }

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -80 // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  // Extract headings from content for TOC
  useEffect(() => {
    const extractedHeadings: Array<{ id: string; title: string; level: number }> = []
    const contentElement = document.getElementById('doc-content')
    if (contentElement) {
      const h2Elements = contentElement.querySelectorAll('h2')
      h2Elements.forEach((h2) => {
        if (h2.id) {
          extractedHeadings.push({ id: h2.id, title: h2.textContent || '', level: 2 })
        }
      })
      const h3Elements = contentElement.querySelectorAll('h3')
      h3Elements.forEach((h3) => {
        if (h3.id) {
          extractedHeadings.push({ id: h3.id, title: h3.textContent || '', level: 3 })
        }
      })
    }
    setHeadings(extractedHeadings)
  }, [activeSection])

  // Intersection observer for active section highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -80% 0px' }
    )

    const sections = document.querySelectorAll('section[id]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const renderSidebarItem = (item: DocSection, level: number = 0) => {
    const isExpanded = expandedSections.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    const isActive = activeSection === item.id

    return (
      <div key={item.id} className={level > 0 ? 'ml-4' : ''}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id)
            }
            if (!hasChildren) {
              scrollToSection(item.id)
            }
          }}
          className={`w-full flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )
          ) : (
            <span className="w-4" />
          )}
          <span className="flex-1 text-left">{item.title}</span>
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children?.map((child) => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Business Documentation</h2>
              </div>
              <nav>{docStructure.map((item) => renderSidebarItem(item))}</nav>
            </div>
          </aside>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden fixed bottom-6 right-6 z-50 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Mobile Sidebar */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
              <aside
                className="absolute left-0 top-0 h-full w-80 bg-background p-6 overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-text-primary">Documentation</h2>
                </div>
                <nav>{docStructure.map((item) => renderSidebarItem(item))}</nav>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            <div id="doc-content" className="prose prose-slate max-w-none prose-sm text-sm">
              <section id="introduction">
                <h1 className="text-2xl font-bold text-text-primary mb-4">Umami Healthcare Platform</h1>
                <p className="text-sm text-text-secondary mb-6">
                  Overall platform for hospital, patient, and workflow management.
                </p>
              </section>

              {/* IMPLEMENTATION & DEPLOYMENT */}
              <section id="implementation-deployment">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  IMPLEMENTATION & DEPLOYMENT
                </h2>

                <section id="onboarding-process">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">16. Onboarding Process</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Phase 1: Discovery & Planning (Week 1)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Kickoff meeting with stakeholders</li>
                    <li>Current workflow documentation</li>
                    <li>Pain point identification</li>
                    <li>Success criteria definition</li>
                    <li>Project timeline finalization</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Phase 2: Data Migration (Week 1-2)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Paper chart digitization (if applicable)</li>
                    <li>Legacy system data extraction</li>
                    <li>Data cleansing and validation</li>
                    <li>Test migration to staging environment</li>
                    <li>Data integrity verification</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Phase 3: Configuration (Week 2-3)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Provider schedule templates</li>
                    <li>Appointment types and durations</li>
                    <li>Fee schedules and payer contracts</li>
                    <li>User roles and permissions</li>
                    <li>Workflow customization</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Phase 4: Integration (Week 3)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Clearinghouse API configuration</li>
                    <li>Laboratory interface setup (Quest, LabCorp)</li>
                    <li>Pharmacy network connection (Surescripts)</li>
                    <li>Payment gateway integration</li>
                    <li>External EMR/EHR connections (if needed)</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Phase 5: Training (Week 3-4)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Super user training (2 days)</li>
                    <li>Clinical staff training (1 day)</li>
                    <li>Front desk training (4 hours)</li>
                    <li>Physician training (4 hours)</li>
                    <li>Training materials and videos</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Phase 6: Go-Live (Week 4)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Parallel operation (optional - 3 days)</li>
                    <li>Full cutover to new system</li>
                    <li>On-site support for first week</li>
                    <li>Go-live support checklist</li>
                    <li>Issue escalation process</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Phase 7: Post-Implementation (Week 5-8)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Daily check-ins (first week)</li>
                    <li>Weekly optimization sessions</li>
                    <li>Performance metrics review</li>
                    <li>User feedback collection</li>
                    <li>Continuous improvement planning</li>
                  </ul>
                </section>

                <section id="pricing-model">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">17. Pricing Model</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Subscription Tiers</h4>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>Essential Plan: $199/provider/month</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Core EMR functionality</li>
                    <li>Smart appointments</li>
                    <li>Basic billing</li>
                    <li>24/7 support</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>Professional Plan: $299/provider/month</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Everything in Essential</li>
                    <li>AI Ambient Scribe</li>
                    <li>Advanced analytics</li>
                    <li>Custom branded portal</li>
                    <li>Priority support</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>Enterprise Plan: Custom Pricing</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Everything in Professional</li>
                    <li>White-label mobile apps</li>
                    <li>Dedicated success manager</li>
                    <li>Custom integrations</li>
                    <li>SLA guarantees</li>
                    <li>Multi-location support</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Implementation Fees</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Standard Setup: $2,500 (1-5 providers)</li>
                    <li>Enterprise Setup: $5,000+ (6+ providers)</li>
                    <li>Data Migration: $500-$5,000 (based on volume)</li>
                    <li>Custom Integration: $150/hour</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Month-to-Month Commitment</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>No long-term contracts required</li>
                    <li>Cancel anytime with 30-day notice</li>
                    <li>No hidden fees or cancellation charges</li>
                  </ul>
                </section>
              </section>

              {/* TECHNICAL ARCHITECTURE OVERVIEW */}
              <section id="technical-architecture-overview">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  TECHNICAL ARCHITECTURE OVERVIEW
                </h2>

                <section id="system-architecture">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">18. System Architecture</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Frontend Layer</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>Web Application:</strong> React.js with TypeScript</li>
                    <li><strong>Mobile Apps:</strong> React Native (iOS/Android)</li>
                    <li><strong>UI Component Library:</strong> Tailwind CSS, shadcn/ui</li>
                    <li><strong>State Management:</strong> Redux Toolkit, React Query</li>
                    <li><strong>Real-time Updates:</strong> WebSocket, Server-Sent Events</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Backend Layer</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>API Gateway:</strong> Kong or AWS API Gateway</li>
                    <li><strong>Microservices:</strong> Node.js/Express, Python/FastAPI</li>
                    <li><strong>Service Mesh:</strong> Istio (for enterprise deployments)</li>
                    <li><strong>Message Queue:</strong> RabbitMQ, AWS SQS</li>
                    <li><strong>Cache Layer:</strong> Redis, Memcached</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Data Layer</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>Primary Database:</strong> PostgreSQL 15+ (multi-tenant)</li>
                    <li><strong>Document Store:</strong> MongoDB (for unstructured data)</li>
                    <li><strong>Search Engine:</strong> Elasticsearch</li>
                    <li><strong>Data Warehouse:</strong> Snowflake or BigQuery (for analytics)</li>
                    <li><strong>Object Storage:</strong> AWS S3, Azure Blob Storage</li>
                    <li><strong>Time-Series DB:</strong> InfluxDB (for vitals tracking)</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">AI/ML Layer</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>LLM Service:</strong> GPT-4 based medical model (Azure OpenAI)</li>
                    <li><strong>Speech Recognition:</strong> Deepgram, AssemblyAI</li>
                    <li><strong>NLP Pipeline:</strong> spaCy, Hugging Face Transformers</li>
                    <li><strong>Model Training:</strong> TensorFlow, PyTorch</li>
                    <li><strong>Feature Store:</strong> Feast</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Infrastructure Layer</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>Cloud Platform:</strong> AWS, Azure, or GCP</li>
                    <li><strong>Container Orchestration:</strong> Kubernetes (EKS, AKS, GKE)</li>
                    <li><strong>CI/CD:</strong> GitLab CI, GitHub Actions, ArgoCD</li>
                    <li><strong>Monitoring:</strong> Datadog, New Relic, Prometheus + Grafana</li>
                    <li><strong>Logging:</strong> ELK Stack (Elasticsearch, Logstash, Kibana)</li>
                    <li><strong>Security:</strong> Vault (secrets management), Snyk (vulnerability scanning)</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Integration Layer</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>HL7 Engine:</strong> Mirth Connect</li>
                    <li><strong>FHIR Server:</strong> HAPI FHIR</li>
                    <li><strong>API Management:</strong> Kong, Apigee</li>
                    <li><strong>ETL Pipeline:</strong> Apache Airflow, dbt</li>
                    <li><strong>Event Streaming:</strong> Apache Kafka</li>
                  </ul>
                </section>

                <section id="deployment-options">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">19. Deployment Options</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Cloud-Hosted (SaaS)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Fully managed by Umami TLabs</li>
                    <li>Multi-tenant architecture</li>
                    <li>Automatic updates and patches</li>
                    <li>Lowest total cost of ownership</li>
                    <li><strong>Recommended for:</strong> Small to mid-sized practices</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Private Cloud (Dedicated)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Dedicated infrastructure per organization</li>
                    <li>Single-tenant deployment</li>
                    <li>Custom compliance requirements</li>
                    <li>Enhanced data isolation</li>
                    <li><strong>Recommended for:</strong> Large hospitals, enterprises</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">On-Premises (Hybrid)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Data center hosted</li>
                    <li>Full control over infrastructure</li>
                    <li>Higher upfront costs</li>
                    <li>Client manages hardware/OS</li>
                    <li>Umami manages application</li>
                    <li><strong>Recommended for:</strong> Organizations with strict data residency requirements</li>
                  </ul>
                </section>
              </section>

              {/* REGULATORY & COMPLIANCE CONSIDERATIONS */}
              <section id="regulatory-compliance">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  REGULATORY & COMPLIANCE CONSIDERATIONS
                </h2>

                <section id="healthcare-regulations">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">20. Healthcare Regulations</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">HIPAA (Health Insurance Portability and Accountability Act)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Administrative safeguards: workforce security, access management</li>
                    <li>Physical safeguards: facility access, workstation security</li>
                    <li>Technical safeguards: encryption, audit controls, integrity controls</li>
                    <li>Breach notification procedures (&lt; 60 days)</li>
                    <li>Business Associate Agreements (BAA) with all vendors</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">HITECH Act</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Meaningful Use certification (ONC 2015 Edition)</li>
                    <li>Patient access to PHI within 30 days</li>
                    <li>Accounting of disclosures</li>
                    <li>Enhanced breach notification penalties</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">21st Century Cures Act</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Information blocking prevention</li>
                    <li>API access for patients (FHIR)</li>
                    <li>Price transparency requirements</li>
                    <li>Data portability mandates</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">State-Specific Regulations</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>CCPA/CPRA (California privacy laws)</li>
                    <li>SHIELD Act (New York cybersecurity)</li>
                    <li>Texas Medical Privacy Act</li>
                    <li>State-specific telehealth regulations</li>
                  </ul>
                </section>

                <section id="international-standards">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">21. International Standards</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">GDPR (General Data Protection Regulation)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Applicable for EU patients</li>
                    <li>Right to access, rectify, erase data</li>
                    <li>Data processing agreements</li>
                    <li>Privacy by design principles</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">ISO 27001 (Information Security)</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Information security management system (ISMS)</li>
                    <li>Risk assessment and treatment</li>
                    <li>Continuous improvement process</li>
                  </ul>
                </section>
              </section>

              {/* SUCCESS METRICS & KPIs */}
              <section id="success-metrics-kpis">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  SUCCESS METRICS & KPIs
                </h2>

                <section id="business-metrics">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">22. Business Metrics</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Financial KPIs</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>Days Sales Outstanding (DSO):</strong> Target &lt; 25 days</li>
                    <li><strong>Claims Acceptance Rate:</strong> Target &gt; 95%</li>
                    <li><strong>Collection Rate:</strong> Target &gt; 90%</li>
                    <li><strong>Revenue Per Provider:</strong> Benchmark tracking</li>
                    <li><strong>Cost Per Encounter:</strong> Operational efficiency</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Operational KPIs</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>No-Show Rate:</strong> Target &lt; 5%</li>
                    <li><strong>Appointment Utilization:</strong> Target &gt; 85%</li>
                    <li><strong>Average Wait Time:</strong> Target &lt; 15 minutes</li>
                    <li><strong>Patient Satisfaction (NPS):</strong> Target &gt; 70</li>
                    <li><strong>Provider Productivity (RVU/day):</strong> Benchmark tracking</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Clinical Quality KPIs</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>Diabetes Control (A1C &lt;7%):</strong> Target &gt; 60%</li>
                    <li><strong>Hypertension Control:</strong> Target &gt; 65%</li>
                    <li><strong>Preventive Care Completion:</strong> Target &gt; 80%</li>
                    <li><strong>Medication Adherence:</strong> Target &gt; 75%</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Technology KPIs</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>System Uptime:</strong> Target 99.95%</li>
                    <li><strong>Average Response Time:</strong> Target &lt; 2 seconds</li>
                    <li><strong>Support Ticket Resolution:</strong> Target &lt; 4 hours</li>
                    <li><strong>User Adoption Rate:</strong> Target &gt; 90% within 30 days</li>
                  </ul>
                </section>
              </section>

              {/* COMPETITIVE ANALYSIS */}
              <section id="competitive-analysis">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  COMPETITIVE ANALYSIS
                </h2>

                <section id="market-positioning">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">23. Market Positioning</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Direct Competitors</h4>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>1. Epic Systems</strong> (Enterprise EMR)
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Strength: Comprehensive, hospital-focused</li>
                    <li>Weakness: Expensive, long implementation, poor usability</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>2. Cerner (Oracle Health)</strong> (Enterprise EMR)
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Strength: Large market share, established</li>
                    <li>Weakness: Legacy technology, complex pricing</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>3. athenahealth</strong> (Cloud-based Practice Management)
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Strength: Cloud-native, revenue cycle focus</li>
                    <li>Weakness: Limited AI capabilities, no ambient scribe</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>4. eClinicalWorks</strong> (Ambulatory EMR)
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Strength: Affordable, ambulatory-focused</li>
                    <li>Weakness: Usability issues, compliance history</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>5. NextGen Healthcare</strong> (Practice Management + EMR)
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Strength: Specialty-specific templates</li>
                    <li>Weakness: Dated UI, limited innovation</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Umami TLabs Competitive Advantages</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>AI-First Approach:</strong> Ambient scribe, predictive analytics (vs competitors&apos; bolt-on AI)</li>
                    <li><strong>WhatsApp Integration:</strong> Native patient engagement (unique to emerging markets)</li>
                    <li><strong>Pricing Transparency:</strong> Month-to-month, no long-term contracts</li>
                    <li><strong>Rapid Deployment:</strong> 4-week vs 6-12 month implementations</li>
                    <li><strong>Modern UX:</strong> Consumer-grade interface vs legacy systems</li>
                    <li><strong>Unified Platform:</strong> Single vendor for all modules vs point solutions</li>
                  </ul>
                </section>
              </section>

              {/* RISK ASSESSMENT & MITIGATION */}
              <section id="risk-assessment-mitigation">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  RISK ASSESSMENT & MITIGATION
                </h2>

                <section id="technical-risks">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">24. Technical Risks</h3>

                  <div className="bg-surface border border-border-light rounded-lg p-4 mb-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border-light">
                          <th className="text-left py-2 pr-4">Risk</th>
                          <th className="text-left py-2 pr-4">Impact</th>
                          <th className="text-left py-2 pr-4">Likelihood</th>
                          <th className="text-left py-2">Mitigation Strategy</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border-light">
                          <td className="py-2 pr-4">AI hallucinations in clinical documentation</td>
                          <td className="py-2 pr-4">High</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2">Human-in-the-loop review, confidence scoring, regular model retraining</td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="py-2 pr-4">HL7 integration failures</td>
                          <td className="py-2 pr-4">High</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2">Extensive testing with major EMRs, fallback to manual entry</td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="py-2 pr-4">Data breach</td>
                          <td className="py-2 pr-4">Critical</td>
                          <td className="py-2 pr-4">Low</td>
                          <td className="py-2">SOC 2, penetration testing, encryption, incident response plan</td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="py-2 pr-4">Performance degradation at scale</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2">Load testing, auto-scaling, database optimization</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4">Third-party API downtime</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2 pr-4">Low</td>
                          <td className="py-2">Circuit breakers, retry logic, cached data availability</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section id="business-risks">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">25. Business Risks</h3>

                  <div className="bg-surface border border-border-light rounded-lg p-4 mb-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border-light">
                          <th className="text-left py-2 pr-4">Risk</th>
                          <th className="text-left py-2 pr-4">Impact</th>
                          <th className="text-left py-2 pr-4">Likelihood</th>
                          <th className="text-left py-2">Mitigation Strategy</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border-light">
                          <td className="py-2 pr-4">Slow user adoption</td>
                          <td className="py-2 pr-4">High</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2">Comprehensive training, change management, super user program</td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="py-2 pr-4">Regulatory non-compliance</td>
                          <td className="py-2 pr-4">Critical</td>
                          <td className="py-2 pr-4">Low</td>
                          <td className="py-2">Regular compliance audits, legal review, certification maintenance</td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="py-2 pr-4">Competitive pressure (price wars)</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2 pr-4">High</td>
                          <td className="py-2">Value differentiation, premium features, customer retention focus</td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="py-2 pr-4">Customer churn</td>
                          <td className="py-2 pr-4">High</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2">Proactive support, product improvements, customer success team</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4">Vendor dependencies</td>
                          <td className="py-2 pr-4">Medium</td>
                          <td className="py-2 pr-4">Low</td>
                          <td className="py-2">Multi-vendor strategy, open standards, exit planning</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>

              {/* ROADMAP & FUTURE ENHANCEMENTS */}
              <section id="roadmap-future-enhancements">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  ROADMAP & FUTURE ENHANCEMENTS
                </h2>

                <section id="product-roadmap">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">26. Product Roadmap (Next 12-24 Months)</h3>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Q1 2025</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Generative AI for patient education materials</li>
                    <li>Enhanced predictive analytics (readmission risk, chronic disease progression)</li>
                    <li>Multi-language support (Spanish, Hindi, Mandarin)</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Q2 2025</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Remote patient monitoring (RPM) integration</li>
                    <li>Chronic care management (CCM) billing automation</li>
                    <li>Advanced population health management</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Q3 2025</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Clinical trial matching and recruitment</li>
                    <li>Genomics data integration</li>
                    <li>Social determinants of health (SDOH) screening</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Q4 2025</h4>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li>Value-based care analytics</li>
                    <li>Care coordination platform (referral management)</li>
                    <li>Patient-reported outcomes (PROs) tracking</li>
                  </ul>
                </section>

                <section id="emerging-technologies">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">27. Emerging Technologies</h3>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                    <li><strong>Blockchain:</strong> Immutable audit trails, health information exchange</li>
                    <li><strong>IoT Devices:</strong> Continuous monitoring (wearables, home devices)</li>
                    <li><strong>Augmented Reality:</strong> Surgical planning, medical education</li>
                    <li><strong>Quantum Computing:</strong> Drug discovery, genomic analysis (long-term)</li>
                  </ul>
                </section>
              </section>

              {/* CONCLUSION & NEXT STEPS */}
              <section id="conclusion-next-steps">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  CONCLUSION & NEXT STEPS
                </h2>

                <section id="summary">
                  <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">28. Summary</h3>

                  <p className="text-xs text-text-secondary mb-3">
                    Umami TLabs represents a comprehensive, modern healthcare management platform that addresses the full operational spectrum of healthcare providers. By leveraging AI/ML, cloud-native architecture, and patient-centric design, the platform delivers measurable improvements in financial performance, operational efficiency, and clinical quality.
                  </p>

                  <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Key Highlights</h4>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>6 Core Modules:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>RCM, Scheduling, AI Documentation, EMR, Custom Apps, Staff Management</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>AI-Powered:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Ambient clinical scribe, predictive analytics, intelligent automation</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>Compliance-Ready:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>HIPAA, HITECH, SOC 2, ONC certified</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>Rapid ROI:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>35% reduction in denials, 70% reduction in documentation time, 4% no-show rate</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>Modern Architecture:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Cloud-native, microservices, sub-second performance</li>
                  </ul>

                  <p className="text-xs text-text-secondary mb-2">
                    <strong>Flexible Pricing:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3 ml-4">
                    <li>Month-to-month, scalable from solo practitioners to large hospitals</li>
                  </ul>
                </section>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

