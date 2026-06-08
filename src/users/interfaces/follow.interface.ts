/** Résultat d'une action follow/unfollow, avec le compteur de followers à jour. */
export interface FollowResult {
  following: boolean;
  followersCount: number;
}

/** Profil public d'un utilisateur, enrichi de l'état de suivi du demandeur. */
export interface PublicProfile {
  id: number;
  first_name: string;
  last_name: string;
  followersCount: number;
  followingCount: number;
  isFollowedByMe: boolean;
}
