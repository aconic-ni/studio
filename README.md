# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Firebase Setup

This project uses Firebase for Authentication and Firestore as a database.

### Environment Variables

Ensure you have a `.env.local` file in the root of your project with your Firebase project configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

### Firestore Security Rules

A basic set of Firestore security rules is provided in `firestore.rules`. You **MUST** deploy these rules to your Firebase project to secure your data.

**To deploy Firestore rules:**

1.  Install the Firebase CLI if you haven't already: `npm install -g firebase-tools`
2.  Login to Firebase: `firebase login`
3.  Select your Firebase project: `firebase use --add` (and select your project from the list)
4.  Deploy the rules: `firebase deploy --only firestore:rules`

**Important:** The provided `firestore.rules` are a starting point. Review and customize them thoroughly to match your application's specific security needs and data access patterns. For production applications, consider using Firebase Custom Claims for user roles instead of reading user documents within security rules, as this can be more performant and cost-effective.
