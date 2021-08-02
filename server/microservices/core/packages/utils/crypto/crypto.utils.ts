/**
 * Author Weslley
 * 2020
 * */

const _crypto   = require('crypto');
const _cryptoJS = require('crypto-js');

export const cryptoUtils = {

    masterKey: process.env.APP_NAME || 'crypto',

    hash:(value,salt,keyLen = 64)=> {
        return _crypto.pbkdf2Sync(value, salt, 1000, keyLen, `sha512`).toString(`hex`);
    },

    /**
     * Encrypts text by given key
     * @returns String encrypted text, base64 encoded
     * @param text
     * @param masterkey
     * @param length
     */
    encrypt: function (text:string, masterkey:string = this.masterKey,length:number = 32){
        // random initialization vector
        const iv = _crypto.randomBytes(16);

        // random salt
        const salt = _crypto.randomBytes(64);

        // derive encryption key: 32 byte key length
        // in assumption the masterkey is a cryptographic and NOT a password there is no need for
        // a large number of iterations. It may can replaced by HKDF
        // the value of 2145 is randomly chosen!
        const key = _crypto.pbkdf2Sync(masterkey, salt, 2145, length, 'sha512');

        // AES 256 GCM Mode
        const cipher = _crypto.createCipheriv('aes-256-gcm', key, iv);

        // encrypt the given text
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

        // extract the auth tag
        const tag = cipher.getAuthTag();

        // generate output
        return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    },

    /**
     * Decrypts text by given key
     * @returns String decrypted (original) text
     * @param encdata
     * @param masterkey
     * @param length
     */
    decrypt: function (encdata:string, masterkey:string = this.masterKey,length:number = 32){
        try {
            // base64 decoding
            const bData = Buffer.from(encdata, 'base64');

            // convert data to buffers
            const salt = bData.slice(0, 64);
            const iv = bData.slice(64, 80);
            const tag = bData.slice(80, 96);
            const text = bData.slice(96);

            // derive key using; 32 byte key length
            const key = _crypto.pbkdf2Sync(masterkey, salt , 2145, length, 'sha512');

            // AES 256 GCM Mode
            const decipher = _crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(tag);

            // encrypt the given text
            const decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

            return decrypted;
        }catch (e){
            return  null
        }
    },

    frontend:({
        getIVKey(pTk){
            return  pTk.split(process.env.APP_TOKENIZER_SPLITTER )[1]
        },
        decrypt:(text, base, publicKey)=> {

             const key = _cryptoJS.enc.Hex.parse(process.env.APP_TOKENIZER_HASH);
             const iv = _cryptoJS.enc.Hex.parse(publicKey);

             try {
                 const decryptByDES = (ciphertext, key)=> {
                     let keyHex = _cryptoJS.enc.Utf8.parse(key);
                     // direct decrypt ciphertext
                     let decrypted = _cryptoJS.DES.decrypt({
                         ciphertext: _cryptoJS.enc.Base64.parse(ciphertext)
                     }, keyHex, {
                         mode: _cryptoJS.mode.ECB,
                         padding: _cryptoJS.pad.Pkcs7
                     });
                     return decrypted.toString(_cryptoJS.enc.Utf8);
                 }

                 let plain = decryptByDES(text, base);

                 const decrypted = _cryptoJS.AES.decrypt(
                     plain, key, {
                         iv: iv,
                         mode: _cryptoJS.mode.CBC,
                         padding: _cryptoJS.pad.Pkcs7
                     }
                 );
                 return decrypted.toString(_cryptoJS.enc.Utf8);
             } catch (ERROR) {

                 return 'false';
             }
         }
    })

};
