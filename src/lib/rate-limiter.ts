class RateLimiter {
    // TODO: need some sort of client-side rate limiting... would be better to setup separate server for api calls.
    private limit: number;
    private interval: number;
    private calls: number[];

    constructor(limit, interval) {
        this.limit = limit;
        this.interval = interval;
        this.calls = [];
    }

    canProceed() {
        const now = Date.now();
        this.calls = this.calls.filter(
            (timestamp) => now - timestamp < this.interval
        );

        if (this.calls.length < this.limit) {
            this.calls.push(now);
            return true;
        } else {
            return false;
        }
    }

    async call(fn, ...args) {
        if (this.canProceed()) {
            return await fn(...args);
        } else {
            throw new Error("Rate limit exceeded. Please try again later.");
        }
    }
}

export default RateLimiter;
