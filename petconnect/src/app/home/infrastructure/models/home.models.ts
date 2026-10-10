// Model classes for Home Page

export class User {
  name: string;
  avatar: string;
  username?: string;
  userId: string;

  constructor(data: {
    name: string;
    avatar: string;
    username?: string;
    userId: string;
  }) {
    this.name = data.name;
    this.avatar = data.avatar;
    this.username = data.username;
    this.userId = data.userId;
  }
}

export class Story {
  id: string;
  user: User;
  seen: boolean;

  constructor(data: {
    id: string;
    user: User;
    seen: boolean;
  }) {
    this.id = data.id;
    this.user = data.user;
    this.seen = data.seen;
  }
}

export class Post {
  id: string;
  user: User;
  timestamp: Date;
  image: string;
  likes: number;
  comments: number;
  caption: string;
  liked: boolean;
  saved: boolean;
  likeAvatars?: string[];

  constructor(data: {
    id: string;
    user: User;
    timestamp: Date;
    image: string;
    likes: number;
    comments: number;
    caption: string;
    liked?: boolean;
    saved?: boolean;
    likeAvatars?: string[];
  }) {
    this.id = data.id;
    this.user = data.user;
    this.timestamp = data.timestamp;
    this.image = data.image;
    this.likes = data.likes;
    this.comments = data.comments;
    this.caption = data.caption;
    this.liked = data.liked || false;
    this.saved = data.saved || false;
    this.likeAvatars = data.likeAvatars;
  }
}

export class Suggestion {
  name: string;
  username: string;
  avatar: string;
  followers: string;
  userId: string;
  isFollowing?: boolean;

  constructor(data: {
    name: string;
    username: string;
    avatar: string;
    followers: string;
    userId: string;
    isFollowing?: boolean;
  }) {
    this.name = data.name;
    this.username = data.username;
    this.avatar = data.avatar;
    this.followers = data.followers;
    this.userId = data.userId;
    this.isFollowing = data.isFollowing || false;
  }
}

export class PromoItem {
  id: string;
  type: 'marketplace' | 'service' | 'adoption';
  title: string;
  description: string;
  image: string;
  link: string;
  tag?: string;

  constructor(data: {
    id: string;
    type: 'marketplace' | 'service' | 'adoption';
    title: string;
    description: string;
    image: string;
    link: string;
    tag?: string;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.title = data.title;
    this.description = data.description;
    this.image = data.image;
    this.link = data.link;
    this.tag = data.tag;
  }
}

export class VetService {
  id: string;
  title: string;
  description: string;
  icon: string;

  constructor(data: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.icon = data.icon;
  }
}

export class Adoption {
  id: string;
  petId: string;
  name: string;
  breed: string;
  image: string;

  constructor(data: {
    id: string;
    petId: string;
    name: string;
    breed: string;
    image: string;
  }) {
    this.id = data.id;
    this.petId = data.petId;
    this.name = data.name;
    this.breed = data.breed;
    this.image = data.image;
  }
}

export class Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  unlocked: boolean;

  constructor(data: {
    id: string;
    name: string;
    description: string;
    icon: string;
    progress: number;
    total: number;
    unlocked: boolean;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.icon = data.icon;
    this.progress = data.progress;
    this.total = data.total;
    this.unlocked = data.unlocked;
  }
}

export class UserLevel {
  level: number;
  currentXp: number;
  totalXp: number;

  constructor(data: {
    level: number;
    currentXp: number;
    totalXp: number;
  }) {
    this.level = data.level;
    this.currentXp = data.currentXp;
    this.totalXp = data.totalXp;
  }
}
