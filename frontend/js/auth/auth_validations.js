import { isEmail, isStrongPassword, saveToken, toggleSubmitting,
         showError, clearError, setValid, setFormError } from '../lib/lib.js';
import { postJSON } from '../api/api.js';

document.addEventListener('DOMContentLoaded', () => {
  const SIGNIN_AFTER_SIGNUP = '../auth/signin.html';
  const LANDING_AFTER_SIGNIN = '/public/dashboard/index.html';

  // live clear on typing
  document.addEventListener('input', (e) => {
    if (e.target?.classList?.contains('form-input')) clearError(e.target);
  });

  // SIGN IN
  const signInForm = document.getElementById('signInForm');
  if (signInForm) {
    const emailInput = signInForm.querySelector('input[name="email"], #email');
    const passwordInput = signInForm.querySelector('input[name="password"], #password');

    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setFormError(signInForm, '');

      let ok = true;
      if (!emailInput.value.trim()) { showError(emailInput, 'Email is required'); ok = false; }
      else if (!isEmail(emailInput.value)) { showError(emailInput, 'Enter a valid email'); ok = false; }
      else setValid(emailInput);

      if (!passwordInput.value) { showError(passwordInput, 'Password is required'); ok = false; }
      else setValid(passwordInput);

      if (!ok) return;

      toggleSubmitting(signInForm, true);
      try {
        const { res, data } = await postJSON('/auth/login', {
          email: emailInput.value.trim(),
          password: passwordInput.value
        });

        if (!res.ok) {
          showError(emailInput, '');
          showError(passwordInput, '');
          setFormError(signInForm, data?.error || data?.message || 'Invalid email or password');
          return;
        }

        saveToken(data.accessToken);
        
        // Check if there's a return URL from survey access
        const returnUrl = sessionStorage.getItem('returnUrl');
        if (returnUrl) {
          sessionStorage.removeItem('returnUrl');
          window.location.href = returnUrl;
        } else {
          window.location.href = LANDING_AFTER_SIGNIN;
        }
      } catch (err) {
        setFormError(signInForm, 'Cannot reach server. Please try again.');
        console.error(err);
      } finally {
        toggleSubmitting(signInForm, false);
      }
    });
  }

  // SIGN UP
  const signUpForm = document.getElementById('signUpForm');
  if (signUpForm) {
    const fullNameInput = signUpForm.querySelector('input[name="fullName"], #fullName');
    const emailInput = signUpForm.querySelector('input[name="email"], #email');
    const passwordInput = signUpForm.querySelector('input[name="password"], #password');
    const confirmPasswordInput = signUpForm.querySelector('input[name="confirmPassword"], #confirmPassword');

    // optional: toggle password
    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = btn.querySelector('i');
        if (!input) return;
        if (input.type === 'password') {
          input.type = 'text';
          icon?.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
          input.type = 'password';
          icon?.classList.replace('fa-eye-slash', 'fa-eye');
        }
      });
    });

    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setFormError(signUpForm, '');

      let ok = true;
      if (!fullNameInput.value.trim() || fullNameInput.value.trim().length < 2) {
        showError(fullNameInput, 'Please enter your full name'); ok = false;
      } else setValid(fullNameInput);

      if (!emailInput.value.trim()) { showError(emailInput, 'Email is required'); ok = false; }
      else if (!isEmail(emailInput.value)) { showError(emailInput, 'Enter a valid email'); ok = false; }
      else setValid(emailInput);

      if (!passwordInput.value) { showError(passwordInput, 'Password is required'); ok = false; }
      else if (!isStrongPassword(passwordInput.value)) {
        showError(passwordInput, 'At least 8 chars, include a number & a symbol'); ok = false;
      } else setValid(passwordInput);

      if (!confirmPasswordInput.value) { showError(confirmPasswordInput, 'Please confirm your password'); ok = false; }
      else if (confirmPasswordInput.value !== passwordInput.value) { showError(confirmPasswordInput, 'Passwords do not match'); ok = false; }
      else setValid(confirmPasswordInput);

      if (!ok) return;

      toggleSubmitting(signUpForm, true);
      try {
        const { res, data } = await postJSON('/auth/register', {
          name: fullNameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value
        });

        if (!res.ok) {
          if (res.status === 409) {
            showError(emailInput, data?.error || data?.message || 'Email already exists');
          } else {
            setFormError(signUpForm, data?.error || data?.message || 'Could not sign up');
          }
          return;
        }

        const gapDiv = document.createElement('div');
        gapDiv.style.height = '40px';
        signUpForm.parentNode.insertBefore(gapDiv, signUpForm.nextSibling);

        setTimeout(() => { window.location.href = SIGNIN_AFTER_SIGNUP; }, 200);
      } catch (err) {
        setFormError(signUpForm, '* Cannot reach server. Please try again.');
        console.error(err);
      } finally {
        toggleSubmitting(signUpForm, false);
      }
    });
  }
});

