
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { initializePretest } from '../__test__/setup/globalSetup';

(async () => {
    try {
        await initializePretest();
        console.log('✅ Test users setup complete.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error setting up test users:', e);
        process.exit(1);
    }
})(); 