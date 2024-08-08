import type {
    AudioData,
    ChatThread,
    Message,
    ThreadSummary
} from "@/lib/types";

const DB_NAME = "ChatDB";
const DB_VERSION = 1;
const THREAD_STORE = "threads";
const AUDIO_STORE = "audioData";
const SUMMARY_STORE = "summaries";

type ResultSet = {
    success: boolean;
    status: "Success" | "Error" | "Abort" | "Undefined" | "Not Found";
    message: string;
    data?: any;
};

export function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            // want an updatedAt index
            if (!db.objectStoreNames.contains(THREAD_STORE)) {
                const store = db.createObjectStore(THREAD_STORE, {
                    keyPath: "threadId"
                });
                store.createIndex("updatedAt", "updatedAt", { unique: false });
            }

            if (!db.objectStoreNames.contains(SUMMARY_STORE)) {
                db.createObjectStore(SUMMARY_STORE, {
                    keyPath: "threadId"
                });
            }

            if (!db.objectStoreNames.contains(AUDIO_STORE)) {
                const messageStore = db.createObjectStore(AUDIO_STORE, {
                    keyPath: "audioId"
                });
                messageStore.createIndex("messageId", "messageId", {
                    unique: false
                });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Maybe I need another store for messages...

export async function getSummaryOnThread(
    threadId: string
): Promise<ThreadSummary> {
    const db = await openDatabase();
    const transaction = db.transaction(SUMMARY_STORE, "readonly");
    const store = transaction.objectStore(SUMMARY_STORE);
    const request = store.get(threadId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.summary);
            } else {
                resolve(null);
            }
        };

        request.onerror = () => {
            reject({
                success: false,
                status: "Error",
                message: `Failed with error: ${request.error}`
            });
        };
    });
}

export async function saveSummaryToThread(
    summary: ThreadSummary,
    threadId: string
): Promise<ResultSet> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SUMMARY_STORE, "readwrite");
        const store = transaction.objectStore(SUMMARY_STORE);
        const request = store.put({ threadId, summary });

        request.onsuccess = () => {
            resolve({
                success: true,
                status: "Success",
                message: "Summary saved successfully"
            });
        };

        request.onerror = () => {
            reject({
                success: false,
                status: "Error",
                message: request.error?.message || "Failed to save summary"
            });
        };
    });
}

export async function createNewChatThread(
    thread: ChatThread
): Promise<ResultSet> {
    const db = await openDatabase();
    const transaction = db.transaction([THREAD_STORE], "readwrite");

    const threadStore = transaction.objectStore(THREAD_STORE);

    threadStore.put(thread);

    return new Promise((resolve, reject) => {
        transaction.oncomplete = function (event) {
            resolve({
                success: true,
                status: "Success",
                message: `Successfully saved thread to database. Event: ${event}`
            });
        };

        transaction.onerror = function (event) {
            reject({
                success: false,
                status: "Error",
                message: `Transaction failed. Event: ${event}`
            });
        };

        transaction.onabort = function (event) {
            reject({
                success: false,
                status: "Abort",
                message: `Transaction aborted: Event: ${event}`
            });
        };
    });
}

export async function setLatestChatThread(
    threadId: string
): Promise<ResultSet> {
    const db = await openDatabase();
    const transaction = db.transaction([THREAD_STORE], "readwrite");
    const store = transaction.objectStore(THREAD_STORE);

    const request = store.get(threadId);

    return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
            const thread: ChatThread = request.result;

            if (thread) {
                thread.updatedAt = new Date().toISOString();

                store.put(thread);

                transaction.oncomplete = () => {
                    resolve({
                        success: true,
                        status: "Success",
                        message: `Successfully updated thread '${threadId}' as the current thread.`
                    });
                };

                transaction.onerror = (event) => {
                    reject({
                        success: false,
                        status: "Error",
                        message: `Error, transaction failed on thread '${threadId}'. Event: ${event.type}.`
                    });
                };

                transaction.onabort = (event) => {
                    reject({
                        success: false,
                        status: "Abort",
                        message: `Error, transaction aborted on thread '${threadId}. Event: ${event.type}.`
                    });
                };
            } else {
                resolve({
                    success: false,
                    status: "Not Found",
                    message: "Thread not found."
                });
            }
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export async function removeThread(threadId: string): Promise<ResultSet> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            [THREAD_STORE, SUMMARY_STORE],
            "readwrite"
        );

        // Handle thread deletion
        const threadStore = transaction.objectStore(THREAD_STORE);
        const threadRequest = threadStore.delete(threadId);

        // Handle summary deletion
        const summaryStore = transaction.objectStore(SUMMARY_STORE);
        const summaryRequest = summaryStore.delete(threadId);

        threadRequest.onsuccess = () => {
            console.log(`Thread ${threadId} deleted from THREAD_STORE.`);
        };

        summaryRequest.onsuccess = () => {
            console.log(`Summary ${threadId} deleted from SUMMARY_STORE.`);
        };

        transaction.oncomplete = () => {
            resolve({
                success: true,
                status: "Success",
                message: "Thread and its summary deleted successfully"
            });
        };

        transaction.onerror = () => {
            reject({
                success: false,
                status: "Error",
                message:
                    transaction.error?.message ||
                    "Failed to delete thread and summary"
            });
        };
    });
}

// Would be better if messages were in their own store... just makes everything else a big refactor though.

// export async function updateMessageOnThread(
//     threadId: string,
//     message: Message
// ): Promise<ResultSet> {
//     const db = await openDatabase();
//     const transaction = db.transaction([THREAD_STORE], "readwrite");
//     const store = transaction.objectStore(THREAD_STORE);
// }

