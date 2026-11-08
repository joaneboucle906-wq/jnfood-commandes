/* =========================================================
   JN Food - script.js (version définitive)
   ========================================================= */
/* ---------- RÉGLAGES ---------- */
var URL_SHEET = "https://script.google.com/macros/s/AKfycbwbPXzSHjzF6FtT-uvLP1MGwRdVbjHISXbmF6o9FbV9ZrsQOSJEpr-EUJwpCNjbQcBU/exec";
var WAVE_LIEN = "https://pay.wave.com/m/M_ci_JbW10MlZ1A4Y/c/ci/";
// true = commandes seulement de 17h00 à 05h00 / false = toujours ouvert (pour tester)
var VERIFIER_HORAIRES = false;
// Le panier est une liste de lignes : { id: "...", qte: 1 }
var panier = [];
var commandeEnregistree = null;
var CHAMPS_INFOS = [
  { id: "student-lastname",  libelle: "votre nom" },
  { id: "student-firstname", libelle: "votre prénom" },
  { id: "student-level",     libelle: "votre niveau ou statut" },
  { id: "student-filiere",   libelle: "votre filière" },
  { id: "student-phone",     libelle: "votre numéro de téléphone" },
  { id: "student-campus",    libelle: "votre campus" }
];
// Vrai si la personne est enseignant ou personnel administratif (pas de filière)
function estPersonnel() {
  var n = document.getElementById("student-level").value;
  return n === "Enseignant" || n === "Personnel administratif";
}
/* ---------- OUTILS ---------- */
function formaterPrix(n) {
  return n.toLocaleString("fr-FR") + " FCFA";
}
function trouverPlat(id) {
  return MENU.find(function (p) { return p.id === id; });
}
function trouverLigne(id) {
  return panier.find(function (l) { return l.id === id; });
}
function echapper(texte) {
  var d = document.createElement("div");
  d.textContent = texte;
  return d.innerHTML;
}
function afficherMessage(zone, type, html) {
  var msg = document.getElementById(zone);
  msg.className = type;
  msg.innerHTML = html;
  msg.hidden = false;
}
function calculerTotal() {
  var somme = 0;
  panier.forEach(function (ligne) { somme += trouverPlat(ligne.id).prix * ligne.qte; });
  return somme;
}
/* ---------- MENU ---------- */
function afficherMenu() {
  var grille = document.getElementById("menu-grid");
  grille.innerHTML = "";
 MENU.forEach(function (plat) {
    var carte = document.createElement("div");
    carte.className = "dish" + (commandeEnregistree ? " locked" : "");
    carte.setAttribute("role", "button");
    carte.setAttribute("tabindex", "0");
    carte.setAttribute("aria-pressed", trouverLigne(plat.id) ? "true" : "false");
    carte.dataset.id = plat.id;
 var zoneImg = document.createElement("div");
    zoneImg.className = "dish-img";
    var img = document.createElement("img");
    img.src = plat.image;
    img.alt = plat.nom;
    img.loading = "lazy";
    img.onerror = function () { img.style.display = "none"; };
    zoneImg.appendChild(img);
   var texte = document.createElement("div");
    texte.className = "dish-text";
    var badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = plat.categorie;
    var titre = document.createElement("h3");
    titre.textContent = plat.nom;
    var desc = document.createElement("p");
    desc.textContent = plat.description;
    var prix = document.createElement("p");
    prix.className = "price";
    prix.textContent = formaterPrix(plat.prix);
 texte.appendChild(badge);
    texte.appendChild(titre);
    texte.appendChild(desc);
    texte.appendChild(prix);
    carte.appendChild(zoneImg);
    carte.appendChild(texte);
 carte.addEventListener("click", function () { basculerPlat(plat.id); });
    carte.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        basculerPlat(plat.id);
      }
    });
  grille.appendChild(carte);
  });
}
/* ---------- PANIER ---------- */
// Toucher une carte du menu : ajoute le plat (quantité 1) ou le retire.
function basculerPlat(id) {
  if (commandeEnregistree) return; // sélection verrouillée après enregistrement
  var position = panier.findIndex(function (l) { return l.id === id; });
  if (position === -1) {
    panier.push({ id: id, qte: 1 });
  } else {
    panier.splice(position, 1);
  }
  afficherMenu();
  afficherPanier();
}
// Boutons − et + : delta = -1 ou +1.
function changerQuantite(id, delta) {
  if (commandeEnregistree) return;
  var ligne = trouverLigne(id);
  if (!ligne) return;
  ligne.qte += delta;
  if (ligne.qte <= 0) {
    // "-" quand la quantité vaut 1 : le plat est retiré du panier
    panier = panier.filter(function (l) { return l.id !== id; });
  }
  afficherMenu();
  afficherPanier();
}
function creerBoutonQuantite(texte, label, action) {
  var b = document.createElement("button");
  b.type = "button";
  b.textContent = texte;
  b.setAttribute("aria-label", label);
  b.disabled = !!commandeEnregistree;
  b.addEventListener("click", action);
  return b;
}
function afficherPanier() {
  var liste = document.getElementById("basket-list");
  var vide = document.getElementById("basket-empty");
  var total = document.getElementById("basket-total");
  liste.innerHTML = "";
 if (panier.length === 0) {
    vide.hidden = false;
    total.hidden = true;
    return;
  }
  vide.hidden = true;
 panier.forEach(function (ligne) {
    var plat = trouverPlat(ligne.id);
    var li = document.createElement("li");
 var nom = document.createElement("span");
    nom.className = "basket-name";
    nom.textContent = plat.nom;
 // Sélecteur de quantité, placé juste avant le prix
    var qty = document.createElement("div");
    qty.className = "qty";
    var moins = creerBoutonQuantite("−", "Retirer un " + plat.nom, function () { changerQuantite(ligne.id, -1); });
    var valeur = document.createElement("span");
    valeur.className = "qty-value";
    valeur.textContent = ligne.qte;
    valeur.setAttribute("aria-live", "polite");
    var plus = creerBoutonQuantite("+", "Ajouter un " + plat.nom, function () { changerQuantite(ligne.id, 1); });
    qty.appendChild(moins);
    qty.appendChild(valeur);
    qty.appendChild(plus);
 var prix = document.createElement("span");
    prix.className = "basket-price";
    prix.textContent = formaterPrix(plat.prix * ligne.qte);
 li.appendChild(nom);
    li.appendChild(qty);
    li.appendChild(prix);
    liste.appendChild(li);
  });
 total.hidden = false;
  total.textContent = "Total : " + formaterPrix(calculerTotal());
}
/* ---------- INFORMATIONS ÉTUDIANT / PERSONNEL ---------- */
function telephoneValide(valeur) {
  // Accepte chiffres, espaces, points, tirets, parenthèses et un "+" initial ; 8 à 15 chiffres
  if (!/^\+?[\d\s.\-()]+$/.test(valeur)) return false;
  var chiffres = valeur.replace(/\D/g, "");
  return chiffres.length >= 8 && chiffres.length <= 15;
}
function lireInfosEtudiant() {
  var manquants = [];
  var valeurs = {};
 CHAMPS_INFOS.forEach(function (c) {
    var el = document.getElementById(c.id);
    var valeur = el.value.trim();
    var invalide = !valeur;
    var libelle = c.libelle;
 // La filière n'est pas demandée aux enseignants ni au personnel administratif
    if (c.id === "student-filiere" && estPersonnel()) {
      invalide = false;
      valeur = "";
    }
 if (c.id === "student-phone" && valeur && !telephoneValide(valeur)) {
      invalide = true;
      libelle = "un numéro de téléphone valide";
    }
 el.parentElement.classList.toggle("invalid", invalide);
    if (invalide) manquants.push(libelle);
    valeurs[c.id] = valeur;
  });
if (manquants.length > 0) {
    var items = manquants.map(function (m) { return "<li>" + m + "</li>"; }).join("");
    afficherMessage("message-save", "error", "Veuillez renseigner :<ul>" + items + "</ul>");
    document.getElementById("infos").scrollIntoView();
    return null;
  }
return {
    nom: valeurs["student-lastname"],
    prenom: valeurs["student-firstname"],
    niveau: valeurs["student-level"],
    filiere: valeurs["student-filiere"],
    telephone: valeurs["student-phone"],
    campus: valeurs["student-campus"]
  };
}
function verrouillerInfos(etat) {
  CHAMPS_INFOS.forEach(function (c) {
    document.getElementById(c.id).disabled = etat;
  });
}
/* ---------- HORAIRES ---------- */
function commandesOuvertes() {
  var heure = new Date().getHours();
  return heure >= 17 || heure < 5; // ouvert de 17h00 à 05h00
}
/* ---------- ÉTAPE 1 : ENREGISTRER LA COMMANDE ---------- */
async function enregistrerCommande() {
  if (commandeEnregistree) return;
if (panier.length === 0) {
    afficherMessage("message-save", "warn", "Votre panier est vide. Choisissez au moins un plat dans le menu.");
    document.getElementById("menu").scrollIntoView();
    return;
  }
var infos = lireInfosEtudiant();
  if (!infos) return;
 if (VERIFIER_HORAIRES && !commandesOuvertes()) {
    afficherMessage("message-save", "warn", "Les commandes sont fermées pour le moment. Elles sont ouvertes chaque jour de 17h00 à 05h00.");
    return;
  }
 // Ex : "2 x Poulet braisé, 1 x Jus de bissap"
  var plats = panier.map(function (ligne) {
    return ligne.qte + " x " + trouverPlat(ligne.id).nom;
  });
  var total = calculerTotal();
  var reference = "JN-" + Math.floor(1000 + Math.random() * 9000);
  // Ces champs correspondent aux colonnes du Google Sheet
  var commande = {
    reference: reference,
    nom_famille: infos.nom,
    prenom: infos.prenom,
    niveau: infos.niveau,
    filiere: infos.filiere,
    telephone: infos.telephone,
    campus: infos.campus,
    plats: plats.join(", "),
    total: total
  };
 var bouton = document.getElementById("save-btn");
  bouton.disabled = true;
  bouton.textContent = "Enregistrement...";
try {
    await fetch(URL_SHEET, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(commande)
    });
  } catch (erreur) {
    afficherMessage("message-save", "error", "Impossible d'enregistrer votre commande. Vérifiez votre connexion et réessayez.");
    bouton.disabled = false;
    bouton.textContent = "Enregistrer ma commande";
    return;
  }
