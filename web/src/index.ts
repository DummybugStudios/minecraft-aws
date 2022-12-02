import api from "./api";

var state = {
    status: "Unknown",
    ip: ""
}

function changeStatus() {
    let element = document.getElementById("status");
    let ip = document.getElementById("ip")
    element.innerHTML = state.status;

    if (state.status === "Running") {
        element.className = "running"
        ip.innerHTML = state.ip
    }

    else if (state.status === "Stopped") {
        ip.innerHTML = ""
        element.className = "notrunning"
    }

    else {
        ip.innerHTML = ""
        element.className = "intermediate"
    }

}

function changeButton() {
    let button = document.getElementById("button") as HTMLButtonElement
    switch (state.status) {
        case "Running":
            button.innerHTML = "Stop Server"
            button.disabled = false;
            break
        case "Stopped":
            button.innerHTML = "Start Server"
            button.disabled = false;
            break
        default:
            button.disabled = true
            break
    }
}


async function handleButtonClick(event :any) {
    // Only do something if the current view is not out of date 
    // otherwise just update the page with the new state
    event.target.disabled = true;
    let newState = await api.getServerStatus();
    if (state.status !== newState.status || state.ip !== newState.ip) {
        state = newState;
        main();
        return;
    }
    if (state.status == "Running") {
        api.stopServer()
    }
    else if (state.status === "Stopped") {
        api.startServer()
    }
    main();
}


async function main() {
    state = await api.getServerStatus();
    if (["Starting", "Stopping"].includes(state.status)) {
        console.log("pooppy diapers");
        setTimeout(main, 2000);
    }
    changeStatus();
    changeButton();
}

document.getElementById("button").onclick = handleButtonClick;
main();