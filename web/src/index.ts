import { ServiceException } from "@aws-sdk/client-lambda";
import { Stats } from "webpack";
import api from "./api";
import "./style.css"

var state = {
    status: "Unknown",
    ip: ""
}

let mainButton = document.getElementById("button") as HTMLButtonElement
let overlay = document.getElementById("overlay")

let overlayYesButton = document.getElementById("overlay-button-yes")

overlay.onclick = hideOverlay;
overlayYesButton.onclick = handleOverlayButtonClick
mainButton.onclick = handleButtonClick;


class StateMismatchError extends Error{}

// returns whether the server should be started or stopped
// when the button is clicked
// true -> start
// false -> stop
function shouldStart() : boolean {
    switch (state.status) {
        case "Running":
            return false;
        case "Stopped":
            return true;
    }
}

async function checkStateMismatch() {
    let newState = await api.getServerStatus();
    if (state.status !== newState.status || state.ip !== newState.ip) {
        state = newState
        main()
        throw new StateMismatchError("Local state does not match remote state")
    }
}

function changeStatus() {
    let element = document.getElementById("status");
    let ip = document.getElementById("ip")
    element.innerHTML = state.status;

    if (state.status === "Running") {
        element.className = "running"
        ip.className = ""
        ip.innerHTML = state.ip
    }

    else if (state.status === "Stopped") {
        ip.innerHTML = ""
        ip.className="disabled"
        element.className = "notrunning"
    }

    else {
        ip.innerHTML = ""
        ip.className = "disabled"
        element.className = "intermediate"
    }

}

function changeMainButton() {
    switch (state.status) {
        case "Running":
            mainButton.innerHTML = "Stop Server"
            mainButton.disabled = false;
            break
        case "Stopped":
            mainButton.innerHTML = "Start Server"
            mainButton.disabled = false;
            break
        default:
            mainButton.disabled = true
            break
    }
}

function showOverlay() {
    let text = `Are you sure you want to ${shouldStart() ? 'start' : 'stop'} the server`
    let popupText = document.getElementById("popup-text")
    popupText.innerHTML = text;
    // rmeove the disabled class
    overlay.className = ""
}

function hideOverlay() {
    overlay.className = "disabled"
}

async function handleOverlayButtonClick() {
    mainButton.disabled=true;
    await checkStateMismatch(); 
    let start = shouldStart()

    if (start)
        await api.startServer()
    else
        await api.stopServer()
    main()
}


function handleButtonClick() {
    showOverlay()
}

// TODO: fix the checking server status twice glitch
async function main() {
    state = await api.getServerStatus();
    if (["Starting", "Stopping"].includes(state.status)) {
        console.log("pooppy diapers");
        setTimeout(main, 2000);
    }
    changeStatus();
    changeMainButton();
}

main();