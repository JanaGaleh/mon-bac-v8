import { client, rpc } from "./api.js";
const $ = (id) => document.getElementById(id);
let submittedEmail = "";
let resendAfter = 0;
export function registrationError(error) {
  const code = error?.code || "";
  if (code === "weak_password")
    return "Choisis un mot de passe plus long et moins prévisible.";
  if (code === "email_address_not_authorized")
    return "L’envoi des confirmations doit être configuré par l’administration. Aucun accès n’a été activé.";
  if (code === "signup_disabled")
    return "Les inscriptions sont momentanément fermées.";
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    error?.status === 429
  )
    return "Trop de demandes. Patiente quelques minutes avant de réessayer.";
  if (code === "user_already_exists")
    return "Si tu as déjà un compte, utilise Se connecter.";
  if (/fetch|network/i.test(error?.message || ""))
    return "Connexion interrompue. Vérifie Internet puis réessaie.";
  return "L’inscription n’a pas pu être confirmée. Réessaie ou contacte l’administration.";
}
export function validRegistration({ name, email, password, type, motivation }) {
  if (!name.trim() || name.trim().length > 100)
    return "Indique ton nom (100 caractères maximum).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return "Indique une adresse e-mail valide.";
  if (password.length < 12)
    return "Choisis un mot de passe d’au moins 12 caractères.";
  if (!["eleve", "enseignant"].includes(type))
    return "Choisis Élève ou Enseignant.";
  if (
    type === "enseignant" &&
    (motivation.trim().length < 10 || motivation.trim().length > 2000)
  )
    return "Présente tes matières et niveaux enseignés (10 à 2 000 caractères).";
  return null;
}
export async function ensureTeacherRequest(user, profile) {
  if (profile.role !== "eleve") return null;
  let request = await rpc("ma_demande_enseignant");
  if (Array.isArray(request)) request = request[0] || null;
  // Les métadonnées expriment une intention ; elles ne donnent jamais de droits.
  if (!request && user.user_metadata?.type_compte_souhaite === "enseignant") {
    await rpc("demander_role_enseignant", {
      p_motivation: user.user_metadata.presentation_enseignant || "",
    });
    request = await rpc("ma_demande_enseignant");
  }
  return request;
}
export function initRegistration({ onAuthenticated }) {
  const screen = $("registrationScreen"),
    login = $("loginScreen");
  function view(show) {
    if (show && $("registrationForm").classList.contains("hidden")) {
      $("registrationForm").reset();
      $("registrationForm").classList.remove("hidden");
      $("signupSuccess").classList.add("hidden");
      $("signupHeading").textContent = "Créer mon compte";
      $("teacherPresentation").classList.add("hidden");
      $("signupPresentation").required = false;
    }
    if (!show) $("signupPassword").value = "";
    screen.classList.toggle("hidden", !show);
    login.classList.toggle("hidden", show);
    if (show) {
      $("signupMessage").textContent = "";
      $("signupName").focus();
    } else $("email").focus();
  }
  $("openRegistration").addEventListener("click", () => view(true));
  $("backToLogin").addEventListener("click", () => view(false));
  $("registrationRole").addEventListener("change", () => {
    $("teacherPresentation").classList.toggle(
      "hidden",
      $("registrationRole").value !== "enseignant",
    );
    $("signupPresentation").required =
      $("registrationRole").value === "enseignant";
  });
  $("signupToggle").addEventListener("click", () => {
    const visible = $("signupPassword").type === "password";
    $("signupPassword").type = visible ? "text" : "password";
    $("signupToggle").textContent = visible ? "Masquer" : "Afficher";
    $("signupToggle").setAttribute(
      "aria-label",
      visible ? "Masquer le mot de passe" : "Afficher le mot de passe",
    );
  });
  $("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("signupBtn");
    if (btn.disabled) return;
    const values = {
      name: $("signupName").value,
      email: $("signupEmail").value,
      password: $("signupPassword").value,
      type: $("registrationRole").value,
      motivation: $("signupPresentation").value,
    };
    const invalid = validRegistration(values);
    if (invalid) {
      $("signupMessage").textContent = invalid;
      return;
    }
    btn.disabled = true;
    $("backToLogin").disabled = true;
    $("signupMessage").textContent = "Création du compte…";
    try {
      const { data, error } = await client.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          emailRedirectTo: new URL("./mon-bac.html", location.href).href,
          data: {
            nom: values.name.trim(),
            type_compte_souhaite: values.type,
            ...(values.type === "enseignant"
              ? { presentation_enseignant: values.motivation.trim() }
              : {}),
          },
        },
      });
      if (error) throw error;
      $("signupPassword").value = "";
      submittedEmail = values.email.trim();
      $("email").value = submittedEmail;
      resendAfter = Date.now() + 60000;
      $("registrationForm").classList.add("hidden");
      $("signupSuccess").classList.remove("hidden");
      $("signupHeading").textContent = "Vérifie ton adresse e-mail";
      $("signupMessage").textContent =
        "Si cette adresse peut être inscrite, un lien de confirmation est envoyé. Vérifie aussi tes courriers indésirables. Après confirmation, reviens te connecter.";
      $("signupTeacherNote").classList.toggle(
        "hidden",
        values.type !== "enseignant",
      );
      if (data?.session && data?.user) {
        await onAuthenticated(data.user);
        screen.classList.add("hidden");
      }
    } catch (error) {
      $("signupMessage").textContent = registrationError(error);
    } finally {
      btn.disabled = false;
      $("backToLogin").disabled = false;
    }
  });
  $("resendSignup").addEventListener("click", async () => {
    if (Date.now() < resendAfter) {
      $("signupMessage").textContent =
        "Attends une minute avant de renvoyer un lien.";
      return;
    }
    const btn = $("resendSignup");
    btn.disabled = true;
    try {
      const { error } = await client.auth.resend({
        type: "signup",
        email: submittedEmail,
        options: {
          emailRedirectTo: new URL("./mon-bac.html", location.href).href,
        },
      });
      if (error) throw error;
      resendAfter = Date.now() + 60000;
      $("signupMessage").textContent =
        "Si une confirmation est nécessaire, un nouveau lien sera envoyé.";
    } catch (error) {
      $("signupMessage").textContent = registrationError(error);
    } finally {
      btn.disabled = false;
    }
  });
}
