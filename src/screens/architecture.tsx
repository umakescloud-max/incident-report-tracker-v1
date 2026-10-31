import {
  AppShell,
  ArchitectureView,
  IntegrationTiles,
  type ArchEdge,
  type ArchNode,
} from "@kit";
import { NAV } from "../nav";

const NODES: ArchNode[] = [
  { id: "aline", label: "Aline Care (clinical record)", kind: "system" },
  { id: "power-automate", label: "Power Automate flows", kind: "system" },
  { id: "dataverse", label: "Dataverse and SharePoint", kind: "system" },
  { id: "tracker-ui", label: "Incident tracker (this prototype)", kind: "app" },
  { id: "openai", label: "Azure OpenAI (report drafting)", kind: "model" },
  { id: "teams", label: "Microsoft Teams approvals", kind: "system" },
  { id: "staff", label: "Marisol (compliance coordinator)", kind: "human" },
  { id: "portal", label: "State regulator portal", kind: "system" },
];

const EDGES: ArchEdge[] = [
  { from: "aline", to: "power-automate", label: "Incident and resident data" },
  { from: "power-automate", to: "dataverse", label: "Stores reports and deadlines" },
  { from: "dataverse", to: "tracker-ui", label: "Report status and countdowns" },
  { from: "tracker-ui", to: "openai", label: "Drafts narrative, finds missing details" },
  { from: "tracker-ui", to: "teams", label: "Requests approval" },
  { from: "teams", to: "staff", label: "Surfaces flagged reports for review" },
  { from: "staff", to: "portal", label: "Approves filing, human-approved" },
];

const COMPLIANCE_NOTES = [
  "Resident data would be stored encrypted at rest and in transit inside the group's own Microsoft tenant",
  "Every filing to the state requires explicit staff approval before sending",
  "Access would be role-restricted to authorized compliance staff, with full audit logging",
  "Any AI-assisted drafting operates under a signed BAA; no PHI is sent to a model without one",
  "Only the minimum necessary resident data is shared with each connected system",
  "Portal logins and multi-factor steps would be handled by a named staff member, not stored in the flow",
];

const NAMED_TOOLS = [
  "Aline Care",
  "Microsoft Teams",
  "Power Automate",
  "Azure OpenAI",
  "SharePoint",
  "Dataverse",
];

export default function Architecture() {
  return (
    <AppShell
      brandName="Umakes.cloud"
      brandUrl="https://umakes.cloud"
      brandEmail="umakescloud@gmail.com"
      personaName="Marisol Tran"
      personaRole="Regional compliance coordinator"
      nav={NAV}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            How this would work
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--pf-muted)]">
            The prototype you just used stands in for a flow that would run inside Willowbend&apos;s
            own Microsoft tenant. Incident data arrives from the clinical record, a flow stores the
            report and its deadline, a draft is prepared for review, and a staff member approves
            every filing to the state.
          </p>
        </header>

        <ArchitectureView nodes={NODES} edges={EDGES} complianceNotes={COMPLIANCE_NOTES} />

        <IntegrationTiles
          tools={NAMED_TOOLS}
          title="Connected tools, named as plain text"
        />
      </div>
    </AppShell>
  );
}
