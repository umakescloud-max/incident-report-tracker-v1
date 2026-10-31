// Deterministic seed data for the Willowbend incident report tracker.
// Every date is relative to the moment the demo is viewed (rel() or a date
// derived from it), so "today" is always today. No literal calendar dates,
// no Math.random, and nothing persisted across a reload.

import { createNameGenerator, fakeMrn, pickOne, randomInt, rel, rng } from "@kit";
import type { StatusTone } from "@kit";

export const COMMUNITIES = [
  "Oakmont",
  "Cedar Glen",
  "Harbor Point",
  "Linden Court",
  "Maple Ridge",
] as const;
export type Community = (typeof COMMUNITIES)[number];

export const INCIDENT_TYPES = [
  "fall with injury",
  "medication error",
  "elopement",
  "resident-to-resident altercation",
  "unexpected hospital transfer",
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export type IncidentStatus = "draft" | "pending approval" | "filed" | "exception";

export interface IncidentReport {
  id: string;
  residentName: string;
  mrn: string;
  community: Community;
  incidentType: IncidentType;
  incidentTime: Date;
  filedAt: Date | null;
  filingDeadline: Date;
  status: IncidentStatus;
  missingField: string | null;
  confirmationNumber: string | null;
  approver: string | null;
  reportedBy: string;
  room: string;
}

export interface IncidentNote {
  id: string;
  caseId: string;
  author: string;
  timestamp: Date;
  text: string;
}

export const EDGE_CASE_ID = "3318";
export const EDGE_CASE_LABEL = "missing physician notification time";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function hoursAfter(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * HOUR_MS);
}

function clock(hour: number, minute: number): `${number}:${number}` {
  return `${hour}:${String(minute).padStart(2, "0")}` as `${number}:${number}`;
}

const rand = rng("incident-report-tracker-v1");
const residentNames = createNameGenerator(rand);
const staffNames = createNameGenerator(rand);

const usedIds = new Set<string>([EDGE_CASE_ID]);

function makeCaseId(): string {
  let id = String(randomInt(rand, 3000, 3499));
  while (usedIds.has(id)) id = String(randomInt(rand, 3000, 3499));
  usedIds.add(id);
  return id;
}

function makeReport(
  fields: Pick<
    IncidentReport,
    | "id"
    | "residentName"
    | "community"
    | "incidentType"
    | "incidentTime"
    | "filedAt"
    | "filingDeadline"
    | "status"
    | "missingField"
  >
): IncidentReport {
  const filed = fields.status === "filed";
  return {
    ...fields,
    mrn: fakeMrn(rand),
    confirmationNumber: filed ? `ST-${randomInt(rand, 100000, 999999)}` : null,
    approver: filed ? "Marisol Tran" : null,
    reportedBy: staffNames.next(),
    room: `Room ${randomInt(rand, 104, 338)}`,
  };
}

// The brief's edge case: incident 3318, a fall at Oakmont last night, with a
// draft the state form rejected for a missing physician notification time.
export const edgeCaseReport: IncidentReport = makeReport({
  id: EDGE_CASE_ID,
  residentName: "R. Delgado",
  community: "Oakmont",
  incidentType: "fall with injury",
  incidentTime: rel(-1, "22:40"),
  filedAt: null,
  filingDeadline: hoursFromNow(6),
  status: "exception",
  missingField: EDGE_CASE_LABEL,
});

const otherExceptionTemplates: {
  community: Community;
  incidentType: IncidentType;
  missingField: string;
}[] = [
  {
    community: "Cedar Glen",
    incidentType: "medication error",
    missingField: "missing witness name",
  },
  {
    community: "Harbor Point",
    incidentType: "resident-to-resident altercation",
    missingField: "missing injury description",
  },
  {
    community: "Linden Court",
    incidentType: "unexpected hospital transfer",
    missingField: "missing family notification time",
  },
];

