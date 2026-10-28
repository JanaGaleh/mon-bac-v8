import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Window } from "happy-dom";
let seq = 0;
async function setup() {
  const window = new Window({ url: "http://localhost/parcours.html" });
  window.document.write(
    await readFile(new URL("../parcours.html", import.meta.url), "utf8"),
  );
  for (const key of ["window", "document", "location", "FormData"])
    Object.defineProperty(globalThis, key, {
      value: window[key],
      configurable: true,
      writable: true,
    });
  const dialog = document.querySelector("dialog");
  dialog.showModal = () => {
    dialog.open = true;
  };
  dialog.close = () => {
    dialog.open = false;
  };
  await import("../js/prototype.js?test=" + ++seq);
  return window;
}
const click = (selector) => {
  assert(document.querySelector(selector), selector);
  document.querySelector(selector).click();
};
const submit = (selector) =>
  document
    .querySelector(selector)
    .dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
async function nav(view) {
  location.hash = view;
  await new Promise((r) => setTimeout(r, 10));
}
test("le catalogue combine recherche et accès gratuit sans modifier de compte", async () => {
  const window = await setup();
  const search = document.querySelector("#previewSearch");
  search.value = "introuvable";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(document.querySelectorAll(".preview-course").length, 0);
  search.value = "";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  const access = document.querySelector("#previewAccess");
  access.value = "free";
  access.dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(document.querySelectorAll(".preview-course").length, 2);
  click('[data-preview-action="course"]');
  assert(document.querySelector("[download]"));
  click('[data-preview-action="enrol"]');
  assert.match(
    document.querySelector("#previewDialogBody").textContent,
    /Aucun accès réel/,
  );
  click("#previewClose");
  await nav("administration");
  assert.match(
    document.querySelector(".demo-notification").textContent,
    /Nouvelle inscription/,
  );
  assert.doesNotMatch(
    document.querySelector(".demo-notification strong").textContent,
    /règlement/,
  );
  await window.happyDOM.close();
});
test("le règlement simulé garde les cinq méthodes et ne confirme pas avant la vérification", async () => {
  const window = await setup();
  click('[data-preview-action="course"][data-id="2"]');
  click('[data-preview-action="checkout"]');
  assert.equal(document.querySelectorAll('[name="method"]').length, 5);
  document.querySelector('[value="D-Money"]').checked = true;
  submit("#previewPaymentForm");
  assert.match(
    document.querySelector("#previewDialogBody").textContent,
    /En attente de vérification/,
  );
  click('[data-preview-action="reviewPayment"]');
  await new Promise((r) => setTimeout(r, 10));
  assert(document.querySelector('[data-preview-action="approvePayment"]'));
  click('[data-preview-action="approvePayment"]');
  assert.equal(
    document.querySelector('[data-preview-action="approvePayment"]'),
    null,
  );
  assert.match(
    document.querySelector(".demo-notification").textContent,
    /D-Money/,
  );
  assert.match(
    document.querySelector(".demo-notification").textContent,
    /Aucune notification envoyée/,
  );
  await window.happyDOM.close();
});
test("inscription formateur, offre payante et validation restent une simulation explicite", async () => {
  const window = await setup();
  await nav("inscription");
  document.querySelector("#registerName").value =
    "<img src=x onerror=alert(1)>";
  document.querySelector("#registerEmail").value = "essai@example.invalid";
  document.querySelector("#registerRole").value = "formateur";
  assert.equal(document.querySelectorAll('[type="password"]').length, 0);
  submit("#previewRegisterForm");
  assert.equal(document.querySelectorAll("#previewDialogBody img").length, 0);
  click('[data-preview-action="choosePro"]');
  assert.match(
    document.querySelector("#previewDialogBody").textContent,
    /Aucun compte n’a été créé/,
  );
  click('[data-preview-action="reviewPayment"]');
  await new Promise((r) => setTimeout(r, 10));
  assert.match(
    document.querySelector("#previewContent").textContent,
    /formateur/,
  );
  click('[data-preview-action="approveAccount"]');
  assert.equal(
    document.querySelector('[data-preview-action="approveAccount"]'),
    null,
  );
  assert.match(
    document.querySelector("#accountApproval").textContent,
    /Aucun rôle ni compte réel/,
  );
  await window.happyDOM.close();
});
test("les profils distinguent visibilité publique enseignant et profil élève privé", async () => {
  const window = await setup();
  await nav("profils");
  assert.match(
    document.querySelector(".profile-facts").textContent,
    /Fiche pédagogique publique/,
  );
  click('[data-preview-action="profile"][data-id="eleve"]');
  assert.match(
    document.querySelector(".profile-facts").textContent,
    /Informations privées/,
  );
  assert.match(
    document.querySelector(".profile-facts").textContent,
    /Facultative/,
  );
  await window.happyDOM.close();
});
