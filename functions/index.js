// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const database = require('./database');

// account sharing client id 463473026934-di4lshe7j13vhtli253k1k8onjklmqlj.apps.googleusercontent.com
const {
  dialogflow,
  BasicCard,
  Button,
  Image,
  card,
  Suggestions,
  SignIn,
  Permission
} = require('actions-on-google');
process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const app = dialogflow({
  debug: true,
  clientId: "463473026934-di4lshe7j13vhtli253k1k8onjklmqlj.apps.googleusercontent.com"
});
const nodemailer = require('nodemailer');
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const util = require('./util');

let auth = false;
let clinics = [];

database.getClinics(db).then(function(snapshot) {
    snapshot.forEach(doc => {
      //console.log('snapshopt received ' + doc.id, '=>', doc.data());
      clinics.push(doc.data());
    });
  }).then(function(end) {
    //clinics.forEach(item => console.log('init clinic item ' + item.Name));

  })
  .catch(err => {
    console.log('Error getting documents front', err);
  });



app.intent('Transport allowance', (conv, {
  TransportType
}) => {

  TransportType = conv.arguments.get('OPTION') || TransportType;
  const dialogflowAgentRef = db.collection('TransportType').doc(TransportType);
  return dialogflowAgentRef.get()
    .then(doc => {
      conv.ask(doc.data().reply);

    })
    .catch(err => {
      console.log('Error getting document', err);
    });
});



app.intent('Subsistence Allowance', (conv, {
  SubsistenceType
}) => {

  SubsistenceType = conv.arguments.get('OPTION') || SubsistenceType;
  const dialogflowAgentRef = db.collection('SubsistenceType').doc(SubsistenceType);
  return dialogflowAgentRef.get()
    .then(doc => {
      conv.ask(doc.data().r1);
    })
    .catch(err => {
      console.log('Error getting document', err);
    });
});


app.intent('Leave', (conv, {
  LeaveType
}) => {

  LeaveType = conv.arguments.get('OPTION') || LeaveType;
  const dialogflowAgentRef = db.collection('Leave').doc(LeaveType);
  return dialogflowAgentRef.get()
    .then(doc => {
      conv.ask(doc.data().reply);
      //agent.add(doc.data().reply1);

    })
    .catch(err => {
      console.log('Error getting document', err);
    });
});


app.intent('Night allowance', (conv, {
  editorType
}) => {
  editorType = conv.arguments.get('OPTION') || editorType;
  const ref = db.collection('NightAllowance').doc(editorType);
  return ref.get()
    .then(doc => {
      conv.ask(doc.data().reply1);
    })
    .catch(err => {
      console.log('Error getting document', err);
    });

});



app.intent('Retirement Benefits', (conv) => {
  conv.ask(new BasicCard({
    image: new Image({
      url: 'https://firebasestorage.googleapis.com/v0/b/hrhelpdesk-ylpebn/o/transferim.PNG?alt=media&token=eeee58fe-aa7d-4d26-8698-139d1fe02acd', //url of your image.
      alt: 'Executive benefits',
    }),
  }));

});



app.intent('sign_in_intent', (conv) => {
  conv.ask(new SignIn('To get your account details'));
});

app.intent('clear', (conv) => {
  conv.user.storage = {};
  conv.ask('user storage cleared.')
});

let sendMails = (ticket, email, user) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      }
    });

    let mailOptions = {
      from: `Starbot <noreply@firebase.com>`,
      to: email,
      subject: 'Starbot support ticket',
      text: 'Hey ' + user + '! We opened a ticket No.  ' + ticket,

    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        throw new Error("Error has come");
      } else {
        let answer = info.response;
        return resolve(1);
        // console.log('Email sent: ' + info.response);
      }
    });
  }).catch(error => {
    console.log(error);
    throw new Error("Error is coming")
  })

}

app.intent('CheckTicket_fallback', (conv) => {

  console.log("conv.raw " + conv.input.raw);
  // console.log ("answer " + {answer});

  return new Promise(function(resolve) {



      return db.collection('tickets').doc(conv.input.raw).get().then(function(docRef) {
        if (!docRef.exists) {

          conv.add('Ticket number does not exist.');
          return resolve(1);
        } else {

          //  console.log ('doc ' + docRef.data().response);
          if (docRef.empty) {
            conv.add('Ticket number does not exist.');
            return resolve(1);
          } else {
            //  console.log("response: ", docRef.data().response);
            var response;
      
        response=docRef.data().response || 'Support has not answered yet.';
    
            conv.add('Support answer: ' + response  );
            conv.ask(new Suggestions('Main menu','Open support ticket', 'Check Ticket'));
            return resolve(1);
          }
        }
      }).catch(err => {
        console.log('Error getting document', err);
      });
   
  }); //end intent
});

