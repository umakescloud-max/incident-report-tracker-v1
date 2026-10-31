import { useEffect, useState } from "react";
import {
  AppShell,
  DataTable,
  RecordDrawer,
  ScenarioBanner,
  StatusPill,
  formatDate,
  formatDateTime,
  useActivity,
  type DataTableColumn,
} from "@kit";
import { NAV } from "../nav";
import {
  EDGE_CASE_ID,
  EDGE_CASE_LABEL,
  caseProgress,
  exceptionReports,
  statusLabel,
  statusTone,
  type IncidentReport,
} from "../seed";

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function countdownText(deadline: Date, now: Date): string {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return "The filing deadline has passed.";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourPart = hours === 1 ? "1 hour" : `${hours} hours`;
  const minutePart = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  return `${hourPart} ${minutePart} left`;
}

function detailLabel(field: string | null): string {
  if (!field) return "Missing detail";
  const bare = field.replace(/^missing /, "");
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

export default function Denials() {
  const { logAction } = useActivity();
  const now = useNow(30000);
  const [selected, setSelected] = useState<IncidentReport | null>(null);
  const [detailValue, setDetailValue] = useState("");
  const [savedDetail, setSavedDetail] = useState<string | null>(null);

  const edgeReport = exceptionReports[0];

  const columns: DataTableColumn<IncidentReport>[] = [
    {
      key: "incident",
      header: "Incident",
      render: (report) => (
        <span className="block">
          <span className="block font-medium">Incident {report.id}</span>
          <span className="block text-xs text-[var(--pf-muted)]">
            {report.residentName}, {report.community}
          </span>
          <span className="block text-xs text-[var(--pf-ink)]">{report.missingField}</span>
        </span>
      ),
    },
    {
      key: "incidentType",
      header: "Incident type",
      render: (report) => report.incidentType,
    },
    {
      key: "incidentTime",
      header: "Incident time",
      render: (report) => formatDateTime(report.incidentTime),
    },
    {
      key: "deadline",
      header: "Filing deadline",
      render: (report) => formatDate(report.filingDeadline),
    },
    {
      key: "status",
      header: "Status",
      render: (report) => <StatusPill label={statusLabel(report)} tone={statusTone(report)} />,
    },
  ];

  function openReport(report: IncidentReport) {
    setSelected(report);
    setDetailValue(caseProgress.detailAdded.get(report.id) ?? "");
    setSavedDetail(caseProgress.detailAdded.get(report.id) ?? null);
  }

  function closeDrawer() {
    setSelected(null);
    setDetailValue("");
    setSavedDetail(null);
  }

  function handleAddDetail() {
    if (!selected) return;
    const value =
      detailValue.trim() || "Recorded from the night nurse's shift log during the morning review";
    caseProgress.detailAdded.set(selected.id, value);
    setSavedDetail(value);
    logAction("Added the missing detail to the report");
  }

  function handleMove() {
    if (!selected) return;
    caseProgress.movedToQueue.add(selected.id);
    logAction("Moved the report to the filing queue");
    setSelected(null);
    setDetailValue("");
    setSavedDetail(null);
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
        <header>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Exceptions
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--pf-muted)]">
            Every report the state form rejected or that has a missing detail, with the specific
            gap named. Open a row to add the detail, then move the report to the filing queue
            yourself. Nothing moves on its own.
          </p>
        </header>

        <ScenarioBanner
          title={`Incident ${EDGE_CASE_ID}: ${EDGE_CASE_LABEL}`}
          body="The care record has no physician notification time, so the state form rejected the draft. Open the row, add the detail, then move the report to the filing queue yourself."
        />

        <div
          data-tour="appeal-countdown"
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-[var(--pf-accent)]/50 px-4 py-3"
        >
          <p className="text-sm font-medium">Time left to file incident {EDGE_CASE_ID}</p>
          <p className="text-xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            {countdownText(edgeReport.filingDeadline, now)}
          </p>
          <p className="w-full text-xs text-[var(--pf-muted)] sm:w-auto">
            Filing deadline {formatDateTime(edgeReport.filingDeadline)}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--pf-muted)]/15 p-4">
          <DataTable
            columns={columns}
            rows={exceptionReports}
            rowKey={(report) => report.id}
            onRowClick={(report) => openReport(report)}
            dataTour="denial"
            mobileStatusKey="status"
            mobileUrgencyKey="deadline"
            edgeCaseRow={(report) => report.id === EDGE_CASE_ID}
          />
        </div>

        <p className="text-xs text-[var(--pf-muted)]">
          Select a row to open the report and the two filing actions. Filing to the state still
          needs your approval in the filing queue.
        </p>
      </div>

      <RecordDrawer
        open={selected !== null}
        title={selected ? `Incident ${selected.id}` : ""}
        onClose={closeDrawer}
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium">
                {selected.residentName} at {selected.community}
              </p>
              <p className="mt-1 text-sm text-[var(--pf-muted)]">
                {selected.incidentType.charAt(0).toUpperCase() + selected.incidentType.slice(1)},
                reported {formatDateTime(selected.incidentTime)}. Status:{" "}
                <StatusPill label={statusLabel(selected)} tone={statusTone(selected)} />
              </p>
            </div>

            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[var(--pf-muted)]">Missing detail</dt>
                <dd>{selected.missingField}</dd>
              </div>
              <div>
                <dt className="text-[var(--pf-muted)]">Filing deadline</dt>
                <dd>{formatDateTime(selected.filingDeadline)}</dd>
              </div>
              <div>
                <dt className="text-[var(--pf-muted)]">Why the form rejected it</dt>
                <dd>
                  The state filing check needs this field before the report can be filed.
                </dd>
              </div>
            </dl>

            <div>
              <label htmlFor="missing-detail" className="text-sm font-medium">
                {detailLabel(selected.missingField)}
              </label>
              <input
                id="missing-detail"
                value={detailValue}
                onChange={(event) => setDetailValue(event.target.value)}
                placeholder="For example, 11:05pm, night nurse reached the on-call physician"
                className="mt-2 w-full rounded-lg border border-[var(--pf-muted)]/30 bg-[var(--pf-surface)] px-3 py-2.5 text-sm text-[var(--pf-ink)]"
              />
              <p className="mt-1 text-xs text-[var(--pf-muted)]">
                Leaving this blank still records that you confirmed the detail from the night
                shift.
              </p>
            </div>

            {savedDetail && (
              <p className="rounded-lg border border-[var(--pf-primary)]/30 bg-[var(--pf-primary)]/5 px-3 py-2 text-sm">
                Recorded: {savedDetail}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAddDetail}
                className="min-h-[44px] rounded-lg bg-[var(--pf-primary)] px-4 text-sm font-medium text-[var(--pf-surface)]"
              >
                Add missing detail
              </button>
              <button
                type="button"
                onClick={handleMove}
                className="min-h-[44px] rounded-lg border border-[var(--pf-muted)]/30 px-4 text-sm font-medium"
              >
                Move to filing queue
              </button>
            </div>

            <p className="text-xs text-[var(--pf-muted)]">
              The report stays in Exceptions until you move it. Nothing is sent to the state from
              this screen.
            </p>
          </div>
        )}
      </RecordDrawer>
    </AppShell>
  );
}
