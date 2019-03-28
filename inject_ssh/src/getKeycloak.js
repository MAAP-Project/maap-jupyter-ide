
export var getKeycloak = function() {

    Window._keycloak.loadUserInfo().success(function(profile) {
      console.log(profile);
      // key = profile['public_ssh_keys'];
      return profile;
    }).error(function() {
      console.log('Failed to load profile.');
      return "error";
    });
};

// exports.getKeycloak = getKeycloak;
