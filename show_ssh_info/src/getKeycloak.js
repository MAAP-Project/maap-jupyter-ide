
export var getUserInfo = function(callback) {

  console.log(window.parent);
  window.parent._keycloak.loadUserInfo().success(function(profile) {
    console.log(profile);
    // key = profile['public_ssh_keys'];
    callback(profile);

  }).error(function() {
    console.log('Failed to load profile.');
    return "error";
  });
};

export async function getUserInfoAsyncWrapper() {
  return new Promise((resolve) => {
    getUserInfo((callback) => {
          resolve(callback);
      });
  });
}

export var getToken = function() {
    return window.parent._keycloak.idToken;
};

export var updateKeycloakToken = function(seconds) {
    return window.parent._keycloak.updateToken(seconds);
};