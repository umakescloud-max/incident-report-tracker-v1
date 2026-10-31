import { useState } from "react";
import {
  AppShell,
  ApprovalQueue,
  AuditLog,
  DocumentViewer,
  StatusPill,
  formatDateTime,
  useActivity,
  type ApprovalItem,
} from "@kit";
import { NAV } from "../nav";
import {
  EDGE_CASE_ID,
  EDGE_CASE_LABEL,
  caseProgress,
  edgeCaseReport,
} from "../seed";

export default function Appeals() {
  const { logAction } = useActivity();
  const [filed, setFiled] = useState(() => caseProgress.filed.get(EDGE_CASE_ID) ?? null);
  const [returned, setReturned] = useState(() => caseProgress.returned.has(EDGE_CASE_ID));

  const detail = caseProgress.detailAdded.get(EDGE_CASE_ID);
  const moved = caseProgress.movedToQueue.has(EDGE_CASE_ID);

  const subtitle = returned
    ? `Returned for more information. The state form still needs the ${EDGE_CASE_LABEL}.`
    : moved
      ? `Moved to the filing queue by Marisol Tran. ${
          detail
            ? `Physician notification time recorded: ${detail}.`
            : `The report is still held for ${EDGE_CASE_LABEL}.`
        }`
      : detail
        ? `Physician notification time recorded: ${detail}. Ready for review.`
        : `Draft pre-filled from the care record. The state form flagged it for ${EDGE_CASE_LABEL}.`;

  const item: ApprovalItem = {
    id: EDGE_CASE_ID,
    title: `Incident ${EDGE_CASE_ID}, ${edgeCaseReport.residentName} at ${edgeCaseReport.community}`,
    subtitle,
    edgeCase: true,
  };

  function approve() {
    const filedAt = new Date();
    const confirmationNumber = `ST-${EDGE_CASE_ID}-${filedAt
      .getTime()
      .toString(36)
      .toUpperCase()
      .slice(-6)}`;
    const record = { confirmationNumber, filedAt };
    caseProgress.filed.set(EDGE_CASE_ID, record);
    setFiled(record);
    logAction("Approved the report and filed it with the state");
  }

  function returnForInfo() {
    caseProgress.returned.add(EDGE_CASE_ID);
    setReturned(true);
    logAction("Returned the report for more information");
  }

  const draftLines = [
    `Resident: ${edgeCaseReport.residentName}, ${edgeCaseReport.community}, ${edgeCaseReport.room}.`,
    `Incident: ${edgeCaseReport.incidentType}, recorded ${formatDateTime(edgeCaseReport.incidentTime)}.`,
    "Narrative: the resident was found on the bathroom floor by the night nurse and helped back to bed. A hip injury was suspected and the resident was transferred to the hospital for imaging.",
    detail
      ? `Physician notification: ${detail}.`
      : "Physician notification: no time recorded in the care record. The state form rejected the draft for this gap.",
    "Family notification: the daughter was reached by phone the same night and asked for a call after the physician review.",
    `Filing deadline: ${formatDateTime(edgeCaseReport.filingDeadline)}.`,
    "Prepared from the care record for review by Marisol Tran.",
  ];

  return (
    <AppShell
      brandName="Umakes.cloud"
      brandUrl="https://umakes.cloud"
      brandEmail="umakescloud@gmail.com"
      personaName="Marisol Tran"
      personaRole="Regional compliance coordinator"
      nav={NAV}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Filing queue
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--pf-muted)]">
            Reports waiting for your review before they go to the state. Nothing is sent without
            your explicit approval.
          </p>
        </header>

        {returned && !filed && (
          <div className="rounded-lg bg-[var(--pf-accent)] px-4 py-3 text-[var(--pf-ink)]">
            <p className="text-sm font-medium">Returned to Exceptions</p>
            <p className="mt-1 text-sm">
              The report needs the {EDGE_CASE_LABEL} before it can be filed. It has not been sent
              to the state.
            </p>
          </div>
        )}

        {filed ? (
          <section className="rounded-xl border border-[var(--pf-primary)]/30 bg-[var(--pf-primary)]/5 p-5">
            <StatusPill label="Filed" tone="primary" />
            <h2 className="mt-3 text-lg font-medium">
              Incident {EDGE_CASE_ID} was filed with the state
            </h2>
            <p className="mt-2 text-sm">
              Confirmation number {filed.confirmationNumber}. Filed{" "}
              {formatDateTime(filed.filedAt)} by Marisol Tran.
            </p>
            <p className="mt-2 text-sm text-[var(--pf-muted)]">
              The state portal accepted the report. Your approval and the filing time are recorded
              in the audit log below.
            </p>
          </section>
        ) : (
          <section aria-label="Reports awaiting approval">
            <ApprovalQueue
              items={[item]}
              primaryLabel="Approve and file"
              secondaryLabel="Return for more info"
              onPrimary={approve}
              onSecondary={returnForInfo}
              dataTour="approval-queue"
            />
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Drafted narrative and completed fields</h2>
          <p className="text-sm text-[var(--pf-muted)]">
            Read the draft before you approve it. If something is wrong, return it to Exceptions
            with a note.
          </p>
          <DocumentViewer title="Report draft for incident 3318" lines={draftLines} />
        </section>

        <section className="rounded-xl border border-[var(--pf-muted)]/15 p-4">
          <h2 className="text-sm font-medium">Audit log</h2>
          <div className="mt-3">
            <AuditLog />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
