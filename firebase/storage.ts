
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase.config";

export type UploadPathParams = {
    userId: string;
    campaign: string;
    fileName: string;
};

export async function uploadAdAsset(file: Blob | File, params: UploadPathParams): Promise<string> {
    // Sanitize paths
    const safeCampaign = params.campaign.replace(/[^a-zA-Z0-9_-]/g, "_");
    const path = `ads/${params.userId}/${safeCampaign}/${params.fileName}`;

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    return url;
}