const otherExceptions = otherExceptionTemplates.map((template, index) =>
  makeReport({
    id: makeCaseId(),
    residentName: residentNames.next(),
    community: template.community,
    incidentType: template.incidentType,
    incidentTime: rel(-(index + 2), clock(randomInt(rand, 6, 20), randomInt(rand, 0, 59))),
    filedAt: null,
    filingDeadline: hoursFromNow(randomInt(rand, 5, 30)),
    status: "exception",
    missingField: template.missingField,
  })
);

const drafts = Array.from({ length: 6 }, () => {
  const incidentTime = rel(-1, clock(randomInt(rand, 5, 20), randomInt(rand, 0, 59)));
  return makeReport({
    id: makeCaseId(),
    residentName: residentNames.next(),
    community: pickOne(rand, COMMUNITIES),
    incidentType: pickOne(rand, INCIDENT_TYPES),
    incidentTime,
    filedAt: null,
    filingDeadline: hoursAfter(incidentTime, 48),
    status: "draft",
    missingField: null,
  });
});

const pendingApproval = Array.from({ length: 4 }, () => {
  const incidentTime = rel(-1, clock(randomInt(rand, 5, 20), randomInt(rand, 0, 59)));
  return makeReport({
    id: makeCaseId(),
    residentName: residentNames.next(),
    community: pickOne(rand, COMMUNITIES),
    incidentType: pickOne(rand, INCIDENT_TYPES),
    incidentTime,
    filedAt: null,
    filingDeadline: hoursAfter(incidentTime, 48),
    status: "pending approval",
    missingField: null,
  });
});

const filed = Array.from({ length: 66 }, (_, index) => {
  const daysAgo = 2 + index;
  const incidentTime = rel(-daysAgo, clock(randomInt(rand, 5, 22), randomInt(rand, 0, 59)));
  const filingDeadline = hoursAfter(incidentTime, 24);
  const late = rand() < 0.06;
  const filedAt = hoursAfter(incidentTime, late ? randomInt(rand, 26, 40) : randomInt(rand, 4, 22));
  return makeReport({
    id: makeCaseId(),
    residentName: residentNames.next(),
    community: pickOne(rand, COMMUNITIES),
    incidentType: pickOne(rand, INCIDENT_TYPES),
    incidentTime,
    filedAt,
    filingDeadline,
    status: "filed",
    missingField: null,
  });
});

// Order is deliberate: 3318 first so the edge-case row is always among the
// first rows on the Exceptions screen, then the other exceptions, the open
// reports, and finally the filed history.
export const reports: IncidentReport[] = [
  edgeCaseReport,
  ...otherExceptions,
  ...drafts,
  ...pendingApproval,
  ...filed,
];

export const exceptionReports: IncidentReport[] = reports.filter(
  (report) => report.status === "exception"
);

const NOTE_TEXTS = [
  "Night nurse reached by phone, checking the shift log.",
  "Director confirmed family was called.",
  "Physician office returned the call; notification time entered in the care record.",
  "Witness statement collected and attached to the report.",
  "Resident moved closer to the nurses' station for observation.",
  "Medication administration record pulled for the pharmacy review.",
  "Draft state report pre-filled from the care record.",
  "Family asked for a follow-up call after the physician review.",
  "Shift supervisor reviewed the incident with the night team.",
  "Hospital transfer summary requested from the receiving unit.",
  "Community director confirmed the room and unit number.",
  "Report checked against the state form; two fields still need confirmation.",
];

const NOTE_ROLES = ["night nurse", "shift supervisor", "community director"];

export const caseNotes: IncidentNote[] = [];

const edgeNotes = [
  {
    hours: 0.2,
    text: "Resident found on the bathroom floor; assisted to bed and assessed by the on-call nurse.",
  },
  {
    hours: 0.5,
    text: "Family called and notified of the fall; daughter asked for a call back after the physician review.",
  },
  {
    hours: 8,
    text: "Draft state report started. The physician notification time is still blank in the care record.",
  },
  {
    hours: 8.4,
    text: "Night nurse messaged in Teams to confirm when the physician was reached.",
  },
];

edgeNotes.forEach((note, index) => {
  caseNotes.push({
    id: `${EDGE_CASE_ID}-n${index + 1}`,
    caseId: EDGE_CASE_ID,
    author:
      index === 3
        ? "Marisol Tran"
        : `${staffNames.next()}, ${index < 2 ? "night nurse" : "community director"}`,
    timestamp: hoursAfter(edgeCaseReport.incidentTime, note.hours),
    text: note.text,
  });
});

