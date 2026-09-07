import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("reports that the API is available", () => {
    const result = new HealthController().getHealth();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("admision-api");
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
