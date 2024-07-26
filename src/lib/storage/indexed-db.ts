import type { ChatThread, Message } from "@/lib/types"

const DB_NAME = "ChatDB"
const DB_VERSION = 1
const THREAD_STORE = "threads"

type ResultSet = {
  success: boolean
  status: "Success" | "Error" | "Abort" | "Undefined" | "Not Found"
  message: string
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(THREAD_STORE)) {
        const store = db.createObjectStore(THREAD_STORE, {
          keyPath: "threadId"
        })
        store.createIndex("updatedAt", "updatedAt", { unique: false })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function createNewChatThread(
  thread: ChatThread
): Promise<ResultSet> {
  const db = await openDatabase()
  const transaction = db.transaction([THREAD_STORE], "readwrite")

  const threadStore = transaction.objectStore(THREAD_STORE)

  threadStore.put(thread)

  return new Promise((resolve, reject) => {
    transaction.oncomplete = function (event) {
      resolve({
        success: true,
        status: "Success",
        message: `Successfully saved thread to database. Event: ${event}`
      })
    }

    transaction.onerror = function (event) {
      reject({
        success: false,
        status: "Error",
        message: `Transaction failed. Event: ${event}`
      })
    }

    transaction.onabort = function (event) {
      reject({
        success: false,
        status: "Abort",
        message: `Transaction aborted: Event: ${event}`
      })
    }
  })
}

export async function setLatestChatThread(
  threadId: string
): Promise<ResultSet> {
  const db = await openDatabase()
  const transaction = db.transaction([THREAD_STORE], "readwrite")
  const store = transaction.objectStore(THREAD_STORE)

  const request = store.get(threadId)

  return new Promise((resolve, reject) => {
    request.onsuccess = async () => {
      const thread: ChatThread = request.result

      if (thread) {
        thread.updatedAt = new Date().toISOString()

        store.put(thread)

        transaction.oncomplete = () => {
          resolve({
            success: true,
            status: "Success",
            message: `Successfully updated thread '${threadId}' as the current thread.`
          })
        }

        transaction.onerror = (event) => {
          reject({
            success: false,
            status: "Error",
            message: `Error, transaction failed on thread '${threadId}'. Event: ${event.type}.`
          })
        }

        transaction.onabort = (event) => {
          reject({
            success: false,
            status: "Abort",
            message: `Error, transaction aborted on thread '${threadId}. Event: ${event.type}.`
          })
        }
      } else {
        resolve({
          success: false,
          status: "Not Found",
          message: "Thread not found."
        })
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function updateThread(
  threadId: string,
  newMessage: Message
): Promise<ResultSet> {
  const db = await openDatabase()
  const transaction = db.transaction([THREAD_STORE], "readwrite")
  const store = transaction.objectStore(THREAD_STORE)

  const request = store.get(threadId)

  return new Promise((resolve, reject) => {
    request.onsuccess = async () => {
      const thread: ChatThread = request.result

      if (thread) {
        thread.messages.push(newMessage)
        thread.updatedAt = new Date().toISOString()

        store.put(thread)

        transaction.oncomplete = function () {
          resolve({
            success: true,
            status: "Success",
            message: "Successfully updated thread with new message"
          })
        }

        transaction.onerror = function (event) {
          resolve({
            success: false,
            status: "Error",
            message: `Transaction failed. Event: ${event.type}`
          })
        }

        transaction.onabort = function (event) {
          resolve({
            success: false,
            status: "Abort",
            message: `Transaction aborted: Event: ${event.type}`
          })
        }
      } else {
        resolve({
          success: false,
          status: "Not Found",
          message: "Thread not found"
        })
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function getThread(
  threadId: string
): Promise<ChatThread | undefined> {
  const db = await openDatabase()
  const transaction = db.transaction([THREAD_STORE])
  const store = transaction.objectStore(THREAD_STORE)

  const request = store.get(threadId)

  return new Promise<ChatThread | undefined>((resolve, reject) => {
    request.onsuccess = () => {
      const result = request.result as ChatThread
      resolve(result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function getLatestThread(): Promise<ChatThread | undefined> {
  const db = await openDatabase()
  const transaction = db.transaction([THREAD_STORE])
  const store = transaction.objectStore(THREAD_STORE)
  const index = store.index("updatedAt")
  const request = index.openCursor(null, "prev") // descending order

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const target = event.target as IDBRequest
      const cursor = target.result
      if (cursor) {
        resolve(cursor.value as ChatThread)
      } else {
        resolve(undefined)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function getAllThreads(): Promise<ChatThread[] | undefined> {
  const db = await openDatabase()
  const transaction = db.transaction([THREAD_STORE])
  const store = transaction.objectStore(THREAD_STORE)
  const index = store.index("updatedAt")

  return new Promise((resolve, reject) => {
    const request = index.openCursor(null, "prev")
    const threads: ChatThread[] = []

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result

      if (cursor) {
        threads.push(cursor.value)
        cursor.continue()
      } else {
        resolve(threads)
      }
    }

    request.onerror = (event) => {
      reject(event)
    }
  })
}
