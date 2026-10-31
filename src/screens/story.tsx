import { useCallback, useState } from "react";
import { AppShell, OneClickLogin, StoryPanel, TourRunner, useActivity } from "@kit";
import { NAV } from "../nav";
import tourSteps from "../tour.json";

const LOGIN_KEY = "pf-login-incident-report-tracker-v1";
const TOUR_KEY = "pf-tour-incident-report-tracker-v1";

const PERSONA_NAME = "Marisol Tran";
const PERSONA_ROLE = "Regional compliance coordinator";
const PRACTICE_NAME = "Willowbend Senior Living";

const PAIN_POINTS = [
  "Incident details are copied by hand from the care record into state forms",
  "Filing deadlines are tracked in a spreadsheet with no reminders",
  "Missing details such as notification times are found late",
  "No single view of filing status across five communities",
  "Rejected forms and late filings are not tallied, so root causes stay hidden",
];

export default function Story() {
  const { logAction } = useActivity();
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return window.localStorage.getItem(LOGIN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const handleLogin = () => {
    try {
      window.localStorage.setItem(LOGIN_KEY, "1");
    } catch {
      // Private browsing with storage disabled: the demo still opens.
    }
    setLoggedIn(true);
  };

  const handleStartTour = useCallback(() => {
    logAction("Started the guided tour");
    if (document.querySelector(".driver-popover")) return;
    const replay = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent?.trim() === "Replay tour",
    );
    replay?.click();
  }, [logAction]);

  if (!loggedIn) {
    return (
      <OneClickLogin
        personaName={PERSONA_NAME}
        personaRole={PERSONA_ROLE}
        practiceName={PRACTICE_NAME}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <AppShell
      brandName="Umakes.cloud"
      brandUrl="https://umakes.cloud"
      brandEmail="umakescloud@gmail.com"
      personaName={PERSONA_NAME}
      personaRole={PERSONA_ROLE}
      nav={NAV}
    >
      <StoryPanel
        practiceName={PRACTICE_NAME}
        practiceType="Assisted living and memory care operator, five communities across one region, about 420 residents"
        personaName={PERSONA_NAME}
        dayInTheLife="Marisol starts at 7:15am with 9 open incident reports across 5 communities. Directors message her in Teams when something happens, she re-reads the care notes, copies details into the state regulator's online form by hand, and tracks each filing deadline in a spreadsheet. By 8:40am she finds that incident 3318, a resident fall with a hip injury at the Oakmont community, was logged last night but the physician notification time was never recorded, the state form rejected the draft, and only 6 hours remain before the filing deadline."
        painPoints={PAIN_POINTS}
        costOfPain="Marisol spends about 9 hours per week re-keying incident data and chasing directors, and the group has paid an estimated $11,000 over the past year in citations and corrective-action time tied to late or incomplete filings."
        before="7:15am: Marisol opens the spreadsheet, Teams, and the care record side by side and re-types 9 open incidents into forms. At 8:40am she notices that incident 3318, a fall with injury at Oakmont, has no physician notification time. The state form was rejected for that gap, and about 6 hours remain before the filing deadline. No one has called the night nurse."
        after="7:15am: Marisol opens the tracker. Incident 3318 is already flagged in Exceptions as 'missing physician notification time', with a live countdown of about 6 hours. The draft report is pre-filled from the care record. She messages the night nurse, adds the time, moves the report to the Filing queue herself, reads the drafted narrative, and approves it in two clicks. Nothing is filed on its own. All 9 open incidents sit in one list with the time left on each."
        onStartTour={handleStartTour}
      />
      <TourRunner steps={tourSteps} storageKey={TOUR_KEY} />
    </AppShell>
  );
}
