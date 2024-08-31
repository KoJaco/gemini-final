import refreshFirebaseToken from "@/lib/firebase/utils/refresh-firebase-token";

import type { PlasmoMessaging } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";

const fetchUserData = async (
    token,
    uid,
    refreshToken,
    storage,
    retry = true
) => {
    // TODO: Add firebase_project_id
    const response = await fetch(
        "https://firestore.googleapis.com/v1/projects/<firebase_project_id>/databases/(default)/documents/users/" +
            uid,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );

    const responseData = await response.json();

    if (responseData?.error?.code === 401 && retry) {
        const refreshData = await refreshFirebaseToken(refreshToken);
        await storage.set("firebaseToken", refreshData.id_token);
        await storage.set("firebaseRefreshToken", refreshData.refresh_token);
        await storage.set("firebaseUid", refreshData.user_id);

        // Retry request after refreshing token
        return fetchUserData(
            refreshData.id_token,
            uid,
            refreshData.refresh_token,
            storage,
            false
        );
    }

    return responseData;
};

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    try {
        const storage = new Storage();

        const token = await storage.get("firebaseToken");
        const uid = await storage.get("firebaseUid");
        const refreshToken = await storage.get("firebaseRefreshToken");

        const userData = await fetchUserData(token, uid, refreshToken, storage);

        res.send({
            status: "success",
            data: userData
        });
    } catch (err) {
        console.log("There was an error");
        console.error(err);
        res.send({ err });
    }
};

export default handler;
