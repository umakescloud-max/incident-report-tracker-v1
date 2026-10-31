import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppShell,
  DataTable,
  MetricPanel,
  StatusPill,
  formatDate,
  formatDateTime,
  useActivity,
  type DataTableColumn,
} from "@kit";
import { NAV } from "../nav";
import {
  COMMUNITIES,
  EDGE_CASE_ID,
  computeMetrics,
  statusLabel,
  statusTone,
  trackerReports,
  type IncidentReport,
} from "../seed";

const ALL_COMMUNITIES = "All communities";

function timeLeftLabel(report: IncidentReport): string {
  if (report.filedAt) return `Filed ${formatDate(report.filedAt)}`;
  const remaining = report.filingDeadline.getTime() - Date.now();
  if (remaining <= 0) return "Deadline passed";
  const hours = Math.round(remaining / (60 * 60 * 1000));
  if (hours < 1) return "Under an hour left";
  return `${hours}h left`;
}

export default function Tracker() {
  const navigate = useNavigate();
  const { logAction } = useActivity();
  const [communityChoice, setCommunityChoice] = useState<string>(ALL_COMMUNITIES);
  const [appliedCommunity, setAppliedCommunity] = useState<string>(ALL_COMMUNITIES);

  const computed = computeMetrics();
  const metrics = [
    {
      label: "Open incident reports",
      value: String(computed.openReports),
      hint: "Draft or pending approval",
    },
    {
      label: "Filed on time",
      value: `${computed.onTimeRate}%`,
      hint: `${computed.onTimeFiled} of ${computed.totalFiled} filed in the last 90 days`,
    },
    {
      label: "Average hours to file",
      value: `${computed.averageHours.toFixed(1)} h`,
      hint: "From incident time to filing",
    },
    {
      label: "Open exceptions",
      value: String(computed.openExceptions),
      hint: "Reports with a missing detail",
    },
  ];
  const allRows = trackerReports();
  const rows =
    appliedCommunity === ALL_COMMUNITIES
      ? allRows
      : allRows.filter((report) => report.community === appliedCommunity);

  const columns: DataTableColumn<IncidentReport>[] = [
    {
      key: "incident",
      header: "Incident",
      render: (report) => (
        <span className="block">
          <span className="block font-medium">Incident {report.id}</span>
          <span className="block text-xs text-[var(--pf-muted)]">{report.residentName}</span>
        </span>
      ),
    },
    {
      key: "community",
      header: "Community",
      render: (report) => report.community,
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
      key: "filingDeadline",
      header: "Filing deadline",
      render: (report) => formatDate(report.filingDeadline),
    },
    {
      key: "timeLeft",
      header: "Time left",
      render: (report) => timeLeftLabel(report),
    },
    {
      key: "status",
      header: "Status",
      render: (report) => <StatusPill label={statusLabel(report)} tone={statusTone(report)} />,
    },
  ];

  function openCase(report: IncidentReport) {
    logAction(
      report.id === EDGE_CASE_ID
        ? "Opened incident 3318"
        : `Opened incident ${report.id}`
    );
    navigate(`/case?case=${report.id}`);
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
            Incident tracker
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--pf-muted)]">
            Every open and recent incident report across Willowbend&apos;s five communities, with
            the time left before each state filing deadline. Open a row to read the full incident
            history.
          </p>
        </header>

        <MetricPanel metrics={metrics} dataTour="metric-panel" />

        <section
          aria-label="Filter the incident list"
          className="rounded-xl border border-[var(--pf-muted)]/15 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="text-sm" htmlFor="community-filter">
              <span className="mb-1 block text-xs font-medium text-[var(--pf-muted)]">
                Community
              </span>
              <select
                id="community-filter"
                value={communityChoice}
                onChange={(event) => setCommunityChoice(event.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[var(--pf-muted)]/30 bg-[var(--pf-surface)] px-3 text-sm text-[var(--pf-ink)] sm:w-60"
              >
                <option value={ALL_COMMUNITIES}>{ALL_COMMUNITIES}</option>
                {COMMUNITIES.map((community) => (
                  <option key={community} value={community}>
                    {community}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setAppliedCommunity(communityChoice);
                logAction("Filtered the list by community");
              }}
              className="min-h-[44px] rounded-lg bg-[var(--pf-primary)] px-4 text-sm font-medium text-[var(--pf-surface)]"
            >
              Filter by community
            </button>
          </div>
          <p className="mt-3 text-xs text-[var(--pf-muted)]">
            Showing {rows.length} of {allRows.length} reports
            {appliedCommunity === ALL_COMMUNITIES ? "" : ` in ${appliedCommunity}`}.
          </p>
        </section>

        <section className="rounded-xl border border-[var(--pf-muted)]/15 p-4">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(report) => report.id}
            onRowClick={openCase}
            dataTour="tracker-table"
            mobileStatusKey="status"
            mobileUrgencyKey="timeLeft"
          />
        </section>
      </div>
    </AppShell>
  );
}
