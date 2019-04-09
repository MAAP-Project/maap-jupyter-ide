
export var getUserInfo = function() {

    console.log(window.parent);
    window.parent._keycloak.loadUserInfo().success(function(profile) {
      console.log(profile);
      // key = profile['public_ssh_keys'];
      return profile;
    }).error(function() {
      console.log('Failed to load profile.');
      return "error";
    });
};

export var getToken = function() {
    return window.parent._keycloak.idToken;
};
