import RateLimiter from "@/lib/rate-limiter";

describe("RateLimiter", () => {
    it("Should allow a call if below the limit", () => {
        const rateLimiter = new RateLimiter(2, 1000);
        expect(rateLimiter.canProceed()).toBe(true);
    });

    it("Should not allow a call if the limit is exceeded", () => {
        const rateLimiter = new RateLimiter(1, 1000);
        expect(rateLimiter.canProceed()).toBe(true);
        expect(rateLimiter.canProceed()).toBe(false);
    });

    it("should reset the limit after the interval", (done) => {
        const rateLimiter = new RateLimiter(1, 500);
        rateLimiter.canProceed();

        setTimeout(() => {
            expect(rateLimiter.canProceed()).toBe(true); // should proceed after interval yeah
            done();
        }, 501); // edgy edgy
    });

    it("Should call the function if below the limit", async () => {
        const rateLimiter = new RateLimiter(2, 1000);
        const mockFn = jest.fn().mockResolvedValue("success");
        const result = await rateLimiter.call(mockFn);

        expect(result).toBe("success");
        expect(mockFn).toHaveBeenCalled();
    });

    it("Should throw an error if the limit is exceeded", async () => {
        const rateLimiter = new RateLimiter(1, 1000);
        const mockFn = jest.fn().mockResolvedValue("success");
        await rateLimiter.call(mockFn);
        await expect(rateLimiter.call(mockFn)).rejects.toThrow(
            "Rate limit exceeded. Please try again later."
        );
    });
});
