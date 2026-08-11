export const AUTH_PAGE = {
    headerTitle: "Welcome to HomeConnect",
    subTitle: "Your gateway to seamless community living",
    otpScreenTitle: "Get Started",
    loginTitle: "Login with mobile number to proceed further",
    loginPlaceholder: "Enter your mobile number",
    loginOTPCta: "Submit",
    otpTitle: "Enter the OTP sent to your mobile",
    resendOtp: "Resend OTP",
    resendOtpAfter: "Resend OTP after",
    changeNumber: "Change Number",
    sec: "sec",
    verify: "Verify",
    OTP_LENGTH: 6,
    RESEND_SECONDS: 60,
};

export const ANIMATION_DURATION = 350;

export const LOGIN_PAGE_IMAGE_URL = "https://images.pexels.com/photos/221540/pexels-photo-221540.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

// Auth brand colors (from the Terrace reference design)
export const TERRACE_COLORS = {
  screenBg: "#F9F4F1",
  green: "#2E9E5B",
  greenTint: "#E7F5EC",
  blue: "#2F80ED",
  blueTint: "#E8F1FE",
  orange: "#EA580C",
  orangeTint: "#FDEDE1",
  textDark: "#1F2430",
  textMuted: "#6B7280",
  inputBorder: "#E5E1D8",
};

// Feature columns rendered on the login (landing) screen.
// `lib` selects the icon family: "ion" = Ionicons, "mci" = MaterialCommunityIcons.
export const TERRACE_FEATURES = [
  {
    key: "share",
    lib: "ion" as const,
    icon: "chatbubbles" as const,
    title: "Share",
    color: TERRACE_COLORS.green,
    tint: TERRACE_COLORS.greenTint,
    desc: "Share moments, ideas and vibes with neighbours.",
  },
  {
    key: "care",
    lib: "mci" as const,
    icon: "hand-heart" as const,
    title: "Care",
    color: TERRACE_COLORS.blue,
    tint: TERRACE_COLORS.blueTint,
    desc: "Support each other, get help and recommend trusted services.",
  },
  {
    key: "fair",
    lib: "ion" as const,
    icon: "pricetag" as const,
    title: "Fair",
    color: TERRACE_COLORS.orange,
    tint: TERRACE_COLORS.orangeTint,
    desc: "Unlock great deals, buy or sell together and save more.",
  },
];

export const TERRACE_AUTH = {
  brand: "TERRACE",
  tagline: [
    { label: "Share", color: TERRACE_COLORS.green },
    { label: "Care", color: TERRACE_COLORS.blue },
    { label: "Fair", color: TERRACE_COLORS.orange },
  ],

  // Login / landing
  headlinePre: "A stronger community makes everyday ",
  headlineAccent: "better.",
  subtitle:
    "Terrace is your community platform to share, support and unlock great deals together.",
  loginImage:
    "https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&cs=tinysrgb&w=1200",
  getStartedTitle: "Let's get started",
  getStartedSubtitle: "Enter your phone number to continue",
  countryFlag: "🇮🇳",
  countryCode: "+91",
  phonePlaceholder: "Enter your phone number",
  continueWithPhone: "Continue",
  acceptPre: "I accept the ",
  acceptLink: "Terms and Conditions",
  safeFooter: "Safe. Verified. For your community.",

  // OTP
  otpTitle: "Verify your phone number",
  otpSentPre: "We've sent a 6-digit OTP to",
  otpImage:
    "https://images.pexels.com/photos/3771830/pexels-photo-3771830.jpeg?auto=compress&cs=tinysrgb&w=1200",
  continue: "Continue",
  didntReceive: "Didn't receive OTP?",
  resendIn: "Resend in",
  resendCta: "Resend OTP",
  otpResentToast: "A new OTP has been sent",

  // Terms bottom sheet
  termsTitle: "Terms & Conditions",
  iAgree: "I Agree",

  // Validation messages
  invalidMobile: "Please enter a valid 10-digit mobile number",
  checkTerms: "Please check Terms & Conditions",
  invalidOtp: "Incorrect OTP. Please try again.",
  verifiedToast: "Phone verified successfully",
  otpSendFailed: "Failed to send OTP. Please try again.",
  otpVerifyFailed: "Failed to verify OTP. Please try again.",

  // Mock auth
  MOCK_OTP: "123456",
  RESEND_SECONDS: 28,
};