app.intent('Openticket_fallback', (conv) => {

  console.log("conv.raw " + conv.input.raw);
  // console.log ("answer " + {answer});

  return new Promise(function(resolve) {


    db.collection('tickets').add({
      "name": conv.user.storage.userName,
      "email": conv.user.storage.email,
      "issue": conv.input.raw,
      "created": admin.firestore.Timestamp.fromDate(new Date()),
    }).then(function(docRef) {

      console.log("Document written with ID: ", docRef.id);
      return resolve(docRef.id);
    })
  }).then(function(result) {
    sendMails(result, conv.user.storage.email, conv.user.storage.userName);

    return result;
  }).then(function(ref) {
    conv.add('Your ticket is open. Your ticket number is ' + ref);
    conv.ask(new Suggestions('Main menu','Open support ticket', 'Check Ticket'));


  });
}); //end intent

app.intent('sign_in_confirmation', (conv, params, signin) => {
  const payload = conv.user.profile.payload;
  conv.user.storage.userName = payload.name;
  conv.user.storage.email = payload.email;
  conv.user.storage.aud = payload.aud;
  conv.user.storage.sub = payload.sub;

  //check for user in database
  return db.collection('users').where('email', '==', payload.email).get().then(function(docRef) {
    if (docRef.empty) { //new user
      console.log('no user found');
      return db.collection('users').add({ //if no email in database do this
          "name": conv.user.storage.userName,
          "email": conv.user.storage.email,
          "aud": conv.user.storage.aud,
          "sub": conv.user.storage.sub,
          "authorised": false,
          "created": admin.firestore.Timestamp.fromDate(new Date()),
        }).then(function(docRef) {
          console.log("Document written with ID: ", docRef.id);
          conv.close('Thank you for registering.');
          // conv.ask(`Hi ${conv.user.storage.userName}. Welcome to Group People Help Desk.I can give Informations about Benefits, Allowances, Transfers, Insurance and many more! What would you like to know?`);
          // conv.ask(new Suggestions('Benefits', 'Allowances', 'Transfers', 'Insurance', 'Find a clinic', 'Open support ticket','Check Ticket'));
          // end new user
        })
        .catch(function(error) {
          console.error("Error adding document: ", error);
        });

      //   conv.ask('Great! Thanks for signing in.');
      //  conv.followup('Welcome');

    } // end new user
    else {
      console.log('user found');
       docRef.forEach(function(doc) {

        //  console.log('data '+doc.data());
          console.log('auth ' + doc.data().authorised);

        if (doc.data().authorised!="false") {
          auth = true;   
console.log("got in");
          conv.ask(`Hi ${conv.user.storage.userName}. Welcome to Group People Help Desk.I can give Informations about Benefits, Allowances, Transfers, Insurance and many more! What would you like to know?`);
          conv.ask(new Suggestions('Benefits', 'Allowances', 'Transfers', 'Insurance', 'Medical', 'Find a clinic', 'Open support ticket', 'Check Ticket'));

        } else {
          auth = false;
          conv.close(' Sorry you are not authorised. Contact administrator for access.');
        }

      });
      
    } // end else if user exists
  }).catch(err => {
    console.log('Error getting document', err);
  }); //end database lookup // end first time access



}); // end intent




app.intent('Clinic', (conv) => {


    const permissions = ['NAME'];
    let context = 'To locate the clinic';
    // Location permissions only work for verified users
    // https://developers.google.com/actions/assistant/guest-users
    if (conv.user.verification === 'VERIFIED') {
      // Could use DEVICE_COARSE_LOCATION instead for city, zip code
      permissions.push('DEVICE_PRECISE_LOCATION');

    }
    const options = {
      context,
      permissions,
    };

    conv.ask(new Permission(options));
 

}); //end intent

app.intent('Clinic_handler', (conv, params, confirmationGranted) => {

  const {
    location
  } = conv.device;
  const {
    latitude,
    longitude
  } = location.coordinates;
  const {
    name
  } = conv.user;
  if (confirmationGranted && name && location) {
    var closest = "none";
    return util.getClosest(latitude, longitude, clinics).then(function(result) {

      const closest = clinics.reduce(
        (acc, loc) =>
        acc.distance < loc.distance ?
        acc :
        loc
      )
      return (closest);


    }).then(function(end) {
      //    console.log('end ' + end.Name);
      conv.ask('Closest clinic is ' + end.distance.toFixed(2) + ' km away from you. ' + end.Name + ' ' + end.Address);
      conv.ask(new Suggestions('More FAQ'));
    }).catch(error => {
      console.error('Geting  clinic failed:', error)
      conv.ask("error " + error);
    });




  } else {
    conv.ask(`Looks like I can't get your location.`);
  }

});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
// project id starbot-2c703
