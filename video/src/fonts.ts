import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";

const jakarta = loadJakarta("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const roboto = loadRoboto("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export const display = jakarta.fontFamily;
export const ui = inter.fontFamily;
export const gmail = roboto.fontFamily;