export async function updateThread(
    threadId: string,
    newMessage: Message,
    audioData?: AudioData
): Promise<ResultSet> {
    const db = await openDatabase();

    let transaction: IDBTransaction;
    let threadStore: IDBObjectStore;
    let audioStore: IDBObjectStore | null;

    if (audioData) {
        transaction = db.transaction([THREAD_STORE, AUDIO_STORE], "readwrite");
        threadStore = transaction.objectStore(THREAD_STORE);
        audioStore = transaction.objectStore(AUDIO_STORE);
    } else {
        transaction = db.transaction([THREAD_STORE, AUDIO_STORE], "readwrite");
        threadStore = transaction.objectStore(THREAD_STORE);
        audioStore = null;
    }

    const request = threadStore.get(threadId);

    return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
            const thread: ChatThread = request.result;

            if (thread) {
                thread.messages.push(newMessage);
                thread.updatedAt = new Date().toISOString();

                if (audioStore && audioData) {
                    // with audio
                    const messageRequest = threadStore.put(thread);
                    messageRequest.onsuccess = () => {
                        const audioRequest = audioStore.put(audioData);

                        audioRequest.onsuccess = () => {
                            transaction.oncomplete = () => {
                                resolve({
                                    success: true,
                                    status: "Success",
                                    message:
                                        "Successfully updated thread with new message and audio data"
                                });
                            };

                            transaction.onerror = (event) => {
                                resolve({
                                    success: false,
                                    status: "Error",
                                    message: `Transaction failed. Event: ${event.type}`
                                });
                            };

                            transaction.onabort = (event) => {
                                resolve({
                                    success: false,
                                    status: "Abort",
                                    message: `Transaction aborted: Event: ${event.type}`
                                });
                            };
                        };

                        audioRequest.onerror = () => {
                            reject({
                                success: false,
                                status: "Error",
                                message: `Failed to save audio data. Error: ${audioRequest.error}`
                            });
                        };
                    };

                    messageRequest.onerror = () => {
                        reject({
                            success: false,
                            status: "Error",
                            message: `Failed to update thread. Error: ${messageRequest.error}`
                        });
                    };
                } else {
                    // without audio
                    threadStore.put(thread);

                    transaction.oncomplete = function () {
                        resolve({
                            success: true,
                            status: "Success",
                            message:
                                "Successfully updated thread with new message"
                        });
                    };

                    transaction.onerror = function (event) {
                        resolve({
                            success: false,
                            status: "Error",
                            message: `Transaction failed. Event: ${event.type}`
                        });
                    };

                    transaction.onabort = function (event) {
                        resolve({
                            success: false,
                            status: "Abort",
                            message: `Transaction aborted: Event: ${event.type}`
                        });
                    };
                }
            } else {
                resolve({
                    success: false,
                    status: "Not Found",
                    message: "Thread not found"
                });
            }
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export async function getThread(
    threadId: string
): Promise<ChatThread | undefined> {
    const db = await openDatabase();
    const transaction = db.transaction([THREAD_STORE]);
    const store = transaction.objectStore(THREAD_STORE);

    const request = store.get(threadId);

    return new Promise<ChatThread | undefined>((resolve, reject) => {
        request.onsuccess = () => {
            const result = request.result as ChatThread;
            resolve(result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export async function getLatestThread(): Promise<ChatThread | undefined> {
    const db = await openDatabase();
    const transaction = db.transaction([THREAD_STORE]);
    const store = transaction.objectStore(THREAD_STORE);
    const index = store.index("updatedAt");
    const request = index.openCursor(null, "prev"); // descending order

    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const target = event.target as IDBRequest;
            const cursor = target.result;
            if (cursor) {
                resolve(cursor.value as ChatThread);
            } else {
                resolve(undefined);
            }
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export async function getAllThreads(): Promise<ChatThread[] | undefined> {
    const db = await openDatabase();
    const transaction = db.transaction([THREAD_STORE]);
    const store = transaction.objectStore(THREAD_STORE);
    const index = store.index("updatedAt");

    return new Promise((resolve, reject) => {
        const request = index.openCursor(null, "prev");
        const threads: ChatThread[] = [];
        const summaryPromises: Promise<void>[] = [];

        request.onsuccess = async (event) => {
            const cursor = (event.target as IDBRequest).result;

            if (cursor) {
                const thread = cursor.value as ChatThread;
                const summaryPromise = getSummaryOnThread(thread.threadId).then(
                    (summary) => {
                        thread.summary = summary || null;
                        threads.push(thread);
                    }
                );

                summaryPromises.push(summaryPromise);
                // threads.push(cursor.value);
                cursor.continue();
            } else {
                Promise.all(summaryPromises)
                    .then(() => {
                        resolve(threads);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            }
        };

        request.onerror = (event) => {
            reject(event);
        };
    });
}

// AUDIO stuff

export async function saveAudioData(audioData: AudioData): Promise<ResultSet> {
    const db = await openDatabase();
    const transaction = db.transaction(["audioData"], "readwrite");
    const store = transaction.objectStore("audioData");

    return new Promise((resolve, reject) => {
        const request = store.put(audioData);

        request.onsuccess = () => {
            resolve({
                success: true,
                status: "Success",
                message: "Audio data saved successfully"
            });
        };

        request.onerror = () => {
            reject({
                success: false,
                status: "Error",
                message: request.error?.message || "Failed to save audio data"
            });
        };
    });
}

export async function getAudioDataByMessageId(
    messageId: string
): Promise<AudioData | undefined> {
    const db = await openDatabase();
    const transaction = db.transaction([AUDIO_STORE], "readonly");
    const store = transaction.objectStore(AUDIO_STORE);
    const index = store.index("messageId");
    const request = index.get(messageId);

    return new Promise<AudioData | undefined>((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result as AudioData);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}
