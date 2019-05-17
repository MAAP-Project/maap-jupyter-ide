
export var showNavbar = function() {

    window.parent.postMessage("show-navbar", "*");
};

export var hideNavbar = function() {

    window.parent.postMessage("hide-navbar", "*");
};

