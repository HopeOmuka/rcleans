/* eslint-disable import/no-duplicates */
import google from "@/assets/icons/google.png";
import getStarted from "@/assets/images/signup-banner.png";
import onboarding1 from "@/assets/images/slide1.png";
import onboarding2 from "@/assets/images/slide2.png";
import onboarding3 from "@/assets/images/slide3.png";
import signUpCar from "@/assets/images/signup-banner.png";
import logo from "@/assets/images/icon.png";

export const images = {
  logo,
  onboarding1,
  onboarding2,
  onboarding3,
  getStarted,
  signUpCar,
};

export const icons = {
  arrowDown: "arrow-down",
  arrowUp: "arrow-up",
  backArrow: "chevron-left",
  chat: "chat",
  checkmark: "check-lg",
  cleaning: "house-fill",
  close: "x-lg",
  dollar: "currency-dollar",
  email: "envelope",
  eyecross: "eye-slash",
  google,
  home: "house",
  list: "list-ul",
  lock: "lock",
  map: "map-fill",
  marker: "geo-alt-fill",
  out: "box-arrow-right",
  person: "person",
  pin: "geo-alt",
  point: "geo-alt",
  profile: "person",
  search: "search",
  selectedMarker: "pin-map-fill",
  star: "star",
  target: "crosshair",
  to: "geo-alt",
  calendar: "calendar",
  phone: "telephone-fill",
  settings: "gear-fill",
} as const satisfies Record<string, string | typeof google>;

export const onboarding = [
  {
    id: 1,
    title: "Professional cleaning at your fingertips!",
    description:
      "Your clean home or office is just a tap away with RCleans. Find trusted cleaners instantly.",
    image: images.onboarding1,
  },
  {
    id: 2,
    title: "Verified cleaners, spotless results",
    description:
      "Connect with vetted, professional cleaners for home, office, and deep cleaning services.",
    image: images.onboarding2,
  },
  {
    id: 3,
    title: "Clean when you need it. Your way!",
    description:
      "Schedule instant cleaning or book ahead. Track your cleaner in real-time.",
    image: images.onboarding3,
  },
];

export const data = {
  onboarding,
};
