/**
 * Menu Hamburger — Gestion du menu mobile/tablette en slider
 *
 * Fonctionnalités :
 * - Ouvre/ferme le menu slider au clic du bouton hamburger
 * - Ferme le menu au clic sur l'overlay
 * - Ferme le menu au clic sur un lien de navigation
 * - Animation hamburger → X
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    const navOverlay = document.querySelector('.nav-overlay');
    const navLinks = document.querySelectorAll('.main-nav a');

    if (!navToggle || !mainNav) {
      console.warn('[Menu] Bouton hamburger ou navigation introuvable');
      return;
    }

    /**
     * Ouvre le menu
     */
    function openMenu() {
      mainNav.classList.add('open');
      navToggle.classList.add('active');
      if (navOverlay) {
        navOverlay.classList.add('show');
      }
      // Empêche le scroll du body quand le menu est ouvert
      document.body.style.overflow = 'hidden';
    }

    /**
     * Ferme le menu
     */
    function closeMenu() {
      mainNav.classList.remove('open');
      navToggle.classList.remove('active');
      if (navOverlay) {
        navOverlay.classList.remove('show');
      }
      // Réactive le scroll du body
      document.body.style.overflow = '';
    }

    /**
     * Toggle menu (ouvre/ferme)
     */
    function toggleMenu() {
      if (mainNav.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    // Écoute le clic sur le bouton hamburger
    navToggle.addEventListener('click', toggleMenu);

    // Écoute le clic sur l'overlay (ferme le menu)
    if (navOverlay) {
      navOverlay.addEventListener('click', closeMenu);
    }

    // Ferme le menu au clic sur un lien de navigation
    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Ferme le menu si on redimensionne la fenêtre au-delà de 1024px (desktop)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && mainNav.classList.contains('open')) {
        closeMenu();
      }
    });

    console.log('[Menu] Menu hamburger initialisé');
  });
})();
