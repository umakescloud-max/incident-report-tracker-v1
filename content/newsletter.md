# State incident filings without the spreadsheet

When a resident falls in assisted living, the care team responds first. Then someone has to file a report with the state on a deadline, with every required detail. In a group with several communities, that is usually one compliance coordinator.

It goes wrong for the same reasons every week. Incident details live in the clinical record and in chat messages, and someone retypes them into the state portal by hand. Deadlines sit in a spreadsheet with no reminders. A missing detail, like the physician notification time, shows up only when the state rejects the form. Nobody tallies rejections, so root causes stay hidden.

In the scenario we modeled, 5 communities with about 420 residents file around 18 reportable incidents a month. The coordinator spends about 9 hours a week re-keying data and chasing directors. Late or incomplete filings cost an estimated $11,000 last year.

## What the prototype does

- **Incident tracker**: every open and recent report across five communities in one list, with time left to each deadline.
- **Incident**: the full timeline of care notes, messages and form changes, with a button to add a note.
- **Exceptions**: incident 3318, a fall with a hip injury, flagged for "missing physician notification time" with a live countdown of about 6 hours. The coordinator adds the time and moves it to the filing queue.
- **Filing queue**: the human checkpoint. She reads the drafted narrative, then clicks "Approve and file" or returns it for more information. Nothing is filed without that click.
- A metric panel shows open reports, on-time filings, average hours to file and open exceptions.

## How a real version would be built

A production version would pull incident data from Aline Care through Power Automate. It would store reports and deadlines in Dataverse and SharePoint, route approvals through Microsoft Teams, and use Azure OpenAI to draft narratives and find missing fields. A named staff member still approves every filing to the state portal.

HIPAA controls come built in: role-based access, full audit logs, encryption at rest and in transit, and a signed BAA before any resident data reaches a model. It deploys on the client's own cloud, and the client owns it.

This is a concept prototype with synthetic data: 80 made-up incident reports and 190 notes. A real build runs on your own cloud, HIPAA-ready, and you own it.

Try the demo: https://umakescloud-max.github.io/incident-report-tracker-v1/

If your team fights this every week, book a free workflow audit at umakes.cloud or reply to umakescloud@gmail.com.
