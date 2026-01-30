import "server-only";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        // When running in Vercel/Cloud environments, it can pick up GOOGLE_APPLICATION_CREDENTIALS
        // or for simple public data access, basic init might suffice if permissions allow.
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

const db = admin.firestore();

export type UserProfile = {
    userId: string;
    displayName: string;
    bio: string;
    logoUrl: string;
    contactEmail: string;
    trafficStats: {
        monthlyViews: number;
        audience: string;
    };
    availableSlots: Array<{
        id: string;
        name: string;
        format: string;
        price: number;
        description?: string;
    }>;
    themeColor?: string;
    updatedAt?: any;
};

export async function getUserProfileServer(userId: string): Promise<UserProfile | null> {
    try {
        const docRef = db.collection("profiles").doc(userId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return docSnap.data() as UserProfile;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching profile on server:", error);
        return null;
    }
}
