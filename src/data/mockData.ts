export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  unit: string;
  status: "New" | "Contacted" | "Hot Lead" | "Meeting" | "Lost";
  budget: string;
  lastContact: string;
  ai_summary: string;
  avatar_colors: [string, string];
}

export interface ChatMessage {
  id: string;
  sender: "ai" | "client";
  text: string;
  time: string;
}

export interface ChatThread {
  id: string;
  clientName: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar_colors: [string, string];
  messages: ChatMessage[];
}

export interface Notification {
  id: string;
  type: "ai" | "manual" | "system" | "lead";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export const clients: Client[] = [
  { id: "1", name: "Ahmed Al Maktoum", email: "ahmed@maktoum.ae", phone: "+971 50 123 4567", property: "Bluewaters Residences", unit: "BW-1201", status: "Hot Lead", budget: "AED 12.5M", lastContact: "2 hours ago", ai_summary: "High-interest buyer. Requested private viewing for the penthouse unit with sea view. Budget confirmed by financial advisor.", avatar_colors: ["#6366f1", "#8b5cf6"] },
  { id: "2", name: "Fatima Al Hashimi", email: "fatima@alhashimi.com", phone: "+971 55 987 6543", property: "Palm Jumeirah Villas", unit: "PJ-V08", status: "Meeting", budget: "AED 28M", lastContact: "1 day ago", ai_summary: "Scheduled viewing for Friday. Interested in waterfront villa with private beach access. Previously owned property in Emirates Hills.", avatar_colors: ["#ec4899", "#f43f5e"] },
  { id: "3", name: "Rashid Bin Saeed", email: "rashid@binsaeed.ae", phone: "+971 54 555 1234", property: "Dubai Marina Heights", unit: "DMH-3405", status: "New", budget: "AED 4.2M", lastContact: "Just now", ai_summary: "New inquiry via website. Looking for 2BR apartment with marina view. First-time buyer, pre-approved mortgage.", avatar_colors: ["#10b981", "#059669"] },
  { id: "4", name: "Sara Al Nahyan", email: "sara@alnahyan.ae", phone: "+971 52 444 8899", property: "Atlantis The Royal Residences", unit: "ATR-PH02", status: "Contacted", budget: "AED 45M", lastContact: "3 hours ago", ai_summary: "Ultra-high-net-worth individual. Looking for trophy penthouse. Currently lives in Abu Dhabi. Wants dual-key layout.", avatar_colors: ["#f59e0b", "#d97706"] },
  { id: "5", name: "Khalid Al Qasimi", email: "khalid@alqasimi.com", phone: "+971 56 777 3344", property: "Emaar Beachfront", unit: "EB-2201", status: "Hot Lead", budget: "AED 8.8M", lastContact: "5 hours ago", ai_summary: "Repeat buyer. Previously purchased through agency. Wants 3BR with full sea view. Cash buyer, ready to close within 30 days.", avatar_colors: ["#3b82f6", "#2563eb"] },
  { id: "6", name: "Noura Al Ketbi", email: "noura@alketbi.ae", phone: "+971 58 111 2233", property: "One Za'abeel", unit: "OZ-5501", status: "Lost", budget: "AED 18M", lastContact: "1 week ago", ai_summary: "Was interested but chose competitor property. Price negotiations fell through. May revisit in Q2.", avatar_colors: ["#64748b", "#475569"] },
  { id: "7", name: "Mohammed Al Falasi", email: "mohammed@alfalasi.ae", phone: "+971 50 999 7788", property: "DAMAC Hills Villa", unit: "DH-V22", status: "Contacted", budget: "AED 15M", lastContact: "6 hours ago", ai_summary: "Interested in luxury villa community. Wants golf course view. Family of 6, needs 5+ bedrooms. Comparing with Arabian Ranches III.", avatar_colors: ["#8b5cf6", "#7c3aed"] },
  { id: "8", name: "Layla Rashid", email: "layla@rashid.ae", phone: "+971 55 333 4455", property: "Creek Harbour Tower", unit: "CHT-4102", status: "New", budget: "AED 6.5M", lastContact: "30 min ago", ai_summary: "Young professional relocating from London. Wants modern high-rise with Burj Khalifa view. Pre-approved for mortgage up to AED 7M.", avatar_colors: ["#14b8a6", "#0d9488"] },
];

export const chatThreads: ChatThread[] = [
  {
    id: "1", clientName: "Ahmed Al Maktoum", lastMessage: "I'd love to schedule a viewing this weekend.", time: "2:30 PM", unread: 2, avatar_colors: ["#6366f1", "#8b5cf6"],
    messages: [
      { id: "m1", sender: "client", text: "Hello, I'm very interested in the Bluewaters penthouse unit BW-1201.", time: "2:15 PM" },
      { id: "m2", sender: "ai", text: "Thank you for your interest, Mr. Al Maktoum! The BW-1201 is one of our premium units featuring panoramic sea views across 4,200 sq ft. It includes a private terrace, Italian marble finishes, and Gaggenau appliances throughout.", time: "2:16 PM" },
      { id: "m3", sender: "client", text: "That sounds exactly what I'm looking for. What's the asking price?", time: "2:20 PM" },
      { id: "m4", sender: "ai", text: "The unit is listed at AED 12.5M. This includes premium parking with 3 dedicated spots and access to all Bluewaters amenities including the private residents' beach club and concierge service.", time: "2:21 PM" },
      { id: "m5", sender: "client", text: "I'd love to schedule a viewing this weekend.", time: "2:30 PM" },
    ],
  },
  {
    id: "2", clientName: "Fatima Al Hashimi", lastMessage: "Can we reschedule to Saturday morning?", time: "11:45 AM", unread: 0, avatar_colors: ["#ec4899", "#f43f5e"],
    messages: [
      { id: "m1", sender: "ai", text: "Good morning, Ms. Al Hashimi! This is a reminder about your scheduled viewing of the Palm Jumeirah Villa PJ-V08 this Friday at 3 PM.", time: "10:00 AM" },
      { id: "m2", sender: "client", text: "Can we reschedule to Saturday morning?", time: "11:45 AM" },
    ],
  },
  {
    id: "3", clientName: "Sara Al Nahyan", lastMessage: "Please send me the floor plans for the penthouse.", time: "4:10 PM", unread: 1, avatar_colors: ["#f59e0b", "#d97706"],
    messages: [
      { id: "m1", sender: "client", text: "I've been browsing your Atlantis Royal Residences listings. The PH02 caught my eye.", time: "3:50 PM" },
      { id: "m2", sender: "ai", text: "Wonderful choice, Ms. Al Nahyan! The ATR-PH02 is our crown jewel — a 7,800 sq ft duplex penthouse with 270-degree ocean views, private infinity pool, and direct elevator access.", time: "3:52 PM" },
      { id: "m3", sender: "client", text: "Please send me the floor plans for the penthouse.", time: "4:10 PM" },
    ],
  },
];

export const notifications: Notification[] = [
  { id: "1", type: "ai", title: "AI Auto-Response Sent", description: "Automated follow-up sent to Ahmed Al Maktoum regarding Bluewaters BW-1201 viewing.", time: "5 min ago", read: false },
  { id: "2", type: "lead", title: "New Hot Lead Detected", description: "Khalid Al Qasimi has been upgraded to Hot Lead based on engagement patterns.", time: "20 min ago", read: false },
  { id: "3", type: "system", title: "Viewing Scheduled", description: "Fatima Al Hashimi's Palm Jumeirah viewing rescheduled to Saturday 10:00 AM.", time: "1 hour ago", read: true },
  { id: "4", type: "manual", title: "Manual Note Added", description: "Agent Yusuf added a note to Sara Al Nahyan's file regarding budget confirmation.", time: "2 hours ago", read: true },
  { id: "5", type: "ai", title: "Lead Score Updated", description: "AI model recalculated scores for 12 leads. 3 moved to 'Hot Lead' status.", time: "3 hours ago", read: false },
  { id: "6", type: "system", title: "Document Uploaded", description: "Passport copy uploaded for Mohammed Al Falasi's KYC verification.", time: "5 hours ago", read: true },
  { id: "7", type: "lead", title: "Lead Lost Alert", description: "Noura Al Ketbi marked as Lost. Competitor closed with lower price point.", time: "1 day ago", read: true },
  { id: "8", type: "ai", title: "Market Report Generated", description: "Weekly AI market analysis for Palm Jumeirah and Bluewaters properties is ready.", time: "1 day ago", read: true },
];
