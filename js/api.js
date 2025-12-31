/**
 * API Module — Gestion des appels vers le backend Render
 *
 * Fonctionnalités :
 * - Pré-warm du backend (/healthz)
 * - Retry automatique en cas d'échec
 * - Timeout configurable
 * - Gestion des erreurs réseau
 *
 * IMPORTANT : Ce module implémente la stratégie POC "aucun avis perdu"
 */

(function() {
  'use strict';

  // Configuration API
  const API_CONFIG = {
    // URL de base du backend Render (à configurer en PROD)
    // En dev local, utiliser http://localhost:3000
    BASE_URL: getApiBaseUrl(),
    TIMEOUT: 8000,        // Timeout en ms (8s pour gérer le cold start Render)
    MAX_RETRIES: 1,       // 1 retry en cas d'échec
    PREWARM_DELAY: 500    // Délai avant le prewarm (ms)
  };

  /**
   * Détermine l'URL de base de l'API selon l'environnement
   */
  function getApiBaseUrl() {
    // En dev local
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }

    // En production (à remplacer par l'URL Render réelle)
    // Ex: 'https://adeline-ayurveda-api.onrender.com'
    return 'https://VOTRE-SERVICE.onrender.com';
  }

  /**
   * Fonction fetch avec timeout
   */
  async function fetchWithTimeout(url, options = {}, timeout = API_CONFIG.TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Timeout : le serveur met trop de temps à répondre');
      }
      throw error;
    }
  }

  /**
   * Fonction fetch avec retry
   */
  async function fetchWithRetry(url, options = {}, retries = API_CONFIG.MAX_RETRIES) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[API] Tentative ${attempt + 1}/${retries + 1} : ${url}`);
        const response = await fetchWithTimeout(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} : ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error;
        console.warn(`[API] Échec tentative ${attempt + 1} :`, error.message);

        // Pause avant retry (sauf dernier essai)
        if (attempt < retries) {
          await sleep(1000 * (attempt + 1)); // Backoff progressif : 1s, 2s, etc.
        }
      }
    }

    // Tous les retries ont échoué
    throw lastError;
  }

  /**
   * Pré-warm du backend (appel /healthz au chargement de la page)
   * Ne bloque pas le chargement, s'exécute en arrière-plan
   */
  async function prewarmBackend() {
    setTimeout(async () => {
      try {
        console.log('[API] Pré-warm du backend...');
        const response = await fetchWithTimeout(
          `${API_CONFIG.BASE_URL}/healthz`,
          { method: 'GET' },
          5000 // Timeout court pour le healthz
        );

        if (response.ok) {
          console.log('[API] Backend prêt ✓');
        }
      } catch (error) {
        console.warn('[API] Pré-warm échoué (le backend se réveillera au premier appel réel)', error.message);
      }
    }, API_CONFIG.PREWARM_DELAY);
  }

  /**
   * Récupère la liste des témoignages approuvés
   */
  async function fetchReviews() {
    try {
      const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/api/reviews`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('[API] Erreur fetchReviews :', error);
      throw new Error('Impossible de charger les témoignages');
    }
  }

  /**
   * Soumet un nouveau témoignage
   */
  async function submitReview(reviewData) {
    try {
      const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[API] Erreur submitReview :', error);
      throw new Error('Impossible d\'envoyer votre témoignage. Veuillez réessayer.');
    }
  }

  /**
   * Fonction utilitaire : pause (pour retry)
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Pré-warm automatique au chargement de la page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prewarmBackend);
  } else {
    prewarmBackend();
  }

  // Export de l'API publique
  window.API = {
    fetchReviews,
    submitReview,
    prewarmBackend
  };

  console.log('[API] Module chargé. BASE_URL :', API_CONFIG.BASE_URL);
})();
