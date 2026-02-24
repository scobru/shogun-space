
renderNotifications();

function renderNotifications() {
    console.log("isValidUsername defined?", typeof isValidUsername === 'function');
    if (isValidUsername("test")) {
        console.log("It works");
    }
}

function isValidUsername(str) {
    return true;
}
