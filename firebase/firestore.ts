
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.config";

export type AdRecord = {
    userId: string;
    campaign: string;
    placement: string;
    type: string; // e.g., 'push-expandable'
    zipUrl: string;
    assets: {
        collapsed: string;
        expanded: string;
    };
    htmlUrl?: string; // If we upload the index.html separately for direct embedding
    settings: any;
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
