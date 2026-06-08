/**
 * Réponse renvoyée lors d'une demande d'export RGPD des données personnelles.
 * L'export est traité de manière asynchrone : l'utilisateur reçoit ses données
 * par email dans le délai estimé.
 */
export interface DataExportResponse {
  message: string;
  estimatedDelivery: string;
}
