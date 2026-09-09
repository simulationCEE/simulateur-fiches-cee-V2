const eur = n => n.toLocaleString('fr-FR',{maximumFractionDigits:0}) + " €";
const eur2 = n => n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}) + " €";
const kwh = n => n.toLocaleString('fr-FR',{maximumFractionDigits:0}) + " kWhc";
const num = n => n.toLocaleString('fr-FR',{maximumFractionDigits:0});
