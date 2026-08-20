import type { ActivityEvent } from "@/types/paterhaus";

export const paterhausActivity: ActivityEvent[] = [
  {
    id: "activity-01",
    propertyId: "prop-marina-vista-2204",
    actor: "Priya Nair",
    text: "Snag #SG-184 assigned to Vertex Technical Services",
    timestamp: "2025-08-18T10:20:00",
    type: "Task",
  },
  {
    id: "activity-02",
    propertyId: "prop-marina-vista-2204",
    actor: "Priya Nair",
    text: "Booking BK-2091 checked in",
    timestamp: "2025-08-17T15:05:00",
    type: "Stay",
  },
  {
    id: "activity-03",
    propertyId: "prop-palm-crescent",
    actor: "Khalid Al Farsi",
    text: "Owner approval requested for AED 2,800 cooling repair",
    timestamp: "2025-08-20T07:35:00",
    type: "Finance",
  },
  {
    id: "activity-04",
    propertyId: "prop-bay-avenue",
    actor: "Amelia Hart",
    text: "DTCM licence renewal due in 15 days",
    timestamp: "2025-08-20T09:05:00",
    type: "Compliance",
  },
  {
    id: "activity-05",
    propertyId: "prop-ardmore-downtown",
    actor: "Maya Fernandes",
    text: "Turnover delayed by 25 minutes after checkout inspection",
    timestamp: "2025-08-20T10:10:00",
    type: "Task",
  },
  {
    id: "activity-06",
    propertyId: "prop-jbr-sands",
    actor: "Omar Rahman",
    text: "Guest incident escalated to Vertex Technical Services",
    timestamp: "2025-08-20T09:14:00",
    type: "Communication",
  },
];
