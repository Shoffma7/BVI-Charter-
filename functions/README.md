Deploy from the repo root on any computer with Node 20:
  npm i -g firebase-tools && firebase login
  cd functions && npm install && cd ..
  firebase deploy --only functions
