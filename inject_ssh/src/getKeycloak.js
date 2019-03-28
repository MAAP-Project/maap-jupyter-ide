
function getKeycloak() {

    Window._keycloak.loadUserInfo().success(function(profile:any) {
      console.log(profile);
      // key = profile['public_ssh_keys'];
      return profile;
    }).error(function() {
      console.log('Failed to load profile.');
      return "error";
    });
}

module.exports = getKeycloak;