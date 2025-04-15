/**
 * @author xumptex [xumptex@outlook.fr]
 * @copyright Crown Copyright 2025
 * @license Apache-2.0
 */

import OperationError from "../errors/OperationError.mjs";


export function strToValue(str) {
    let index = 0;
  
    // Fonction utilitaire pour ignorer les espaces et retours à la ligne
    function skipWhitespace() {
      while (index < str.length && /\s/.test(str[index])) {
        index++;
      }
    }
  
    // Parseur principal qui détermine la valeur à lire (objet, tableau, nombre, chaîne, BigInt)
    function parseValue() {
      skipWhitespace();
      const char = str[index];
      if (char === '{') return parseObject();
      if (char === '[') return parseArray();
      if (char === "'" || char === '"') return parseString();
      if (str.substr(index, 7) === "BigInt(") return parseBigInt();
      if (/[0-9\-]/.test(char)) return parseNumber();
      throw new Error("Token inattendu à la position " + index);
    }
  
    // Parseur d'objet : attend un pattern du type { key: value, ... }
    function parseObject() {
      const obj = {};
      // On attend le caractère {
      if (str[index] !== '{') {
        throw new Error("Attendu '{' à la position " + index);
      }
      index++; // consomme '{'
      skipWhitespace();
  
      while (index < str.length && str[index] !== '}') {
        // Lecture de la clé qui peut être une chaîne entre guillemets ou un identifiant simple
        let key;
        if (str[index] === "'" || str[index] === '"') {
          key = parseString();
        } else {
          key = parseIdentifier();
        }
        skipWhitespace();
  
        // Lecture du deux-points séparateur entre clé et valeur
        if (str[index] !== ':') {
          throw new Error("Attendu ':' après la clé à la position " + index);
        }
        index++; // consomme ':'
        skipWhitespace();
  
        // Parse la valeur associée
        const value = parseValue();
        obj[key] = value;
        skipWhitespace();
  
        // S'il y a une virgule, on la consomme et on continue
        if (str[index] === ',') {
          index++;
          skipWhitespace();
        } else {
          // Sinon, on sort de la boucle (fin des paires clé/valeur)
          break;
        }
      }
      if (str[index] !== '}') {
        throw new Error("Attendu '}' à la position " + index);
      }
      index++; // consomme '}'
      return obj;
    }
  
    // Parseur de tableau : lit les valeurs séparées par des virgules entre [ et ]
    function parseArray() {
      const arr = [];
      if (str[index] !== '[') {
        throw new Error("Attendu '[' à la position " + index);
      }
      index++; // consomme '['
      skipWhitespace();
  
      while (index < str.length && str[index] !== ']') {
        const value = parseValue();
        arr.push(value);
        skipWhitespace();
        if (str[index] === ',') {
          index++;
          skipWhitespace();
        } else {
          break;
        }
      }
      if (str[index] !== ']') {
        throw new Error("Attendu ']' à la position " + index);
      }
      index++; // consomme ']'
      return arr;
    }
  
    // Parseur de chaîne : gère les chaînes entre apostrophes ou guillemets doubles
    function parseString() {
      const quote = str[index];
      if (quote !== "'" && quote !== '"') {
        throw new Error("Attendu une chaîne à la position " + index);
      }
      index++; // consomme le caractère ouvrant (apostrophe ou guillemet)
      const start = index;
      let result = "";
      while (index < str.length && str[index] !== quote) {
        // Gère le cas d'un caractère d'échappement
        if (str[index] === "\\") {
          result += str.slice(start, index);
          index++; // consomme le backslash
          if (index < str.length) {
            result += str[index];
            index++;
          }
          // On reprend la construction à partir du nouvel index
          continue;
        }
        index++;
      }
      if (str[index] !== quote) {
        throw new Error("Chaîne non terminée à partir de la position " + start);
      }
      result += str.slice(start, index);
      index++; // consomme le quote fermant
      return result;
    }
  
    // Parseur pour lire un identifiant (clé non citée) : lettres, chiffres et underscore
    function parseIdentifier() {
      const start = index;
      while (index < str.length && /[a-zA-Z0-9_]/.test(str[index])) {
        index++;
      }
      if (start === index) {
        throw new Error("Identifiant attendu à la position " + index);
      }
      return str.slice(start, index);
    }
  
    // Parseur de nombre : gère les entiers (négatifs ou positifs)
    function parseNumber() {
      const start = index;
      if (str[index] === '-') {
        index++;
      }
      while (index < str.length && /[0-9]/.test(str[index])) {
        index++;
      }
      const numStr = str.slice(start, index);
      return Number(numStr);
    }
  
    // Parseur pour BigInt : lit une expression de type BigInt(<digits>)
    function parseBigInt() {
      const prefix = "BigInt(";
      if (str.substr(index, prefix.length) !== prefix) {
        throw new Error("Attendu 'BigInt(' à la position " + index);
      }
      index += prefix.length;
      skipWhitespace();
      const start = index;
      while (index < str.length && /[0-9]/.test(str[index])) {
        index++;
      }
      const numStr = str.slice(start, index);
      skipWhitespace();
      if (str[index] !== ')') {
        throw new Error("Attendu ')' à la position " + index);
      }
      index++; // consomme ')'
      return BigInt(numStr);
    }
  
    // Début du parsing : on ignore les espaces initiaux
    skipWhitespace();
    // On attend que la chaîne commence par une expression (typiquement un objet)
    const result = parseValue();
    skipWhitespace();
    // On ignore un éventuel point-virgule final
    if (str[index] === ';') {
      index++;
      skipWhitespace();
    }
    if (index < str.length) {
      throw new Error("Caractères inattendus en fin d'entrée à la position " + index);
    }
    return result;
  }
  
export function valueToStr(value) {
    // Fonction récursive qui convertit une valeur en chaîne.
    function serialize(val) {
      // Gestion de null
      if (val === null) return "null";
  
      // Gestion du type number
      const type = typeof val;
      if (type === "number") {
        return String(val);
      }
  
      // Gestion du type BigInt : on renvoie BigInt(<valeur>)
      if (type === "bigint") {
        return `BigInt(${val.toString()})`;
      }
  
      // Gestion des chaînes : on encadre la chaîne avec des apostrophes
      // et on échappe les apostrophes et antislash éventuels.
      if (type === "string") {
        let escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `'${escaped}'`;
      }
  
      // Gestion des tableaux : on parcourt et serialize chaque élément
      if (Array.isArray(val)) {
        const elements = val.map(serialize);
        return `[${elements.join(', ')}]`;
      }
  
      // Gestion des objets
      if (type === "object") {
        const entries = Object.entries(val).map(([key, value]) => {
          // Pour les clés : on vérifie si elles correspondent à un identifiant valide
          // Si oui, on les laisse non citées ; sinon, on les entoure d'apostrophes.
          if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
            return `${key}: ${serialize(value)}`;
          } else {
            let escapedKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `'${escapedKey}': ${serialize(value)}`;
          }
        });
        return `{${entries.join(', ')}}`;
      }
  
      // Gestion des booléens
      if (type === "boolean") {
        return val ? "true" : "false";
      }
  
      throw new Error("Type non supporté : " + type);
    }
  
    // On ajoute un point-virgule final pour correspondre au format d'entrée.
    return serialize(value);
  }