// Location permission screen
export const LOCATION_SCREEN = {
  title: "Allow location access",
  subtitle:
    "This helps us verify your society and keep your community safe and trusted.",
  allow: "Allow Location",
  notNow: "Not Now",
  footer: "You can change this anytime in settings.",
  deniedToast: "Location permission denied",
  savedToast: "Location saved",
  errorToast: "Could not fetch location. Please try again.",
  STORAGE_KEY: "user-location",
};

// Select Society screen
export const SELECT_SOCIETY_SCREEN = {
  title: "Select your society",
  subtitle: "We'll use this to verify you and keep your community safe.",
  yourLocation: "Your location",
  defaultAddress: "Charholi Budruk, Pune 412105",
  change: "Change",
  or: "or",
  enterManually: "Enter location manually",
  activeSocieties: "Active societies in your area",
  cantFindTitle: "Can't find your society?",
  cantFindSub: "Contact your society admin to get it added.",
  footer: "Safe. Verified. For your community.",
  manualToast: "Manual location entry coming soon",
  cantFindToast: "Please contact your society admin to get it added",
};

// User type selection screen
export const USER_TYPE_SCREEN = {
  title: "How will you use Terrace?",
  subtitle:
    "We verify every resident and business to keep your community safe and trusted.",
  secureNote: "Your information is secure and used only for verification.",
  continue: "Continue",
  comingSoonToast: "Business flow is coming soon",
  options: [
    {
      key: "resident",
      label: "As a Resident",
      lib: "ion" as const,
      icon: "home" as const,
      color: TERRACE_COLORS.orange,
      tint: TERRACE_COLORS.orangeTint,
      enabled: true,
    },
    {
      key: "business",
      label: "As a Business",
      lib: "ion" as const,
      icon: "storefront" as const,
      color: TERRACE_COLORS.blue,
      tint: TERRACE_COLORS.blueTint,
      enabled: false,
    },
    {
      key: "both",
      label: "Both Resident & Business",
      lib: "ion" as const,
      icon: "people" as const,
      color: "#6B7280",
      tint: "#EEF0F2",
      enabled: false,
    },
  ],
};

export const TERMS_BODY =
  "Welcome to Terrace. By creating an account and using our services, you agree to the following terms and conditions. Please read them carefully.\n\n" +
  "1. Community Guidelines\nTerrace is a community platform built on trust and respect. You agree to interact with your neighbours courteously, to share content that is truthful, and to refrain from posting anything unlawful, abusive, or misleading.\n\n" +
  "2. Account & Verification\nYou are responsible for the accuracy of the mobile number and profile details you provide. Verification helps keep the community safe. You agree not to impersonate any person or misrepresent your identity or address.\n\n" +
  "3. Deals & Transactions\nTerrace may let you discover and participate in group deals and marketplace listings. Terrace acts as a platform only and is not a party to transactions between members. Always exercise your own judgement before buying or selling.\n\n" +
  "4. Privacy\nWe collect and process limited personal information to operate the service, as described in our Privacy Policy. Your phone number is used to verify your account and to enable community features.\n\n" +
  "5. Content Ownership\nYou retain ownership of the content you post, but grant Terrace a licence to display and distribute it within the app for the purpose of running the community.\n\n" +
  "6. Prohibited Conduct\nYou agree not to misuse the platform, attempt to gain unauthorised access, disrupt the service, or use it for spam or fraudulent activity.\n\n" +
  "7. Changes to Terms\nWe may update these terms from time to time. Continued use of Terrace after changes take effect constitutes acceptance of the revised terms.\n\n" +
  "By tapping \"I Agree\", you confirm that you have read, understood, and accepted these Terms & Conditions.";