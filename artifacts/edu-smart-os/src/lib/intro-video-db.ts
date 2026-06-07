import Dexie, { type Table } from "dexie";

export interface VideoRecord {
  id: string;
  blob: Blob;
  filename: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
}

class IntroVideoDB extends Dexie {
  videos!: Table<VideoRecord>;

  constructor() {
    super("furqan_intro_video_db");
    this.version(1).stores({
      videos: "id, uploaded_at",
    });
  }
}

const videoDB = new IntroVideoDB();

export async function saveVideoToIndexedDB(file: File): Promise<void> {
  await videoDB.videos.put({
    id: "main",
    blob: file,
    filename: file.name,
    size: file.size,
    mime_type: file.type || "video/mp4",
    uploaded_at: new Date().toISOString(),
  });
}

export async function getVideoFromIndexedDB(): Promise<VideoRecord | null> {
  try {
    const record = await videoDB.videos.get("main");
    return record ?? null;
  } catch {
    return null;
  }
}

export async function deleteVideoFromIndexedDB(): Promise<void> {
  await videoDB.videos.delete("main");
}

export async function getVideoBlobUrl(): Promise<string | null> {
  const record = await getVideoFromIndexedDB();
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}
