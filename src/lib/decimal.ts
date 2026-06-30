// Single import point for the big-number type. break-infinity.js stores numbers
// as { mantissa, exponent } and supports values far beyond Number.MAX_SAFE_INTEGER,
// which clicker scores routinely exceed.
import Decimal from "break_infinity.js";

export { Decimal };
export type { Decimal as DecimalType };
