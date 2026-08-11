import { BusinessCategory } from "@/types/business.type";
import { ReportReason } from "@/types/common.type";

// Common business timings dropdown options
export const BUSINESS_TIMINGS_OPTIONS: BusinessCategory[] = [
  { id: "7-19", name: "Open Daily: 7:00 AM - 7:00 PM" },
  { id: "8-20", name: "Open Daily: 8:00 AM - 8:00 PM" },
  { id: "8-22", name: "Open Daily: 8:00 AM - 10:00 PM" },
  { id: "9-21", name: "Open Daily: 9:00 AM - 9:00 PM" },
  { id: "10-18", name: "Open Daily: 10:00 AM - 6:00 PM" },
  { id: "11-23", name: "Open Daily: 11:00 AM - 11:00 PM" },
  { id: "24x7", name: "Open 24 Hours" },
  { id: "custom", name: "Custom Timings" },
];

export const STOCK_OPTIONS: BusinessCategory[] = [
  { id: "in-stock", name: "In Stock" },
  { id: "out-of-stock", name: "Out of Stock" },
  { id: "pre-order", name: "Available for Pre-order" },
];

export const DAY_PRESETS: BusinessCategory[] = [
  { id: "mon-sun", name: "Mon - Sun (Every Day)" },
  { id: "mon-sat", name: "Mon - Sat" },
  { id: "mon-fri", name: "Mon - Fri" },
  { id: "mon-thu", name: "Mon - Thu" },
  { id: "tue-sat", name: "Tue - Sat" },
  { id: "wed-sun", name: "Wed - Sun" },
  { id: "monday", name: "Monday Only" },
  { id: "tuesday", name: "Tuesday Only" },
  { id: "wednesday", name: "Wednesday Only" },
  { id: "thursday", name: "Thursday Only" },
  { id: "friday", name: "Friday Only" },
  { id: "saturday", name: "Saturday Only" },
  { id: "sunday", name: "Sunday Only" },
  { id: "custom", name: "Custom Days" },
];

export const CURRENCY_SYMBOL: string = "₹";

export const BUSINESS_CAT_MOCK: BusinessCategory[] = [
  { id: "food", name: "Food" },
  { id: "homecare", name: "Home Care" },
  { id: "local-services", name: "Local Services" },
  { id: "grocery", name: "Grocery & Essentials" },
  { id: "fruits", name: "Fruits" },
  { id: "fashion", name: "Fashion & Apparel" },
  { id: "homemade", name: "Homemade Products" },
  { id: "others", name: "Others" },
];

export const SERVICE_TYPE_OPTIONS: BusinessCategory[] = [
  { id: "daily-help", name: "Daily Help" },
  { id: "professional-services", name: "Professional Services" },
];

export const DAILYHELP_CAT_MOCK: BusinessCategory[] = [
  { id: "maid", name: "Maids" },
  { id: "cook", name: "Cooks" },
  { id: "tutoring", name: "Tutors" },
  { id: "fitness", name: "Fitness Trainers" },
  { id: "driver", name: "Drivers" },
  { id: "car-cleaner", name: "Car Cleaners" },
];

export const SERVICES_CAT_MOCK: BusinessCategory[] = [
  { id: "doctors", name: "Doctors" },
  { id: "electricians", name: "Electricians" },
  { id: "tutoring", name: "Tutors" },
  { id: "lawyers", name: "Lawyers" },
];

export const UNIT_OPTIONS: BusinessCategory[] = [
  { id: "kg", name: "Kilograms (kg)" },
  { id: "g", name: "Grams (g)" },
  { id: "l", name: "Litres (L)" },
  { id: "ml", name: "Millilitres (ml)" },
  { id: "pieces", name: "Pieces" },
  { id: "dozen", name: "Dozen" },
  { id: "packets", name: "Packets" },
  { id: "other", name: "Other" },
];

export const WHOLESALE_DEALS_CAT: BusinessCategory[] = [
  { id: "grocery", name: "Grocery & Essentials" },
  { id: "fruits", name: "Fruits" },
  { id: "fashion", name: "Fashion & Apparel" },
  { id: "homemade", name: "Homemade Products" },
];

// Entity type filters for filtering pending requests
export const ENTITY_TYPE_FILTERS: BusinessCategory[] = [
  { id: "all", name: "All" },
  { id: "user", name: "Residents" },
  { id: "business", name: "Businesses" },
  { id: "service", name: "Services" },
];

export const EVENT_CANCEL_REASONS: BusinessCategory[] = [
  { id: "arrangement-issues", name: "Arrangement Issues" },
  { id: "low-int", name: "Low Interest" },
  { id: "personal-emergency", name: "Personal Emergency" },
  { id: "other", name: "Other" },
];

export const DEALS_OPTIONS: BusinessCategory[] = [
  {
    id: "cashOnDelivery",
    name: "Cash on Delivery",
    value: true,
    icon: "cash-outline",
    subtext: "Pay when you receive your order",
  },
  {
    id: "moneyBackGuarantee",
    name: "Money-Back Guarantee",
    value: false,
    icon: "shield-checkmark-outline",
    subtext: "Get a full refund if you don't receive your order",
  },
  {
    id: "testBeforeAccept",
    name: "Open-Box Delivery",
    value: false,
    icon: "cube-outline",
    subtext: "Inspect your order before accepting it",
  },
  {
    id: "freeSamples",
    name: "Free Samples Available",
    value: false,
    icon: "checkmark-done-outline",
    subtext: "Request a free sample before purchasing",
  },
];

export const STATUS_FILTERS: BusinessCategory[] = [
  { id: "pending", name: "Pending" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" },
];

export const DEALS_FILTERS: BusinessCategory[] = [
  { id: "active", name: "Active" },
  { id: "completed", name: "Completed" },
  { id: "expired", name: "Expired" },
  { id: "pending", name: "Pending Request" },
];

export const DEFAULT_REPORT_REASONS: ReportReason[] = [
  { id: "inappropriate", label: "Inappropriate Behavior" },
  { id: "no-show", label: "Didn't Show Up" },
  { id: "poor-quality", label: "Poor Quality Work" },
  { id: "fake", label: "Not a Real Service/Business" },
  { id: "other", label: "Other" },
];

export const ORDER_CATEGORIES: BusinessCategory[] = [
  { id: "event", name: "Events" },
  { id: "deals", name: "Deals" },
  { id: "business", name: "Business" },
];

export const USER_ROLES: BusinessCategory[] = [
  {
    id: "resident",
    name: "Residents",
    value: "resident",
    subtext: "All Residents Account data will be lost",
  },
  {
    id: "business",
    name: "Businesses",
    value: "business",
    subtext: "All Businesses and deals related data will be lost",
  },
  {
    id: "guest",
    name: "Guests",
    value: "guest",
    subtext: "Limited access with no data storage",
  },
];
