export interface StoryListItem {
  id: string;
  title: string;
  word_count: number;
  sort_order: number;
  updated_at: string;
}

export interface Story {
  id: string;
  character_id: string;
  title: string;
  content: string;
  word_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StoryCreate {
  title: string;
  content?: string;
}

export interface StoryUpdate {
  title?: string;
  content?: string;
  sort_order?: number;
}