export const cleanRateLimt = async (fastify: any) => {
    try {
        // Clear rate limit counters 
        const redisClient = fastify.redis[fastify.config.REDIS_NAMESPACE];

        // List all keys in Redis and print them
        //  const allKeys = await redisClient.keys('*');
        // console.log('All active Redis keys:', allKeys);

        // In test environment, the @fastify/rate-limit plugin is disabled,
        // but manual rate limits (like IP-based limits) and OTP attempt tracking are still active.
        // We need to clear all rate limit and throttling related keys to prevent 429 errors between tests.
        const patterns = [
            'fastify-rate-limit-*',   // Plugin keys (shouldn't exist in tests since plugin is disabled)
            'invite:accept:ip:*',      // Manual IP-based rate limit for /invite/accept endpoint
            'invite-otp:*',            // Rate limit for /send-invite-otp endpoint
            'otpAttempts:*',           // OTP attempt tracking keys (both invite and password reset)
        ];

        let totalDeleted = 0;

        for (const pattern of patterns) {
            const keys = await redisClient.keys(pattern);
            if (keys && keys.length > 0) {
                console.log(`Active keys for pattern '${pattern}':`, keys);
                await redisClient.del(...keys);
                totalDeleted += keys.length;
                console.log(`✓ Cleared ${keys.length} keys matching '${pattern}'`);
            }
        }

        // Small delay to ensure Redis operations are fully complete
        await new Promise(resolve => setTimeout(resolve, 50));

        if (totalDeleted === 0) {
            console.log('✓ No rate limit keys to clear');
        } else {
            console.log(`✓ Total rate limit/throttle keys cleared: ${totalDeleted}`);
        }
    }
    catch (error) {
        console.error('Failed to clean rate limit:', error);
        throw error; // Re-throw to make test failures more visible
    }
}