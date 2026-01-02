/**
 * Reviews Slider — Carrousel de témoignages (page d'accueil)
 *
 * Utilise scroll-snap natif (pas de librairie)
 * Gère le fallback si l'API échoue
 * Crée les indicateurs dots
 *
 * @version 1.1.0 - Ajout dates relatives (2026-01-02)
 */

(function() {
  'use strict';

  const SLIDER_CONTAINER_ID = 'reviewsSlider';
  const DOTS_CONTAINER_ID = 'sliderDots';
  const MAX_REVIEWS_DISPLAYED = 10; // Limite d'affichage

  /**
   * Initialise le slider au chargement de la page
   */
  document.addEventListener('DOMContentLoaded', async () => {
    const sliderContainer = document.getElementById(SLIDER_CONTAINER_ID);
    const dotsContainer = document.getElementById(DOTS_CONTAINER_ID);

    if (!sliderContainer) {
      console.warn('[Slider] Conteneur #reviewsSlider introuvable (page non-accueil)');
      return;
    }

    try {
      console.log('[Slider] Chargement des témoignages...');

      // Appel API via le module api.js
      const reviews = await window.API.fetchReviews();

      // Vider le fallback initial
      sliderContainer.innerHTML = '';

      if (reviews.length === 0) {
        // Aucun avis → affiche un message
        displayNoReviews(sliderContainer);
        return;
      }

      // Afficher les avis (max 10)
      const reviewsToDisplay = reviews.slice(0, MAX_REVIEWS_DISPLAYED);
      reviewsToDisplay.forEach(review => {
        const card = createReviewCard(review);
        sliderContainer.appendChild(card);
      });

      // Créer les dots (indicateurs)
      if (dotsContainer && reviewsToDisplay.length > 1) {
        createDots(dotsContainer, reviewsToDisplay.length, sliderContainer);
      }

      console.log(`[Slider] ${reviewsToDisplay.length} témoignages affichés`);
    } catch (error) {
      console.error('[Slider] Erreur chargement :', error);

      // Afficher le fallback en cas d'erreur
      displayFallback(sliderContainer);
    }
  });

  /**
   * Crée une card de témoignage (HTML)
   */
  function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';

    // Génère les étoiles
    const stars = createStars(review.rating);

    // Formater la date relative
    const relativeDate = formatRelativeDate(review.approvedAt);
    const dateText = relativeDate ? ` (${relativeDate})` : '';

    card.innerHTML = `
      <div class="review-rating">
        ${stars}
      </div>
      <p class="review-message">${escapeHTML(review.message)}</p>
      <div class="review-author">
        <span class="review-author-name" style="font-style: italic; color: var(--color-secondary-1);">${escapeHTML(review.name)}${dateText}</span>
      </div>
    `;

    return card;
  }

  /**
   * Génère les étoiles HTML selon la note
   */
  function createStars(rating) {
    const filled = Math.max(0, Math.min(5, rating)); // Entre 0 et 5
    let stars = '';

    for (let i = 1; i <= 5; i++) {
      if (i <= filled) {
        stars += '<span class="star star-filled"></span>';
      } else {
        stars += '<span class="star star-empty"></span>';
      }
    }

    return stars;
  }

  /**
   * Affiche un message si aucun avis
   */
  function displayNoReviews(container) {
    container.innerHTML = `
      <div class="review-card-fallback">
        <strong>Aucun témoignage pour le moment</strong>
        <p>Soyez le premier à partager votre expérience !</p>
        <a href="laisser-un-avis.html" class="btn btn-primary mt-sm">Laisser un avis</a>
      </div>
    `;
  }

  /**
   * Affiche le fallback si l'API échoue
   */
  function displayFallback(container) {
    container.innerHTML = `
      <div class="review-card-fallback">
        <strong>Témoignages indisponibles pour le moment</strong>
        <p>Veuillez réessayer plus tard ou consulter la page <a href="avis.html" style="text-decoration: underline; color: var(--color-accent-3);">Témoignages</a>.</p>
      </div>
    `;
  }

  /**
   * Crée les dots (indicateurs) sous le slider
   */
  function createDots(dotsContainer, count, sliderContainer) {
    dotsContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'slider-dot';
      dot.setAttribute('aria-label', `Aller au témoignage ${i + 1}`);

      // Au clic, scroll vers la card correspondante
      dot.addEventListener('click', () => {
        const cards = sliderContainer.querySelectorAll('.review-card');
        if (cards[i]) {
          cards[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        }
      });

      dotsContainer.appendChild(dot);
    }

    // Active le premier dot par défaut
    updateActiveDot(dotsContainer, 0);

    // Observer le scroll pour mettre à jour le dot actif
    observeSliderScroll(sliderContainer, dotsContainer);
  }

  /**
   * Met à jour le dot actif
   */
  function updateActiveDot(dotsContainer, index) {
    const dots = dotsContainer.querySelectorAll('.slider-dot');
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  /**
   * Observer le scroll pour détecter quelle card est visible
   * (optionnel, amélioration UX)
   */
  function observeSliderScroll(sliderContainer, dotsContainer) {
    let scrollTimeout;

    sliderContainer.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        // Détecte la card la plus visible
        const cards = sliderContainer.querySelectorAll('.review-card');
        const containerRect = sliderContainer.getBoundingClientRect();

        let closestIndex = 0;
        let closestDistance = Infinity;

        cards.forEach((card, index) => {
          const cardRect = card.getBoundingClientRect();
          const distance = Math.abs(cardRect.left - containerRect.left);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        updateActiveDot(dotsContainer, closestIndex);
      }, 100); // Debounce
    });
  }

  /**
   * Formate une date en référence temporelle relative
   * @param {string} dateString - Date ISO (ex: "2026-01-02T17:10:40.372Z")
   * @returns {string} Référence relative (ex: "Aujourd'hui", "Il y a 3 jours")
   */
  function formatRelativeDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();

    // Calculer la différence en millisecondes
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffYears = Math.floor(diffDays / 365);

    // Aujourd'hui (même jour calendaire)
    if (diffDays === 0) {
      return 'Aujourd\'hui';
    }

    // Hier (jour calendaire précédent)
    if (diffDays === 1) {
      return 'Hier';
    }

    // Il y a X jours (< 7 jours)
    if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }

    // Il y a X semaines (< 52 semaines)
    if (diffWeeks < 52) {
      return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
    }

    // Il y a 1 an
    if (diffYears === 1) {
      return 'Il y a 1 an';
    }

    // Il y a X ans
    return `Il y a ${diffYears} ans`;
  }

  /**
   * Fonction d'échappement HTML (sécurité XSS)
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  console.log('[Slider] Module chargé');
})();
