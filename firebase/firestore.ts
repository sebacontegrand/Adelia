
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
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

export async function saveAdRecord(adData: AdRecord) {
    try {
        const docRef = await addDoc(collection(db, "ads"), {
            ...adData,
            createdAt: serverTimestamp(),
        });
        console.log("Document written with ID: ", docRef.id);
        return docRef.id;
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


