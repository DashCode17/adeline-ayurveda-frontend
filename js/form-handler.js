/**
 * Form Handler — Gestion du formulaire "Laisser un avis"
 *
 * Fonctionnalités :
 * - Validation côté client (avant envoi)
 * - Anti double-submit (disabled button pendant l'envoi)
 * - Gestion des erreurs API
 * - Affichage des messages de succès/erreur
 */

(function() {
  'use strict';

  const FORM_ID = 'reviewForm';
  const SUBMIT_BTN_ID = 'submitBtn';
  const SUCCESS_MESSAGE_ID = 'successMessage';
  const ERROR_MESSAGE_ID = 'errorMessageForm';
  const ERROR_TEXT_ID = 'errorText';

  /**
   * Initialise le gestionnaire de formulaire
   */
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById(FORM_ID);

    if (!form) {
      console.warn('[Form] Formulaire #reviewForm introuvable (page non-formulaire)');
      return;
    }

    console.log('[Form] Gestionnaire de formulaire initialisé');

    // Écoute la soumission du formulaire
    form.addEventListener('submit', handleFormSubmit);
  });

  /**
   * Gestion de la soumission du formulaire
   */
  async function handleFormSubmit(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    const form = event.target;
    const submitBtn = document.getElementById(SUBMIT_BTN_ID);
    const successMessage = document.getElementById(SUCCESS_MESSAGE_ID);
    const errorMessage = document.getElementById(ERROR_MESSAGE_ID);
    const errorText = document.getElementById(ERROR_TEXT_ID);

    // Masquer les messages précédents
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    // Validation côté client
    if (!validateForm(form)) {
      return; // Erreurs de validation affichées
    }

    // Récupère les données du formulaire
    const formData = getFormData(form);

    // Vérification honeypot (anti-spam)
    if (formData.website) {
      console.warn('[Form] Honeypot détecté (spam)');
      showError(errorMessage, errorText, 'Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    // Anti double-submit : désactive le bouton
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';

    try {
      console.log('[Form] Envoi du témoignage...');

      // Appel API via le module api.js
      const response = await window.API.submitReview(formData);

      console.log('[Form] Témoignage envoyé avec succès', response);

      // Affiche le message de succès
      successMessage.style.display = 'block';

      // Scroll vers le message de succès AVANT de reset
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Réinitialise le formulaire après un délai pour que l'utilisateur voie le message
      setTimeout(() => {
        form.reset();
      }, 500);

    } catch (error) {
      console.error('[Form] Erreur envoi :', error);

      // Affiche le message d'erreur
      showError(errorMessage, errorText, error.message || 'Une erreur est survenue. Veuillez réessayer.');

      // Scroll vers le message d'erreur
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } finally {
      // Réactive le bouton (uniquement si erreur, sinon formulaire reset)
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer mon témoignage';
      }, 1000);
    }
  }

  /**
   * Validation du formulaire (côté client)
   */
  function validateForm(form) {
    let isValid = true;

    // Liste des champs à valider
    const fields = [
      { id: 'firstname', errorId: 'firstnameError', message: 'Le prénom est requis' },
      { id: 'city', errorId: 'cityError', message: 'La ville est requise' },
      { id: 'message', errorId: 'messageError', message: 'Le témoignage doit contenir au moins 10 caractères' },
      { id: 'email', errorId: 'emailError', message: 'Un email valide est requis' }
    ];

    // Efface les erreurs précédentes
    fields.forEach(field => {
      const errorElement = document.getElementById(field.errorId);
      if (errorElement) errorElement.textContent = '';
    });

    // Valide chaque champ
    fields.forEach(field => {
      const input = document.getElementById(field.id);
      const errorElement = document.getElementById(field.errorId);

      if (!input.checkValidity()) {
        errorElement.textContent = field.message;
        isValid = false;
      }
    });

    // Validation de la notation (radio)
    const rating = form.querySelector('input[name="rating"]:checked');
    const ratingError = document.getElementById('ratingError');

    if (!rating) {
      ratingError.textContent = 'Veuillez sélectionner une note';
      isValid = false;
    } else {
      ratingError.textContent = '';
    }

    // Validation des checkboxes (consentements)
    const requiredCheckboxes = [
      { id: 'consentEmail', message: 'Vous devez accepter l\'utilisation de votre email' },
      { id: 'consentPublication', message: 'Vous devez autoriser la publication' },
      { id: 'confirmedService', message: 'Vous devez confirmer avoir reçu une prestation' }
    ];

    requiredCheckboxes.forEach(checkbox => {
      const input = document.getElementById(checkbox.id);
      if (!input.checked) {
        // Affiche un message général (pas de champ d'erreur dédié pour les checkboxes)
        alert(checkbox.message);
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Récupère les données du formulaire
   */
  function getFormData(form) {
    const formData = new FormData(form);

    return {
      name: formData.get('firstname').trim(), // Backend attend "name"
      city: formData.get('city').trim(),
      message: formData.get('message').trim(),
      email: formData.get('email').trim(),
      rating: parseInt(formData.get('rating'), 10),
      website: formData.get('website') || '' // Honeypot
    };
  }

  /**
   * Affiche un message d'erreur
   */
  function showError(errorMessage, errorText, text) {
    errorText.textContent = text;
    errorMessage.style.display = 'block';
  }

  console.log('[Form] Module chargé');
})();
