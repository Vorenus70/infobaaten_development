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
