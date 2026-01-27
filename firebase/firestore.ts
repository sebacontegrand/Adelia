
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase.config";

export type AdRecord = {
    userId: string;
    campaign: string;
    placement: string;
    type: string; // e.g., 'push-expandable'
    zipUrl: string;
    assets: Record<string, string>;
    htmlUrl?: string; // If we upload the index.html separately for direct embedding
    settings: any;
    createdAt?: any;
};

export async function saveAdRecord(adData: AdRecord, customId?: string) {
    try {
        if (customId) {
            await setDoc(doc(db, "ads", customId), {
                ...adData,
                createdAt: serverTimestamp(),
            });
            console.log("Document written with custom ID: ", customId);
            return customId;
        } else {
            const docRef = await addDoc(collection(db, "ads"), {
                ...adData,
                createdAt: serverTimestamp(),
            });
            console.log("Document written with ID: ", docRef.id);
            return docRef.id;
        }
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

export async function getUserAds(userId: string) {
    try {
        const q = query(
            collection(db, "ads"),
            where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as (AdRecord & { id: string })[];

        // Sort client-side to avoid needing a composite index immediately
        return docs.sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tB - tA;
        });
    } catch (e) {
        console.error("Error fetching user ads: ", e);
        return [];
    }

}

export async function deleteAdRecord(adId: string) {
    try {
        await deleteDoc(doc(db, "ads", adId));
        return true;
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw e;
    }
}


export async function getAdStats(adId: string, days = 7) {
    try {
        const statsRef = collection(db, "ads", adId, "daily_stats");
        // Simple query: get all stats (in a real app, limit by date)
        // For last 7 days, we could filter by ID (since ID is YYYY-MM-DD)
        const q = query(statsRef, orderBy("__name__", "desc"));

        const querySnapshot = await getDocs(q);
        const stats = querySnapshot.docs.map(doc => ({
            date: doc.id,
            ...doc.data()
        }));

        // Return only requested days (client-side slice if needed or refine query)
        return stats.slice(0, days).reverse();
    } catch (e) {
        console.error("Error fetching stats:", e);
        return [];
    }
}
