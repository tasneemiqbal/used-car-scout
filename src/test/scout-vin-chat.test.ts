import { describe, expect, it } from "vitest";

import { findVinInText } from "../lib/scout.vin";

describe("finding a VIN in a chat message", () => {
  it("finds a VIN pasted among other words", () => {
    expect(findVinInText("Here is the vin 1N4AL3AP9DC456789 can you check it?")).toEqual({
      vin: "1N4AL3AP9DC456789",
      checkDigitOk: true,
    });
  });

  it("uppercases a lowercase VIN", () => {
    expect(findVinInText("vin: 1n4al3ap9dc456789")?.vin).toBe("1N4AL3AP9DC456789");
  });

  it("flags a VIN with a bad check digit instead of dropping it", () => {
    expect(findVinInText("1N4AL3AP0DC456789")).toEqual({
      vin: "1N4AL3AP0DC456789",
      checkDigitOk: false,
    });
  });

  it("ignores ordinary sentences and short numbers", () => {
    expect(findVinInText("What should I ask the seller about the brakes?")).toBeNull();
    expect(findVinInText("It has 148000 miles")).toBeNull();
  });

  it("rejects 17-character tokens containing I, O or Q", () => {
    expect(findVinInText("1N4AL3AP9DC45678O")).toBeNull();
  });
});
