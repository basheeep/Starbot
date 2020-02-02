// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
//
// admin.initializeApp(functions.config().firebase);
// const firestore = admin.firestore();


exports.getClinics = function(firestore) {
  return new Promise(function(resolve) {
    let clinicsRef = firestore.collection('clinics');
    let allClinics = clinicsRef.get()
      .then(snapshot => {
        return resolve(snapshot);
        // snapshot.forEach(doc => {
        //   console.log(doc.id, '=>', doc.data());

      })
      .catch(err => {
        console.log('Error getting documents back', err);
        return resolve(err);
      });

  });
}
