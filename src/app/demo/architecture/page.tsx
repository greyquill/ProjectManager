import React from "react";

// Deployment Architecture Diagram Component
// Default export: ArchitectureDiagram
// TailwindCSS classes used for layout and styling.

interface CardProps {
  title: string;
  children: React.ReactNode;
}

interface GatewayBoxProps {
  title: string;
  children: React.ReactNode;
}

interface ServiceBoxProps {
  title: string;
  subtitle: string;
}

interface MicroServiceProps {
  name: string;
  highlight?: boolean;
}

interface ExternalBoxProps {
  title: string;
}

export default function ArchitectureDiagram() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Deployment Architecture — Microservices + Gateways + HL7 Engine</h1>
        <p className="text-sm text-slate-600 mb-6">A visual overview of components and runtime relationships for enterprise & clinic deployments.</p>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="grid grid-cols-12 gap-4 items-start">

            {/* Left column: Users & Clients */}
            <div className="col-span-3">
              <div className="space-y-4">
                <Card title="Users / Clients">
                  <ul className="text-sm space-y-2">
                    <li>Doctors / Clinicians</li>
                    <li>Reception / Admin</li>
                    <li>Patients (Portal / Mobile)</li>
                    <li>Billing / Finance</li>
                  </ul>
                </Card>

                <Card title="Frontends">
                  <ul className="text-sm space-y-2">
                    <li>Web Portal (React)</li>
                    <li>Mobile Apps (iOS / Android)</li>
                    <li>Clinic Desktop App</li>
                    <li>Telemedicine (WebRTC)</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* Middle column: Gateway & Security */}
            <div className="col-span-6">
              <div className="flex flex-col items-center">
                <GatewayBox title="Edge / API Layer">
                  <p className="text-xs text-slate-600">Load Balancer → API Gateway → Auth (OAuth2 / OIDC)</p>
                </GatewayBox>

                <div className="mt-6 w-full grid grid-cols-3 gap-4">
                  <ServiceBox title="API Gateway" subtitle="Ingress / Routing" />
                  <ServiceBox title="Auth & IAM" subtitle="OAuth2 / 2FA / RBAC" />
                  <ServiceBox title="WAF / Security" subtitle="DDoS, IP Whitelisting" />
                </div>

                <div className="mt-6 w-full border-t pt-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Microservices Cluster (Kubernetes)</h3>

                  <div className="grid grid-cols-3 gap-4">
                    <MicroService name="EMR / EHR Service" />
                    <MicroService name="Scheduling Service" />
                    <MicroService name="Billing / RCM Service" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <MicroService name="AI Scribe & NLP" highlight />
                    <MicroService name="Telemedicine Service" />
                    <MicroService name="Staff / HCM Service" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <MicroService name="Analytics / Reporting" />
                    <MicroService name="Document Store / DICOM Service" />
                    <MicroService name="Integration Adapter Service" />
                  </div>

                </div>
              </div>
            </div>

            {/* Right column: Integration, Data & External Systems */}
            <div className="col-span-3">
              <div className="space-y-4">
                <Card title="Interoperability & Integration">
                  <ul className="text-sm space-y-2">
                    <li><strong>HL7 Engine</strong> (Mirth Connect / Integration Bus)</li>
                    <li><strong>FHIR Server</strong> (HAPI FHIR, SMART on FHIR)</li>
                    <li>Message Broker (Kafka / RabbitMQ)</li>
                    <li>Integration Adapters (PACS, LIS, Payers)</li>
                  </ul>
                </Card>

                <Card title="Data & Storage">
                  <ul className="text-sm space-y-2">
                    <li>Operational DB (Postgres / CockroachDB)</li>
                    <li>Document Store (S3, Object Storage)</li>
                    <li>Data Warehouse (BigQuery / Snowflake)</li>
                    <li>Backups & DR / Snapshots</li>
                  </ul>
                </Card>

                <Card title="Observability & Ops">
                  <ul className="text-sm space-y-2">
                    <li>Monitoring (Prometheus + Grafana)</li>
                    <li>Logging (ELK / Loki)</li>
                    <li>Tracing (Jaeger)</li>
                    <li>Incidents & PagerDuty</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* Full width bottom: External Systems */}
            <div className="col-span-12 mt-6">
              <div className="bg-slate-50 border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">External Systems & Integrations</h4>
                <div className="grid grid-cols-4 gap-4">
                  <ExternalBox title="Hospital HIS / CIS" />
                  <ExternalBox title="Laboratory / LIS" />
                  <ExternalBox title="Imaging / PACS" />
                  <ExternalBox title="Payer / Insurance Portals" />
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4">
                  <ExternalBox title="Pharmacy / eRx" />
                  <ExternalBox title="Government Health Exchange" />
                  <ExternalBox title="Third-party Apps (White-label)" />
                  <ExternalBox title="Payment Gateways" />
                </div>

                <p className="mt-4 text-xs text-slate-600">Notes: HL7 v2 messages (ADT/ORM/ORU/SIU) flow through the HL7 Engine; FHIR resources are served from the FHIR Server and internal microservices expose consistent REST APIs. Message broker handles async events and analytics ingestion.</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

function Card({ title, children }: CardProps) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function GatewayBox({ title, children }: GatewayBoxProps) {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-50 to-white border rounded-2xl p-4 shadow-inner text-center">
      <h2 className="text-sm font-semibold text-indigo-700">{title}</h2>
      <div className="text-xs text-slate-600 mt-2">{children}</div>
      <div className="mt-3 flex justify-center gap-2">
        <div className="px-3 py-1 bg-indigo-100 rounded-full text-xs">Load Balancer</div>
        <div className="px-3 py-1 bg-indigo-100 rounded-full text-xs">API Gateway</div>
        <div className="px-3 py-1 bg-indigo-100 rounded-full text-xs">Auth</div>
      </div>
    </div>
  );
}

function ServiceBox({ title, subtitle }: ServiceBoxProps) {
  return (
    <div className="bg-white border rounded-lg p-3 text-center shadow-sm">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
    </div>
  );
}

function MicroService({ name, highlight }: MicroServiceProps) {
  return (
    <div className={`border rounded-lg p-3 h-24 flex flex-col justify-between ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
      <div className="text-sm font-medium">{name}</div>
      <div className="text-xs text-slate-500">K8s pod / Microservice</div>
    </div>
  );
}

function ExternalBox({ title }: ExternalBoxProps) {
  return (
    <div className="bg-white border rounded-lg p-3 text-center shadow-sm">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-slate-500 mt-1">(External System)</div>
    </div>
  );
}
