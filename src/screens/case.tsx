import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AppShell,
  AuditLog,
  DocumentViewer,
  StatusPill,
  Timeline,
  formatDateTime,
  useActivity,
  type TimelineEntry,
} from "@kit";
import { NAV } from "../nav";
import {
  EDGE_CASE_ID,
  caseProgress,
  edgeCaseReport,
  notesFor,
  reportById,
  statusLabel,
  statusTone,
} from "../seed";

const DEFAULT_NOTE = "Reviewed the care record and confirmed the report details.";

export default function Case() {
  const [params] = useSearchParams();
  const { logAction } = useActivity();
  const caseId = params.get("case") ?? EDGE_CASE_ID;
  const report = reportById(caseId) ?? edgeCaseReport;

  const [addedNotes, setAddedNotes] = useState<TimelineEntry[]>([]);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    setAddedNotes([]);
    setNoteText("");
  }, [report.id]);

  const seedEntries: TimelineEntry[] = notesFor(report.id).map((note) => ({
    id: note.id,
    timestamp: formatDateTime(note.timestamp),
    author: note.author,
    text: note.text,
  }));

  const entries = [...seedEntries, ...addedNotes];

  const filedRecord = caseProgress.filed.get(report.id);

  function addNote() {
    const text = noteText.trim() || DEFAULT_NOTE;
    const timestamp = new Date();
    setAddedNotes((current) => [
      ...current,
      {
        id: `note-${report.id}-${timestamp.getTime()}`,
        timestamp: formatDateTime(timestamp),
        author: "Marisol Tran",
        text,
      },
    ]);
    setNoteText("");
    logAction("Added a note to the incident timeline");
  }

  return (
    <AppShell
      brandName="Umakes.cloud"
      brandUrl="https://umakes.cloud"
      brandEmail="umakescloud@gmail.com"
      personaName="Marisol Tran"
      personaRole="Regional compliance coordinator"
      nav={NAV}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
              Incident {report.id}
            </h1>
            <p className="mt-2 text-sm text-[var(--pf-muted)]">
              {report.residentName} at {report.community}, {report.incidentType}, logged{" "}
              {formatDateTime(report.incidentTime)}.
            </p>
          </div>
          <StatusPill label={statusLabel(report)} tone={statusTone(report)} />
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <section>
              <h2 className="text-lg font-medium">Incident timeline</h2>
              <p className="mt-1 text-sm text-[var(--pf-muted)]">
                Care notes, director messages and form changes for this report, oldest first.
              </p>
              <div className="mt-4">
                <Timeline entries={entries} dataTour="case-timeline" />
              </div>
            </section>

            <section
              aria-label="Add a note to the incident timeline"
              className="rounded-xl border border-[var(--pf-muted)]/15 p-4"
            >
              <label htmlFor="incident-note" className="text-sm font-medium">
                Add a note
              </label>
              <p className="mt-1 text-xs text-[var(--pf-muted)]">
                Anything you write here goes on the timeline with your name and the time. An empty
                note still records that you reviewed the report.
              </p>
              <textarea
                id="incident-note"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                rows={3}
                placeholder="Who did you reach, and what did they confirm?"
                className="mt-2 w-full rounded-lg border border-[var(--pf-muted)]/30 bg-[var(--pf-surface)] p-3 text-sm text-[var(--pf-ink)]"
              />
              <button
                type="button"
                onClick={addNote}
                className="mt-3 min-h-[44px] rounded-lg bg-[var(--pf-primary)] px-4 text-sm font-medium text-[var(--pf-surface)]"
              >
                Add note
              </button>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[var(--pf-muted)]/15 p-4">
              <h2 className="text-sm font-medium">Report details</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Resident</dt>
                  <dd className="text-right">{report.residentName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Medical record</dt>
                  <dd className="text-right">{report.mrn}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Location</dt>
                  <dd className="text-right">
                    {report.community}, {report.room}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Incident</dt>
                  <dd className="text-right">{report.incidentType}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Filing deadline</dt>
                  <dd className="text-right">{formatDateTime(report.filingDeadline)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Reported by</dt>
                  <dd className="text-right">{report.reportedBy}</dd>
                </div>
              </dl>
            </section>

            <DocumentViewer
              title="Care record extract"
              lines={[
                `${report.residentName} (${report.mrn})`,
                `${report.community}, ${report.room}`,
                `Incident type: ${report.incidentType}`,
                `Recorded at ${formatDateTime(report.incidentTime)}`,
                report.missingField
                  ? `Gap in the record: ${report.missingField}`
                  : "All required fields are present in the care record.",
              ]}
            />

            <DocumentViewer
              title="State filing draft"
              lines={[
                `Report ${report.id} for the ${report.community} community`,
                `Filing deadline ${formatDateTime(report.filingDeadline)}`,
                report.missingField
                  ? `Rejected by the state form: ${report.missingField}.`
                  : "Checked against the state form with no rejections.",
                filedRecord
                  ? `Filed ${formatDateTime(filedRecord.filedAt)} by Marisol Tran. Confirmation ${filedRecord.confirmationNumber}.`
                  : "Draft pre-filled from the care record and held for staff review.",
              ]}
            />

            <section className="rounded-xl border border-[var(--pf-muted)]/15 p-4">
              <h2 className="text-sm font-medium">Audit log</h2>
              <div className="mt-3">
                <AuditLog />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
