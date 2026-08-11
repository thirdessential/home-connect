export const COMMON_CONSTANTS = {
    APP_NAME: "HomeConnect",
    CONTINUE_GUEST: "Continue as a guest",
    HOME: "Home",
    CANCEL: "Cancel",
    CURRENCY: "₹",
    OK: "OK",
    NO: "No",
    YES: "Yes",
    EDIT: "Edit",
    REMOVE: "Remove",
    REGISTER: "Register",
    LOADING: "Loading...",
    BUSINESS: "Deals",
    DIRECTORY: "Directory",
    PROFILE: "Profile",
    GET_STARTED: "Get Started",
    ANONYMOUS_USER: "Anonymous User",
    LOADING_MESSAGE: "Loading, please wait...",
    SELECT_SOCIETY_TITLE: "Select Your Society",
    SEARCH_SOCIETY_PLACEHOLDER: "Search by society name or locality",
    ADDRESS_NOT_AVAILABLE: "Address not available",
    VERIFICATION_PENDING: "Verification Pending",
    WAIT_FOR_ADMIN_APPROVAL: "Please wait for admin approval",
    CONTACT_SUPPORT_REJECTION: "Your account has been rejected by the admin... Contact Support",
    VERIFICATION_MESSAGE: `Your account is Pending for approval. You&apos;ll be able to like
              and comment once your verification is approved.`,
    REJECTION_MESSAGE: `Your account is rejected by the admin. You&apos;ll be able to like
              and comment once your verification is approved.`,
    JOIN_OUR_COMMUNITY: "Join our Community to unlock more features",
    CONFIRM_YOUR_LOCATION: "Confirm Your Location",
    REGISTRATION_REQUIRED: "Registration Required",
    REGISTER_AS_RESIDENT: "You need to register as a resident to access the directory.",
    SEND_REMINDER: "Send Reminder",
    SEND_REMINDER_ADMIN: "Send Reminder to Admin",
    ACCOUNT_REJECTED: "Your Account is Rejected",
};

// Per-user business creation limits — increase this value to raise the cap
export const BUSINESS_LIMITS = {
    MAX_BUSINESSES_PER_USER: 1,
} as const;

export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const PHONE_COUNTRY_CODE = {
    IN: "+91",
    US: "+1",
    UK: "+44",
    // Add more country codes as needed
} as const;