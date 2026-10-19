export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  auth_user_id: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  video_url: string;
  cover_url: string;
  caption: string;
  music: string;
  views: number;
  created_at: string;
  profile?: Profile;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
  gift_count?: number;
}

export interface Comment {
  id: string;
  user_id: string;
  video_id: string;
  text: string;
  created_at: string;
  profile?: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  coins: number;
  total_earned: number;
  total_withdrawn: number;
  last_bonus_claim: string | null;
  created_at: string;
}

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  coin_value: number;
  color: string;
}

export interface VideoGift {
  id: string;
  sender_id: string;
  receiver_id: string;
  video_id: string;
  gift_id: string;
  coins: number;
  created_at: string;
  gift?: Gift;
  sender?: Profile;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount_coins: number;
  amount_usd: string;
  status: string;
  method: string;
  details: string;
  created_at: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cta_url: string;
  cta_label: string;
  sponsor: string;
  gradient: string;
}

export type FeedItem =
  | { type: 'video'; data: Video }
  | { type: 'ad'; data: Ad };
