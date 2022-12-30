

function scrollMessageListToBottom() {
    var element = document.getElementsByClassName("rce-mlist")[0];
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

export default scrollMessageListToBottom