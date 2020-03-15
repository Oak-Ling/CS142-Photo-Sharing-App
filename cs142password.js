var crypto = require('crypto');
/*
 * Return a salted and hashed password entry from a
 * clear text password.
 * @param {string} clearTextPassword
 * @return {object} passwordEntry
 * where passwordEntry is an object with two string
 * properties:
 *      salt - The salt used for the password.
 *      hash - The sha1 hash of the password and salt
 */
function makePasswordEntry(clearTextPassword) {
  let saltNum = crypto.randomBytes(8).toString('hex');
  // update digest
  const hash = crypto.createHash('sha1');
  hash.update(clearTextPassword + saltNum);
  return {
    salt: saltNum,
    hash: hash.digest('hex'),
  };
}

/*
 * Return true if the specified clear text password
 * and salt generates the specified hash.
 * @param {string} hash
 * @param {string} salt
 * @param {string} clearTextPassword
 * @return {boolean}
 */
function doesPasswordMatch(hash, salt, clearTextPassword) {
  const newHash = crypto.createHash('sha1');
  newHash.update(clearTextPassword + salt);
  return newHash.digest('hex') === hash;
}

module.exports = {
  makePasswordEntry: makePasswordEntry,
  doesPasswordMatch: doesPasswordMatch
};