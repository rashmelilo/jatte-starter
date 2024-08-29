/**
 * variables
 */
let chatName = "";
let chatSocket = null;
const chatWindowUrl = window.location.href;
let chatRoomUuid = Math.random().toString(36).slice(2, 12);

console.log("chatRoomUuid", chatRoomUuid);

/**
 * Elements
 */
const chatElement = document.querySelector("#chat");
const chatOpenElement = document.querySelector("#chat_open");
const chatJoinElement = document.querySelector("#chat_join");
const chatIconElement = document.querySelector("#chat_icon");
const chatWelcomeElement = document.querySelector("#chat_welcome");
const chatRoomElement = document.querySelector("#chat_room");
const chatNameElement = document.querySelector("#chat_name");
const chatLogElement = document.querySelector("#chat_log");
const chatInputElement = document.querySelector("#chat_message_input");
const chatSubmitElement = document.querySelector("#chat_message_submit");

/**
 * functions
 */
function scrollToBottom() {
  chatLogElement.scrollTop = chatLogElement.scrollHeight;
}

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function sendMessage() {
  chatSocket.send(
    JSON.stringify({
      type: "message",
      message: chatInputElement.value,
      name: chatName,
    })
  );
  chatInputElement.value = "";
}

function onChatMessage(data) {
  console.log("onChatMessage", data);

  const messageTemplate = `
    <div class="flex ${!data.agent ? "flex-row-reverse" : ""}">
      <span class="inline-block rounded-full bg-gray-300 text-white w-8 h-8 flex items-center justify-center ml-2">${data.initials}</span>
      <div>
        <div class="bg-${!data.agent ? "blue" : "gray"}-300 p-3 rounded-l-lg rounded-br-lg">
          <p class="text-sm">${data.message}</p>
        </div>
        <span class="text-xs text-gray-500 leading-none mt-2 justify-end">${data.created_at} ago </span>
      </div>
    </div>
  `;

  if (data.type === "chat_message") {
    console.log("Processing chat message...");
    // Remove the "agent is typing" message before appending the new message
    removeAgentTypingMessage();
    chatLogElement.innerHTML += messageTemplate;
    console.log(
      data.agent ? "Message from agent:" : "Message from user:",
      data.message,
      data.agent ? "" : "user initials:",
      data.initials
    );
  } else if (data.type === "users_update") {
    // Check if the joining user is an agent
    if (data.agent) {
      chatLogElement.innerHTML += '<p class="mt-2">The admin/agent has joined the chat</p>';
    }
  } else if (data.type === "writing_active" && data.agent) {
    console.log("Agent is typing...");
    // Remove the existing "agent is typing" message before adding a new one
    removeAgentTypingMessage();
    chatLogElement.innerHTML += `
      <div class="tmp-info flex w-full mt-2 space-x-3 max-w-md">
        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 text-center pt-2">${data.initials}</div>
        <div>
          <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
            <p class="text-sm">The agent is typing a message...</p>
          </div>
        </div>
      </div>`;
  }

  scrollToBottom();
}

// Function to remove the "agent is typing" message
function removeAgentTypingMessage() {
  const tmpInfo = document.querySelector(".tmp-info");
  if (tmpInfo) {
    tmpInfo.remove();
  }
}

function scrollToBottom(elementId) {
  var element = document.getElementById(elementId);
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

async function joinChatRoom() {
  console.log("joinChatRoom");
  chatName = chatNameElement.value;
  console.log("join as:", chatName);
  console.log("Room Uuid:", chatRoomUuid);
  const data = new FormData();
  console.log("data is", data);
  data.append("name", chatName);
  data.append("urls", chatWindowUrl);

  await fetch(`/api/create-room/${chatRoomUuid}/`, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: data,
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log("data", data);
    });

  chatSocket = new WebSocket(`ws://${window.location.host}/ws/${chatRoomUuid}/`);
  chatSocket.onmessage = function (e) {
    console.log("WebSocket message received:", e.data);
    onChatMessage(JSON.parse(e.data));
  };

  chatSocket.onopen = function (e) {
    console.log("onopen - chat socket was opened");
    scrollToBottom();
  };

  chatSocket.onclose = function (e) {
    console.log("onclose - chat socket was closed");
  };
}

/**
 * Event Listeners
 */
chatOpenElement.onclick = function (e) {
  e.preventDefault();

  chatIconElement.classList.add("hidden");
  chatWelcomeElement.classList.remove("hidden");
  return false;
};

chatJoinElement.onclick = function (e) {
  e.preventDefault();

  chatWelcomeElement.classList.add("hidden");
  chatRoomElement.classList.remove("hidden");

  joinChatRoom();

  return false;
};

chatSubmitElement.onclick = function (e) {
  e.preventDefault();
  sendMessage();
  return false;
};

chatInputElement.onkeyup = function (e) {
  if (e.keyCode === 13) {
    e.preventDefault();
    sendMessage();
  }
};

chatInputElement.onfocus = function (e) {
  chatSocket.send(
    JSON.stringify({
      type: "update",
      message: "writing_active",
      name: chatName,
    })
  );
};