commandeEnregistree = { reference: reference, total: total, nom: infos.prenom + " " + infos.nom };
verrouillerInfos(true);
  afficherMenu();
  afficherPanier();
bouton.textContent = "Commande enregistrée ✓";
  afficherMessage(
    "message-save",
    "success",
    "Merci " + echapper(infos.prenom) + " ! Votre commande est enregistrée.<br>" +
    "Référence : <strong>" + reference + "</strong><br>" +
    "Total : <strong>" + formaterPrix(total) + "</strong><br>" +
    "Retrait au campus : " + echapper(infos.campus) + "<br>" +
    "Cliquez maintenant sur « Passer ma commande » pour payer avec Wave.<br>" +
    "<button type=\"button\" class=\"link-btn\" onclick=\"nouvelleCommande()\">Modifier / nouvelle commande</button>"
  );
document.getElementById("pay-btn").disabled = false;
  document.getElementById("commande").scrollIntoView();
}
/* ---------- ÉTAPE 2 : PASSER LA COMMANDE (PAIEMENT WAVE) ---------- */
function passerCommande() {
  if (!commandeEnregistree) {
    afficherMessage("message", "warn", "Enregistrez d'abord votre commande dans la section Panier.");
    document.getElementById("panier").scrollIntoView();
    return;
  }
var url = WAVE_LIEN + (WAVE_LIEN.indexOf("?") === -1 ? "?" : "&") + "amount=" + commandeEnregistree.total;
  afficherMessage(
    "message",
    "success",
    "Redirection vers Wave... Montant : " + formaterPrix(commandeEnregistree.total) +
    ". Référence : <strong>" + commandeEnregistree.reference + "</strong>"
  );
  window.location.href = url;
}
/* ---------- NOUVELLE COMMANDE ---------- */
function nouvelleCommande() {
  panier = [];
  commandeEnregistree = null;
  verrouillerInfos(false);
  var bouton = document.getElementById("save-btn");
  bouton.disabled = false;
  bouton.textContent = "Enregistrer ma commande";
  document.getElementById("pay-btn").disabled = true;
  document.getElementById("message-save").hidden = true;
  document.getElementById("message").hidden = true;
afficherMenu();
  afficherPanier();
  document.getElementById("menu").scrollIntoView();
}
/* ---------- DÉMARRAGE ---------- */
afficherMenu();
afficherPanier();
