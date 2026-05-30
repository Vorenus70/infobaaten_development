// script to send notifications to all subsribers
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// ========== CONFIGURATION ==========
// Your Supabase credentials (from project settings → API)
const SUPABASE_URL = 'https://pcvfwioshtxuctjcgkrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdmZ3aW9zaHR4dWN0amNna3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE5NTgsImV4cCI6MjA5NDYxNzk1OH0.5OydO9ELHHwVWMp4gbSDSIXx-wAE4pB8F8H0ivDVXB4';

// Your VAPID keys
const VAPID_PUBLIC_KEY = 'BH4O1gp4MkNjuT-SnMa3rQ3n8kp67QHYvhpY0i94tSV-digb0FOptai4JGbvb4BiCvfTTDci0igHq0oFhBap_IA';
const VAPID_PRIVATE_KEY = 'FANF1ONABZfLHjruDm03zW1ichQJNJajwqyiuwCFHq0';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Set VAPID details
webpush.setVapidDetails(
    'mailto:post@infobaaten.no',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// Notification payload
const payload = JSON.stringify({
    title: '🧪 Testvarsel fra InfoBåten',
    body: 'Dette er en test! Push varsler fungerer 🚤',
    icon: '/app/icons/icon-192.png',
    badge: '/app/icons/icon-32.png'
});

// Send to all subscribers
async function sendToAllSubscribers() {
    console.log('📡 Fetching subscriptions from Supabase...');
    
    const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*');
    
    if (error) {
        console.error('❌ Supabase error:', error);
        return;
    }
    
    console.log(`📋 Found ${subscriptions.length} subscription(s)`);
    
    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: sub.keys
            }, payload);
            console.log(`✅ Sent to: ${sub.endpoint.substring(0, 50)}...`);
        } catch (err) {
            if (err.statusCode === 410) {
                // Subscription expired – remove from database
                await supabase.from('subscriptions').delete().eq('id', sub.id);
                console.log(`🗑️ Removed expired subscription (id: ${sub.id})`);
            } else {
                console.error(`❌ Failed to send to ${sub.id}:`, err.message);
            }
        }
    }
    
    console.log('🎉 Done!');
}

// Run the script
sendToAllSubscribers();

//locate file on comptuer (cmd).  modify payload.  type ; node send-notifications.js

******************************************************************************************************************'




const webpush = require('web-push');

// Your VAPID keys (replace with your actual keys)
const vapidKeys = {
    publicKey: 'BH4O1gp4MkNjuT-SnMa3rQ3n8kp67QHYvhpY0i94tSV-digb0FOptai4JGbvb4BiCvfTTDci0igHq0oFhBap_IA',
    privateKey: 'FANF1ONABZfLHjruDm03zW1ichQJNJajwqyiuwCFHq0'  // ← Replace with your private key
};

webpush.setVapidDetails(
    'mailto:post@infobaaten.no',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// One of the subscriptions from your Supabase table
// Get this from Supabase dashboard → subscriptions table
const subscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/cwBrcatW8pE:APA91bGyTMiXMCIxRhnOqr-tnWUXIHLeie2bm4M2NqDHV3xtAdomN5-nRg67CXQjLX6mHJjv2J0Gz9FGyYvP_KPOomROSNPwVaY1ge5ai8UpWwDJoJl_LIocMpx_TQNVFIdQj01FCjMH',
    keys: {
        p256dh: 'BLtKxlbYQPEnJtvi-FXhr2SWuYSVzNWc8Vx53PW7c0MrvMfz2n7Z90hgG6r12v4aKlR9B58fQpq6ZBAhYKOl2XY',
        auth: '_S-WmC_YPfkDCV5MB_UBvw'
    }
};

const payload = JSON.stringify({
    title: '🧪 Testvarsel fra InfoBåten',
    body: 'Dette er en test! Push varsler fungerer 🚤',
    icon: '/app/icons/icon-192.png',
    badge: '/app/icons/icon-32.png'
});

webpush.sendNotification(subscription, payload)
    .then(() => console.log('✅ Notification sent!'))
    .catch(err => console.error('❌ Error:', err));