reports.slice(1).forEach((report, index) => {
  const noteCount = index % 3 === 0 ? 3 : 2;
  for (let j = 0; j < noteCount; j += 1) {
    caseNotes.push({
      id: `${report.id}-n${j + 1}`,
      caseId: report.id,
      author: `${staffNames.next()}, ${pickOne(rand, NOTE_ROLES)}`,
      timestamp: hoursAfter(report.incidentTime, [0.4, 2.5, 9][j]),
      text: pickOne(rand, NOTE_TEXTS),
    });
  }
});

export function notesFor(caseId: string): IncidentNote[] {
  return caseNotes.filter((note) => note.caseId === caseId);
}

export function reportById(caseId: string): IncidentReport | undefined {
  return reports.find((report) => report.id === caseId);
}

// In-memory only. A reload starts the demo over, exactly as a concept
// prototype should: nothing changes on its own and nothing is persisted.
export interface FiledRecord {
  confirmationNumber: string;
  filedAt: Date;
}

export const caseProgress: {
  detailAdded: Map<string, string>;
  movedToQueue: Set<string>;
  filed: Map<string, FiledRecord>;
  returned: Set<string>;
} = {
  detailAdded: new Map(),
  movedToQueue: new Set(),
  filed: new Map(),
  returned: new Set(),
};

export type DisplayStatus = IncidentStatus | "ready for filing" | "in filing queue";

export function displayStatus(report: IncidentReport): DisplayStatus {
  if (caseProgress.filed.has(report.id)) return "filed";
  if (caseProgress.movedToQueue.has(report.id)) return "in filing queue";
  if (caseProgress.detailAdded.has(report.id)) return "ready for filing";
  return report.status;
}

export function statusLabel(report: IncidentReport): string {
  switch (displayStatus(report)) {
    case "pending approval":
      return "Pending approval";
    case "in filing queue":
      return "In filing queue";
    case "ready for filing":
      return "Ready for filing";
    case "draft":
      return "Draft";
    case "filed":
      return "Filed";
    case "exception":
      return "Exception";
  }
}

export function statusTone(report: IncidentReport): StatusTone {
  const status = displayStatus(report);
  if (status === "exception") return "accent";
  if (status === "draft") return "muted";
  return "primary";
}

export interface TrackerMetrics {
  openReports: number;
  onTimeRate: number;
  onTimeFiled: number;
  totalFiled: number;
  averageHours: number;
  openExceptions: number;
}

export function computeMetrics(): TrackerMetrics {
  const cutoff = Date.now() - 90 * DAY_MS;
  const filedReports = reports.filter(
    (report) =>
      report.status === "filed" &&
      report.filedAt !== null &&
      report.filedAt.getTime() >= cutoff
  );
  const onTime = filedReports.filter(
    (report) => report.filedAt !== null && report.filedAt.getTime() <= report.filingDeadline.getTime()
  ).length;
  const totalHours = filedReports.reduce(
    (sum, report) =>
      sum + (report.filedAt!.getTime() - report.incidentTime.getTime()) / HOUR_MS,
    0
  );
  return {
    openReports: reports.filter(
      (report) => report.status === "draft" || report.status === "pending approval"
    ).length,
    onTimeRate:
      filedReports.length > 0 ? Math.round((onTime / filedReports.length) * 100) : 0,
    onTimeFiled: onTime,
    totalFiled: filedReports.length,
    averageHours: filedReports.length > 0 ? totalHours / filedReports.length : 0,
    openExceptions: reports.filter((report) => report.status === "exception").length,
  };
}

/** Open reports plus anything filed in the last week, in seed order. */
export function trackerReports(): IncidentReport[] {
  const cutoff = Date.now() - 7 * DAY_MS;
  return reports.filter(
    (report) =>
      report.status !== "filed" ||
      (report.filedAt !== null && report.filedAt.getTime() >= cutoff)
  );
}
