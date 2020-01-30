const slopes = require("slopes");
const BN = require("bn.js");
const Buffer = require('buffer/').Buffer;

let bintools = slopes.BinTools.getInstance();

let ava = new slopes.Slopes("localhost", 9650, "http", 12345);
let avm = ava.AVM(); //returns a reference to the AVM API used by Slopes

let managekeys = async () => {
    let myKeychain = avm.keyChain();
    let newAddress1 = myKeychain.makeKey();
    let mypk = Buffer.from("330530eda3225d280d42efc5f02d31d122da3da3093c739ddd7d16612c7dfd53", "hex");
    let newAddress2 = myKeychain.importKey(mypk);
    let addresses = myKeychain.getAddresses(); //returns an array of all addresses managed
    let exists = myKeychain.hasKey(newAddress1); //returns true if the address is managed
    let keypair = myKeychain.getKey(newAddress1); //returns the keypair class
    let myaddress = keypair.getAddress();

    let pubk = keypair.getPublicKey(); //returns Buffer
    let pubkstr = keypair.getPublicKeyString(); //returns an AVA serialized string

    let privk = keypair.getPrivateKey(); //returns Buffer
    let privkstr = keypair.getPrivateKeyString(); //returns an AVA serialized string

    //creating a new random keypair
    keypair = new slopes.AVMKeyPair(); 
    keypair.generateKey();
    let mypk2 = Buffer.from("021ee5e48e70e336d82d894c8f80c8109fd75651720cf662661236d22ab7b7b6", "hex");
    let successful = keypair.importKey(mypk2); //returns boolean if private key imported successfully

    let message = "Wubalubadubdub";
    let signature = keypair.sign(message); //returns a Buffer with the signature
    let signerPubk = keypair.recover(message, signature);
    let isValid = keypair.verify(message, signature, signerPubk); //returns a boolean
    
    let newAddress3 = myKeychain.makeKey();
}

let creatingassets = async () => {
    // The amount to mint for the asset
    let amount = new BN(400);

    let addresses = avm.keyChain().getAddresses();

    // We require 2 addresses to sign in order to spend this initial asset's minted coins
    let threshold = 2;
    
    //Create an output to issue to the network
    let output = new slopes.OutCreateAsset(amount, addresses, undefined, threshold);

    //A manually created TxUinsigned needs to its networkID and the blockchainID
    let networkID = ava.getNetworkID();
    let blockchainID = bintools.avaDeserialize(ava.AVM().getBlockchainID());

    let unsigned = new slopes.TxUnsigned([], [output], networkID, blockchainID);
    let signed = avm.keyChain().signTx(unsigned); //returns a Tx class

    // using the Tx class
    let txid = await avm.issueTx(signed); //returns an AVA serialized string for the TxID

    return txid;
}

let sendingassets = async (utxos, assetid) => {
    let myAddresses = avm.keyChain().getAddresses(); //returns an array of addresses the keychain manages

    let mybalance = utxos.getBalance(myAddresses, assetid); //returns 400 as a BN
    let sendAmount = new BN(100); //amounts are in BN format
    let friendsAddress = "B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW"; //AVA serialized address format
    let unsignedTx = avm.makeUnsignedTx(utxos, sendAmount, [friendsAddress], myAddresses, myAddresses, assetid); 
    let signedTx = avm.signTx(unsignedTx);
    let txid = await avm.issueTx(signedTx);

    return txid;
}
let assetIDList = [];
let utxosGlobal;
managekeys().then(() => {
    return creatingassets();
}).then((assetid) => {
    assetIDList.push(assetid);
}).then(() => {
    return creatingassets();
}).then((assetid) => {
    assetIDList.push(assetid);
}).then(() => {
    setTimeout(() => {  
        let boyyy = avm.keyChain().getAddresses();
        console.log("boyyy", JSON.stringify(boyyy));
        avm.getUTXOs(boyyy).then((result) => {
            utxosGlobal = result;
            console.log("utxosGlobal", JSON.stringify(utxosGlobal.getAllUTXOs()));
            let cb = async (txid, assetid) => {  
                let myAddresses = avm.keyChain().getAddresses(); //returns an array of addresses the keychain manages
                let sendAmount = new BN(100); //amounts are in BN format
                // returns one of: "Accepted", "Processing", "Unknown", and "Rejected"
                let status = await avm.getTxStatus(txid);
                console.log(status);
                let updatedUTXOs = await avm.getUTXOs();
                let newBalance = updatedUTXOs.getBalance(myAddresses, assetid);
                console.log("New Balance ")
            };
            sendingassets(utxosGlobal, assetIDList[0]).then((txid) => {
                setTimeout(() => cb(txid, assetIDList[0]), 5000);
            }).then(()=>{
                sendingassets(utxosGlobal, assetIDList[1]).then((txid) => {
                    setTimeout(() => cb(txid, assetIDList[1]), 5000);
                }).then(() => {
                    console.log("Done sending.");
                });
            });
        });
    }, 5000);
});

